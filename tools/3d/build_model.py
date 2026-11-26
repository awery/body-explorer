"""
Build the 3D body model (3d/model/body.glb) from BodyParts3D meshes.

Run with Blender 4.2+ (tested with 5.0), headless:

    blender -b --factory-startup -Y --python-exit-code 1 \
        -P tools/3d/build_model.py -- \
        --bp3d /path/to/bodyparts3d --out 3d/model/body.glb

--bp3d must contain the files from https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html :
    partof_element_parts.txt
    partof_BP3D_4.0_obj_99/FJ*.obj   (unzipped partof_BP3D_4.0_obj_99.zip)

What it does, for each body part of the app (ids match js/content.js):
  1. collects the BodyParts3D element meshes of the listed anatomical concepts
     (an element is used by the first part that claims it, so the order matters);
  2. joins them, welds seams, fixes normals and shades smooth;
     the skin also gets swim shorts (see dress_skin), so the model suits children;
  3. decimates to a triangle budget so the whole body stays light for tablets;
  4. converts millimetres to metres, centres the body (feet on the floor).
Then everything is written as one GLB (glTF binary). Positions and normals are stored as
16-bit / 8-bit integers (KHR_mesh_quantization), which keeps the file small and needs no
decoder library (and no numpy, so it also works with distribution-packaged Blender).
Each node is named after the part id and carries {"part": id, "system": system} as extras.

BodyParts3D, (c) The Database Center for Life Science, licensed under CC Attribution 4.0 International.
"""

import argparse
import json
import os
import struct
import sys
import time
from array import array

import bmesh
import bpy
from mathutils import Matrix, Vector

# part id -> (system, [BodyParts3D concept names], triangle budget)
PARTS = {
    # Skin & senses (eyes/nose/tongue before skin and skull so they keep their own meshes)
    'eyes': ('skin', ['left eyeball', 'right eyeball'], 3000),
    'nose': ('skin', ['external nose'], 2500),
    'mouth': ('skin', ['tongue'], 2500),
    'skin': ('skin', ['skin'], 70000),
    # Skeleton
    'skull': ('skeleton', ['skull'], 45000),
    'spine': ('skeleton', ['vertebral column'], 30000),
    'ribs': ('skeleton', ['rib cage', 'sternum'], 30000),
    'collarbone': ('skeleton', ['left clavicle', 'right clavicle'], 3000),
    'humerus': ('skeleton', ['left humerus', 'right humerus'], 5000),
    'forearm': ('skeleton', ['left radius', 'left ulna', 'right radius', 'right ulna'], 6000),
    'hand': ('skeleton', ['left hand', 'right hand'], 14000),
    'pelvis': ('skeleton', ['bony pelvis'], 14000),
    'femur': ('skeleton', ['left femur', 'right femur'], 6000),
    'kneecap': ('skeleton', ['left patella', 'right patella'], 1500),
    'shin': ('skeleton', ['left tibia', 'left fibula', 'right tibia', 'right fibula'], 6000),
    'foot': ('skeleton', ['left foot', 'right foot'], 14000),
    # Brain & nerves (BodyParts3D has no peripheral nerves)
    'brain': ('nervous', ['brain'], 45000),
    'spinalCord': ('nervous', ['spinal cord'], 3000),
    # Heart & blood (heart first so its own vessels stay with it)
    'heart': ('circulatory', ['heart'], 25000),
    'arteries': ('circulatory', ['systemic arterial system'], 60000),
    'veins': ('circulatory', ['systemic venous system'], 30000),
    # Breathing
    'trachea': ('respiratory', ['trachea'], 5000),
    'lungs': ('respiratory', ['left lung', 'right lung'], 30000),
    'diaphragm': ('respiratory', ['diaphragm'], 8000),
    # Digestion
    'esophagus': ('digestive', ['esophagus'], 2500),
    'stomach': ('digestive', ['stomach'], 6000),
    'liver': ('digestive', ['liver', 'gallbladder'], 16000),
    'pancreas': ('digestive', ['pancreas'], 5000),
    'smallIntestine': ('digestive', ['small intestine'], 20000),
    'largeIntestine': ('digestive', ['large intestine'], 14000),
    # Kidneys & bladder
    'kidneys': ('urinary', ['left kidney', 'right kidney', 'left ureter', 'right ureter'], 8000),
    'bladder': ('urinary', ['urinary bladder'], 3000),
}


def parse_args():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument('--bp3d', required=True, help='folder with BodyParts3D part-of files')
    p.add_argument('--out', required=True, help='output .glb path')
    return p.parse_args(argv)


def load_concepts(bp3d):
    """concept name -> list of element ids (FJ...)."""
    concepts = {}
    with open(os.path.join(bp3d, 'partof_element_parts.txt'), encoding='utf-8') as f:
        next(f)
        for line in f:
            _cid, name, fj = line.rstrip('\n').split('\t')
            concepts.setdefault(name, []).append(fj)
    return concepts


def read_obj(path):
    """Minimal OBJ reader: vertices and (triangulated) faces, ignoring normals/uvs."""
    verts, faces = [], []
    with open(path, encoding='utf-8', errors='replace') as f:
        for line in f:
            if line.startswith('v '):
                _, x, y, z = line.split()[:4]
                verts.append((float(x), float(y), float(z)))
            elif line.startswith('f '):
                idx = [int(tok.split('/')[0]) for tok in line.split()[1:]]
                idx = [i - 1 if i > 0 else len(verts) + i for i in idx]
                for k in range(1, len(idx) - 1):
                    faces.append((idx[0], idx[k], idx[k + 1]))
    return verts, faces


def build_part(part_id, element_files):
    verts, faces = [], []
    for path in element_files:
        v, f = read_obj(path)
        off = len(verts)
        verts.extend(v)
        faces.extend((a + off, b + off, c + off) for a, b, c in f)

    mesh = bpy.data.meshes.new(part_id)
    mesh.from_pydata(verts, [], faces)
    mesh.validate()

    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.05)  # weld seams between elements (mm)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(part_id, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def dress_skin(obj, band=(0.665, 1.03)):
    """Make the (adult, unclothed) BodyParts3D skin suitable for children.

    Works in metres, Blender axes (x = side, -y = front, z = up), after centring.
    1. Marks the hip area as swim shorts in a per-vertex 'shorts' attribute (0..1). Only the
       part of the height band connected to the body's centre line is marked, so the arms
       and hands hanging next to the hips are left out. The shader paints it with crisp edges.
    2. Flattens and smooths the genital area into a soft, fabric-like shape.
    """
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.verts.ensure_lookup_table()
    lo, hi = band
    in_band = lambda v: lo <= v.co.z <= hi

    # 1. Shorts mask: flood fill inside the band from vertices on the centre line.
    seeds = [v for v in bm.verts if in_band(v) and abs(v.co.x) < 0.02]
    marked = set(v.index for v in seeds)
    stack = list(seeds)
    while stack:
        v = stack.pop()
        for e in v.link_edges:
            w = e.other_vert(v)
            if w.index not in marked and in_band(w):
                marked.add(w.index)
                stack.append(w)

    # 2. Flatten the front bulge, then smooth the area.
    region = [v for v in bm.verts if abs(v.co.x) < 0.075 and 0.715 <= v.co.z <= 0.89 and -v.co.y > -0.01]
    for v in region:
        # A gentle dome that meets the surrounding surface (~5.2 cm in front at |x| = 5 cm).
        t = min(1.0, abs(v.co.x) / 0.05)
        cap = 0.052 + 0.01 * (1 - t * t)
        if abs(v.co.x) < 0.05 and 0.74 <= v.co.z <= 0.875 and -v.co.y > cap:
            v.co.y = -cap
    for _ in range(25):
        bmesh.ops.smooth_vert(bm, verts=region, factor=0.7, use_axis_x=True, use_axis_y=True, use_axis_z=True)

    bm.to_mesh(obj.data)
    bm.free()
    attr = obj.data.attributes.new('shorts', 'FLOAT', 'POINT')
    attr.data.foreach_set('value', [1.0 if i in marked else 0.0 for i in range(len(obj.data.vertices))])
    obj.data.update()
    print(f'  dressed skin: {len(marked)} shorts vertices, {len(region)} smoothed', flush=True)


def decimate(obj, budget):
    tris = len(obj.data.polygons)
    if tris <= budget:
        return tris
    mod = obj.modifiers.new('decimate', 'DECIMATE')
    mod.decimate_type = 'COLLAPSE'
    mod.ratio = budget / tris
    mod.use_collapse_triangulate = True
    with bpy.context.temp_override(object=obj, active_object=obj, selected_objects=[obj]):
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return len(obj.data.polygons)


def write_glb(objects, out_path):
    """Write meshes as a quantized GLB (KHR_mesh_quantization), Y-up, one node per part."""
    bin_chunks = []
    offset = 0

    def add_view(data, target):
        nonlocal offset
        raw = data.tobytes()
        pad = (-len(raw)) % 4
        bin_chunks.append(raw + b'\0' * pad)
        view = {'buffer': 0, 'byteOffset': offset, 'byteLength': len(raw), 'target': target}
        offset += len(raw) + pad
        return view

    gltf = {
        'asset': {'version': '2.0', 'generator': 'body-explorer tools/3d/build_model.py',
                  'copyright': 'BodyParts3D, (c) The Database Center for Life Science, CC BY 4.0'},
        'extensionsUsed': ['KHR_mesh_quantization'],
        'extensionsRequired': ['KHR_mesh_quantization'],
        'scene': 0, 'scenes': [{'nodes': []}], 'nodes': [], 'meshes': [],
        'buffers': [], 'bufferViews': [], 'accessors': [],
    }

    def accessor(view, ctype, count, atype, normalized=False, mn=None, mx=None):
        gltf['bufferViews'].append(view)
        acc = {'bufferView': len(gltf['bufferViews']) - 1, 'componentType': ctype, 'count': count, 'type': atype}
        if normalized:
            acc['normalized'] = True
        if mn is not None:
            acc['min'], acc['max'] = mn, mx
        gltf['accessors'].append(acc)
        return len(gltf['accessors']) - 1

    for obj in objects:
        mesh = obj.data
        mesh.calc_loop_triangles()
        # Blender Z-up -> glTF Y-up: (x, y, z) -> (x, z, -y)
        co = [(v.co.x, v.co.z, -v.co.y) for v in mesh.vertices]
        no = [(v.normal.x, v.normal.z, -v.normal.y) for v in mesh.vertices]
        lo = [min(c[i] for c in co) for i in range(3)]
        hi = [max(c[i] for c in co) for i in range(3)]
        centre = [(lo[i] + hi[i]) / 2 for i in range(3)]
        scale = max(hi[i] - lo[i] for i in range(3)) / 2 or 1.0  # uniform, so normals stay correct

        # int16 xyz + 1 padding value: glTF requires 4-byte aligned vertex strides (8 bytes here).
        pos8 = array('h')
        for c in co:
            pos8.extend(max(-32767, min(32767, round((c[i] - centre[i]) / scale * 32767))) for i in range(3))
            pos8.append(0)
        nrm = array('b')  # int8 xyz + padding (stride 4)
        for n in no:
            nrm.extend(max(-127, min(127, round(n[i] * 127))) for i in range(3))
            nrm.append(0)
        shorts = mesh.attributes.get('shorts')
        idx = array('H' if len(co) < 65536 else 'I')
        for t in mesh.loop_triangles:
            idx.extend(t.vertices)

        pmin = [min(pos8[i::4]) for i in range(3)]
        pmax = [max(pos8[i::4]) for i in range(3)]
        pv = add_view(pos8, 34962); pv['byteStride'] = 8
        a_pos = accessor(pv, 5122, len(co), 'VEC3', True, pmin, pmax)
        nv = add_view(nrm, 34962); nv['byteStride'] = 4
        a_nrm = accessor(nv, 5120, len(co), 'VEC3', True)
        a_idx = accessor(add_view(idx, 34963), 5123 if idx.typecode == 'H' else 5125, len(idx), 'SCALAR')

        attributes = {'POSITION': a_pos, 'NORMAL': a_nrm}
        if shorts:
            # Custom attribute (glTF requires a leading underscore): uint8 0..255, 4-byte stride.
            sh = array('B')
            for d in shorts.data:
                sh.extend((round(max(0.0, min(1.0, d.value)) * 255), 0, 0, 0))
            sv = add_view(sh, 34962); sv['byteStride'] = 4
            attributes['_SHORTS'] = accessor(sv, 5121, len(co), 'SCALAR', True)

        gltf['meshes'].append({'name': obj.name, 'primitives': [
            {'attributes': attributes, 'indices': a_idx, 'mode': 4}]})
        gltf['nodes'].append({'name': obj.name, 'mesh': len(gltf['meshes']) - 1,
                              'translation': centre, 'scale': [scale] * 3,
                              'extras': {'part': obj['part'], 'system': obj['system']}})
        gltf['scenes'][0]['nodes'].append(len(gltf['nodes']) - 1)

    binary = b''.join(bin_chunks)
    gltf['buffers'].append({'byteLength': len(binary)})
    js = json.dumps(gltf, separators=(',', ':')).encode()
    js += b' ' * ((-len(js)) % 4)
    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    with open(out_path, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(binary)))
        f.write(struct.pack('<II', len(js), 0x4E4F534A) + js)
        f.write(struct.pack('<II', len(binary), 0x004E4942) + binary)


def main():
    args = parse_args()
    t0 = time.time()
    objdir = os.path.join(args.bp3d, 'partof_BP3D_4.0_obj_99')
    concepts = load_concepts(args.bp3d)

    missing = [n for _s, names, _b in PARTS.values() for n in names if n not in concepts]
    if missing:
        raise SystemExit(f'Unknown BodyParts3D concepts: {missing}')

    # Start from an empty scene.
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)

    claimed = set()
    objects = []
    report = []
    for part_id, (system, names, budget) in PARTS.items():
        files = []
        for name in names:
            for fj in concepts[name]:
                path = os.path.join(objdir, fj + '.obj')
                if fj in claimed or not os.path.exists(path):
                    continue
                claimed.add(fj)
                files.append(path)
        if not files:
            raise SystemExit(f'No meshes left for part {part_id}')
        obj = build_part(part_id, files)
        before = len(obj.data.polygons)
        after = decimate(obj, budget)
        for p in obj.data.polygons:
            p.use_smooth = True
        obj['part'] = part_id
        obj['system'] = system
        objects.append(obj)
        report.append((part_id, system, len(files), before, after))
        print(f'  {part_id:15} {system:12} {len(files):4} meshes  {before:7} -> {after:6} triangles', flush=True)

    # Millimetres -> metres; centre on x/y; feet at z = 0.
    lo = Vector((float('inf'),) * 3)
    hi = Vector((float('-inf'),) * 3)
    for obj in objects:
        for v in obj.data.vertices:
            lo = Vector(map(min, lo, v.co))
            hi = Vector(map(max, hi, v.co))
    centre = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))
    transform = Matrix.Scale(0.001, 4) @ Matrix.Translation(-centre)
    for obj in objects:
        obj.data.transform(transform)
        obj.data.update()
    size = (hi - lo) * 0.001
    dress_skin(next(o for o in objects if o['part'] == 'skin'))
    print(f'Body size (m): x={size.x:.3f} y={size.y:.3f} z={size.z:.3f}')

    write_glb(objects, args.out)

    total = sum(r[4] for r in report)
    print(f'Exported {len(objects)} parts, {total} triangles, '
          f'{os.path.getsize(args.out) / 1e6:.2f} MB -> {args.out} in {time.time() - t0:.0f}s')


if __name__ == '__main__':
    main()
