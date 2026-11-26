/*
 * Builds the layered SVG illustration of the body (front view).
 *
 * Coordinate system: viewBox 0 0 400 800, body centred on x = 200.
 * Most shapes are drawn for the viewer's left side and mirrored.
 *
 * Structure of the generated SVG:
 *   <g class="ghost">                       faint outline, always visible
 *   <g class="layer" data-layer="…">        one group per body system
 *     <g class="part" data-part="…">        one group per clickable part
 *   <g class="overlay">                     highlight clones (filled by app.js)
 */
(function (root) {
  'use strict';

  const W = 400;
  const VIEWBOX = { x: 0, y: 10, w: 400, h: 790 };

  // Layers from deepest (drawn first) to outermost (drawn last).
  const DRAW_ORDER = ['skeleton', 'urinary', 'digestive', 'respiratory', 'circulatory', 'nervous', 'muscles', 'skin'];

  /* ───────────── geometry helpers ───────────── */

  const r1 = (n) => Math.round(n * 10) / 10;

  // Smooth closed (or open) curve through points, using Catmull-Rom → cubic Bézier.
  function smooth(pts, closed = true) {
    const n = pts.length;
    const P = (i) => (closed ? pts[(i + n) % n] : pts[Math.min(n - 1, Math.max(0, i))]);
    let d = `M${r1(pts[0][0])},${r1(pts[0][1])}`;
    const segments = closed ? n : n - 1;
    for (let i = 0; i < segments; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${r1(c1[0])},${r1(c1[1])} ${r1(c2[0])},${r1(c2[1])} ${r1(p2[0])},${r1(p2[1])}`;
    }
    return closed ? `${d}Z` : d;
  }

  // Mirror a path made only of absolute "x,y" pairs (M, L, C, Q) across x = 200.
  const mirrorD = (d) => d.replace(/(-?\d*\.?\d+),(-?\d*\.?\d+)/g, (_, x, y) => `${r1(W - parseFloat(x))},${y}`);

  // Shape descriptors, rendered by `outlined()`.
  const F = (d) => ({ k: 'f', d });                       // filled path
  const S = (pts) => F(smooth(pts));                      // smooth filled blob
  const L = (d, w) => ({ k: 'l', d, w });                 // stroked line of width w
  const C = (cx, cy, r) => ({ k: 'c', cx, cy, r });       // circle
  const E = (cx, cy, rx, ry) => ({ k: 'e', cx, cy, rx, ry });
  const R = (x, y, w, h, rx) => ({ k: 'r', x, y, w, h, rx });

  function mirror(s) {
    switch (s.k) {
      case 'f': case 'l': return { ...s, d: mirrorD(s.d) };
      case 'c': case 'e': return { ...s, cx: W - s.cx };
      case 'r': return { ...s, x: W - s.x - s.w };
      default: return s;
    }
  }
  const both = (shapes) => shapes.concat(shapes.map(mirror));

  function shapeEl(s, fill, stroke, sw) {
    const st = stroke ? ` stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"` : '';
    switch (s.k) {
      case 'f': return `<path d="${s.d}" fill="${fill}"${st}/>`;
      case 'c': return `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" fill="${fill}"${st}/>`;
      case 'e': return `<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}" fill="${fill}"${st}/>`;
      case 'r': return `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="${s.rx || 0}" fill="${fill}"${st}/>`;
      case 'l':
        return `<path d="${s.d}" fill="none" stroke="${stroke || fill}" stroke-width="${r1(s.w + (stroke ? sw : 0))}" stroke-linecap="round" stroke-linejoin="round"/>`;
      default: return '';
    }
  }

  // Draw shapes twice: an outline pass, then a fill pass. Overlapping shapes
  // therefore merge into one clean silhouette with a single outline.
  function outlined(shapes, fill, line, sw = 3) {
    return `<g class="ol">${shapes.map((s) => shapeEl(s, line, line, sw)).join('')}</g>`
      + `<g class="fl">${shapes.map((s) => shapeEl(s, fill)).join('')}</g>`;
  }

  // Classic cartoon bone: a shaft with two knobs at each end.
  function bone(x1, y1, x2, y2, w) {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const nx = -(y2 - y1) / len, ny = (x2 - x1) / len;
    const o = w * 0.42, r = w * 0.62;
    return [
      L(`M${x1},${y1} L${x2},${y2}`, w),
      C(r1(x1 + nx * o), r1(y1 + ny * o), r1(r)), C(r1(x1 - nx * o), r1(y1 - ny * o), r1(r)),
      C(r1(x2 + nx * o), r1(y2 + ny * o), r1(r)), C(r1(x2 - nx * o), r1(y2 - ny * o), r1(r)),
    ];
  }

  // Finger/toe made of small segments with gaps between the joints.
  function digit(x1, y1, x2, y2, w, segs = 3) {
    const out = [];
    const gap = 0.08;
    for (let i = 0; i < segs; i++) {
      const a = i / segs + (i ? gap / 2 : 0), b = (i + 1) / segs - gap / 2;
      out.push(L(`M${r1(x1 + (x2 - x1) * a)},${r1(y1 + (y2 - y1) * a)} L${r1(x1 + (x2 - x1) * b)},${r1(y1 + (y2 - y1) * b)}`, w));
    }
    return out;
  }

  // Raw markup helpers.
  const symMarkup = (m) => `${m}<g transform="matrix(-1 0 0 1 ${W} 0)">${m}</g>`;
  const hitLine = (d, w = 12) => `<path d="${d}" fill="none" stroke="#000" stroke-opacity="0" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const hitShape = (markup) => `<g fill="#000" fill-opacity="0">${markup}</g>`;
  const detail = (d, color, w = 1.2, extra = '') => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
  const part = (id, inner) => `<g class="part" data-part="${id}">${inner}</g>`;

  /* ───────────── silhouette ───────────── */

  const HEAD = [[200, 26], [230, 32], [250, 58], [252, 92], [246, 120], [230, 142], [212, 153], [200, 155], [188, 153], [170, 142], [154, 120], [148, 92], [150, 58], [170, 32]];
  const NECK = 'M181,128 L219,128 L223,186 L177,186 Z';

  // Viewer's left half of the body outline, from the neck down to the inner leg.
  const BODY_LEFT = [
    [180, 170], [150, 182], [122, 192], [106, 212], [98, 250], [90, 300], [82, 345], [72, 400], [64, 445],
    [56, 470], [54, 495], [64, 515], [80, 512], [88, 490], [86, 462], [88, 448],
    [100, 400], [112, 350], [122, 300], [134, 262],
    [140, 300], [144, 350], [140, 400], [134, 440], [134, 480],
    [140, 560], [146, 630], [148, 700], [152, 752], [140, 772], [146, 786], [186, 788], [192, 770], [188, 750],
    [186, 700], [186, 640], [190, 560],
  ];
  const BODY = smooth([...BODY_LEFT, [200, 488], ...BODY_LEFT.map(([x, y]) => [W - x, y]).reverse()]);

  const silhouetteShapes = () => [F(smooth(HEAD)), F(NECK), F(BODY)];
  const earShapes = () => both([E(148, 96, 9, 15)]);

  function ghost() {
    return `<g class="ghost" aria-hidden="true">${outlined([...earShapes(), ...silhouetteShapes()], '#fff', '#ccc', 4)}</g>`;
  }

  /* ───────────── skin & senses ───────────── */

  function skinLayer() {
    const SKIN = '#f7c9a3', LINE = '#cf956c', HAIR = '#7a4a2a', HAIR_LINE = '#4e2d17';

    const ears = part('ears',
      outlined(earShapes(), SKIN, LINE, 3)
      + symMarkup(detail('M147,87 Q140,96 147,105', LINE, 2)));

    const skin = part('skin',
      outlined(silhouetteShapes(), SKIN, LINE, 3)
      + symMarkup('<circle cx="170" cy="114" r="8" fill="#f29c9c" opacity=".35"/>')
      + detail('M197,372 Q200,377 203,372', LINE, 1.6)                       // belly button
      + symMarkup(detail('M66,500 L68,489 M72,507 L73,493 M79,506 L79,493', LINE, 1.2)) // fingers
      + symMarkup(detail('M160,632 Q166,638 174,634', LINE, 1.4))            // knees
      + symMarkup(detail('M160,782 L161,776 M168,784 L168,777 M176,784 L176,777', LINE, 1.1))); // toes

    const hair = part('hair', outlined([S([
      [148, 98], [144, 66], [156, 38], [182, 20], [218, 20], [244, 38], [256, 66], [252, 98],
      [246, 80], [236, 64], [220, 56], [204, 62], [190, 55], [170, 60], [156, 76],
    ])], HAIR, HAIR_LINE, 3));

    const eye = '<g class="blink">'
      + `<ellipse cx="180" cy="93" rx="10.5" ry="8.5" fill="#fff" stroke="${LINE}" stroke-width="1.5"/>`
      + '<circle class="iris" cx="181.5" cy="94" r="5.8" fill="#4a7cc2"/>' // colour comes from CSS --eye-color
      + '<circle cx="181.5" cy="94" r="2.9" fill="#1d2230"/>'
      + '<circle cx="183.5" cy="91.8" r="1.5" fill="#fff"/></g>'
      + detail('M169,77 Q180,71 191,77', HAIR, 3);
    const eyes = part('eyes', hitShape(symMarkup('<ellipse cx="180" cy="88" rx="14" ry="16"/>')) + symMarkup(eye));

    const nose = part('nose',
      hitShape('<ellipse cx="200" cy="108" rx="9" ry="11"/>')
      + detail('M200,99 C196,107 193,114 198,116.5 C200,117.5 203,116.5 205,114', LINE, 2.4));

    const mouth = part('mouth',
      hitShape('<ellipse cx="200" cy="129" rx="18" ry="9"/>')
      + '<path d="M184,124 Q200,141 216,124 Q200,131 184,124 Z" fill="#c4524e" stroke="#9e3b38" stroke-width="1.5" stroke-linejoin="round"/>'
      + '<ellipse cx="200" cy="132" rx="6" ry="2.6" fill="#ef8a8a"/>');

    return ears + skin + hair + eyes + nose + mouth;
  }

  /* ───────────── skeleton ───────────── */

  function skeletonLayer() {
    const BONE = '#f6f0dc', LINE = '#a99a76', DARK = '#5a4e3c';
    const ol = (shapes) => outlined(shapes, BONE, LINE, 2.6);

    const skull = part('skull',
      ol([
        S([[200, 34], [232, 42], [246, 70], [244, 100], [234, 114], [226, 118], [174, 118], [166, 114], [156, 100], [154, 70], [168, 42]]),
        S([[170, 110], [174, 134], [186, 146], [200, 149], [214, 146], [226, 134], [230, 110], [214, 120], [186, 120]]),
      ])
      + symMarkup(`<ellipse cx="182" cy="90" rx="11.5" ry="10.5" fill="${DARK}"/>`)
      + `<path d="M200,100 L194,113 L206,113 Z" fill="${DARK}"/>`
      + `<rect x="184" y="120" width="32" height="10" rx="3" fill="#fff" stroke="${LINE}" stroke-width="1.2"/>`
      + detail('M184,125 H216 M190,120 V130 M195,120 V130 M200,120 V130 M205,120 V130 M210,120 V130', LINE, 1));

    const vertebrae = [];
    for (let y = 140; y <= 410; y += 11) {
      const w = y < 186 ? 14 : y < 330 ? 16 : 22;
      vertebrae.push(R(200 - w / 2, y, w, 8.5, 3));
    }
    const spine = part('spine', ol(vertebrae));

    const ribShapes = [];
    const outer = [166, 156, 150, 147, 146, 146, 147, 149, 152, 156];
    outer.forEach((ox, i) => {
      const y = 204 + i * 12.5;
      ribShapes.push(L(`M196,${y} C${ox + 14},${r1(y - 8)} ${ox - 4},${r1(y + 2)} ${ox + 2},${r1(y + 20)}`, 4.6));
    });
    const ribs = part('ribs', ol([...both(ribShapes), R(193, 198, 14, 98, 6)]));

    const collarbone = part('collarbone', ol(both([L('M196,186 C175,180 150,196 124,194', 7)])));

    const humerus = part('humerus', ol(both(bone(117, 214, 98, 336, 9))));
    const forearm = part('forearm', ol(both([...bone(93, 350, 70, 438, 5), ...bone(103, 352, 82, 440, 5)])));

    const handShapes = [
      C(72, 452, 4), C(79, 450, 4), C(76, 457, 4), C(83, 456, 3.5),
      ...digit(69, 463, 60, 505, 3.4), ...digit(74, 465, 67, 511, 3.4), ...digit(78, 465, 75, 511, 3.4),
      ...digit(82, 464, 81, 505, 3.4), ...digit(86, 460, 90, 486, 3.6, 2),
    ];
    const hand = part('hand', ol(both(handShapes)));

    const pelvis = part('pelvis',
      ol([
        ...both([S([[194, 420], [178, 404], [158, 398], [144, 406], [142, 426], [150, 446], [164, 462], [184, 472], [198, 470]])]),
        F('M188,410 L212,410 L207,448 L200,456 L193,448 Z'),
      ])
      + symMarkup(`<ellipse cx="178" cy="456" rx="7" ry="5.5" fill="${LINE}" opacity=".55"/>`)
      + detail('M194,424 L206,424 M195,434 L205,434 M196,444 L204,444', LINE, 1));

    const femur = part('femur', ol(both(bone(164, 462, 166, 626, 11))));
    const kneecap = part('kneecap', ol(both([C(167, 638, 9)])));
    const shin = part('shin', ol(both([...bone(154, 654, 158, 740, 5), ...bone(170, 650, 173, 744, 9)])));
    const foot = part('foot', ol(both([
      C(168, 758, 6), C(176, 760, 5), C(160, 760, 5),
      ...digit(154, 765, 147, 782, 3.4, 2), ...digit(160, 767, 156, 786, 3.4, 2), ...digit(167, 767, 166, 787, 3.4, 2),
      ...digit(174, 767, 176, 787, 3.4, 2), ...digit(180, 765, 185, 784, 3.6, 2),
    ])));

    return spine + ribs + collarbone + skull + pelvis + humerus + forearm + hand + femur + shin + kneecap + foot;
  }

  /* ───────────── muscles ───────────── */

  function muscleLayer() {
    const M = '#e2766b', LINE = '#a63f37', FIBRE = '#c4564d';
    const ol = (shapes) => outlined(shapes, M, LINE, 2.4);

    const deltoid = part('deltoid',
      ol(both([S([[150, 186], [128, 190], [110, 204], [102, 226], [100, 252], [108, 262], [118, 250], [128, 228], [140, 206]])]))
      + symMarkup(detail('M136,196 Q116,215 108,254 M146,191 Q126,220 115,252', FIBRE)));

    const pectoral = part('pectoral',
      ol(both([S([[196, 202], [170, 196], [148, 204], [132, 222], [128, 244], [140, 262], [168, 266], [190, 260], [197, 246]])]))
      + symMarkup(detail('M194,210 Q160,214 136,230 M194,226 Q164,228 136,236 M194,242 Q166,246 138,244 M190,256 Q164,258 142,252', FIBRE)));

    const biceps = part('biceps',
      ol(both([S([[126, 262], [112, 258], [102, 280], [96, 310], [96, 332], [104, 342], [112, 330], [120, 300]])]))
      + symMarkup(detail('M115,268 Q103,300 103,336', FIBRE)));

    const forearmMuscles = part('forearmMuscles',
      ol(both([S([[110, 352], [96, 348], [86, 370], [76, 410], [70, 438], [80, 442], [90, 420], [100, 390]])]))
      + symMarkup(detail('M100,356 Q86,396 76,436', FIBRE)));

    const absBlocks = [];
    [[270, 30], [304, 30], [338, 30], [372, 40]].forEach(([y, h]) => {
      absBlocks.push(R(174, y, 23, h, 7), R(203, y, 23, h, 7));
    });
    const abs = part('abs', ol([
      ...absBlocks,
      ...both([S([[170, 268], [152, 276], [146, 310], [148, 350], [152, 390], [168, 404], [172, 370], [172, 300]])]),
    ]) + symMarkup(detail('M166,290 L154,300 M168,320 L152,330 M168,350 L152,360 M168,380 L156,388', FIBRE)));

    const quadriceps = part('quadriceps',
      ol(both([S([[152, 470], [142, 510], [140, 560], [146, 600], [156, 624], [172, 628], [184, 606], [188, 560], [184, 505], [172, 478]])]))
      + symMarkup(detail('M160,482 Q150,550 160,620 M176,486 Q184,560 172,622', FIBRE)));

    const calf = part('calf',
      ol(both([S([[156, 650], [148, 680], [150, 720], [158, 744], [170, 744], [178, 720], [184, 680], [180, 652], [168, 646]])]))
      + symMarkup(detail('M166,654 Q160,700 164,740', FIBRE)));

    return pectoral + deltoid + biceps + forearmMuscles + abs + quadriceps + calf;
  }

  /* ───────────── brain & nerves ───────────── */

  function nervousLayer() {
    const BRAIN = '#f6a5c0', BRAIN_LINE = '#c2607f', NERVE = '#f5c518', NERVE_LINE = '#a8840a';

    const brain = part('brain',
      outlined([S([[200, 34], [226, 36], [242, 48], [247, 66], [241, 82], [222, 88], [200, 86], [178, 88], [159, 82], [153, 66], [158, 48], [174, 36]])], BRAIN, BRAIN_LINE, 3)
      + detail('M200,37 Q197,60 200,85', BRAIN_LINE, 2)
      + symMarkup(detail('M163,58 q7,-7 13,0 t13,0 M160,70 q7,7 13,0 t13,0 M168,81 q6,-6 12,0 M172,46 q6,6 12,0 t8,-2', BRAIN_LINE, 1.6)));

    const spinalCord = part('spinalCord',
      outlined([L('M200,84 L200,430', 6)], NERVE, NERVE_LINE, 2) + hitLine('M200,84 L200,430', 12));

    const nervePaths = [
      'M200,200 C170,198 142,202 124,216 C110,240 102,300 98,340 C92,380 82,420 74,450',
      'M74,450 L62,500 M74,450 L69,508 M75,452 L76,508 M76,452 L83,500',
      'M200,430 C192,440 178,454 170,474 C164,520 160,580 164,630 C168,680 166,720 166,752 L156,782 M166,752 L178,784 M164,630 C156,650 152,690 154,730',
      ...[222, 240, 258, 276, 294, 312, 330].map((y) => `M200,${y} C186,${y} 170,${y + 4} 156,${y + 14}`),
      'M200,112 C190,120 176,124 162,124',
    ];
    const nerveShapes = both(nervePaths.map((d) => L(d, 2.2)));
    const nerves = part('nerves',
      outlined(nerveShapes, NERVE, NERVE_LINE, 1.2)
      + nerveShapes.map((s) => hitLine(s.d, 10)).join(''));

    return nerves + spinalCord + brain;
  }

  /* ───────────── heart & blood ───────────── */

  function circulatoryLayer() {
    const RED = '#e0303e', RED_LINE = '#9e1c28', BLUE = '#3d6fd8', BLUE_LINE = '#22449a';

    // Paths that start on the trunk and are mirrored to the other side.
    const pair = (start, rest, startMirror = start) => [`M${start} ${rest}`, `M${startMirror} ${mirrorD(rest)}`];

    const arteryPaths = [
      ...pair('208,228', 'C200,200 192,170 188,140 C186,126 180,116 172,106', '214,226'),
      ...pair('206,234', 'C170,214 140,206 124,218 C110,240 104,290 100,330 C94,370 84,410 76,446 C72,462 68,478 66,494', '220,230'),
      'M224,240 C224,270 206,300 204,330 L204,430',
      ...pair('204,430', 'C192,446 176,458 170,476 C166,530 166,590 170,630 C172,680 170,720 168,752 C166,762 160,772 156,780'),
      'M204,376 L180,374 M204,376 L222,374',
    ];
    const veinPaths = [
      'M194,262 L194,430',
      ...pair('196,224', 'C186,200 182,170 180,140 C178,126 172,118 164,110'),
      ...pair('196,228', 'C172,204 140,200 118,212 C104,236 96,290 92,330 C86,370 76,410 70,446 C66,462 62,478 60,494'),
      ...pair('194,430', 'C184,446 168,458 162,476 C158,530 158,590 162,630 C164,680 162,720 160,752 C158,762 152,772 148,780'),
    ];

    const vessels = (id, paths, fill, line) => part(id,
      outlined(paths.map((d) => L(d, 3.2)), fill, line, 1.5) + paths.map((d) => hitLine(d, 10)).join(''));

    const heart = part('heart',
      '<g class="beat">'
      + outlined([
        L('M196,256 L196,220', 7),
      ], BLUE, BLUE_LINE, 2)
      + outlined([
        S([[198, 246], [212, 240], [228, 244], [236, 258], [234, 276], [224, 292], [214, 300], [204, 292], [194, 278], [190, 262]]),
        L('M206,248 C204,224 224,220 224,242', 8),
      ], RED, RED_LINE, 2.6)
      + detail('M214,248 Q204,272 214,296', RED_LINE, 1.6)
      + '<ellipse cx="204" cy="258" rx="5" ry="8" fill="#fff" opacity=".28" transform="rotate(25 204 258)"/>'
      + '</g>');

    return vessels('veins', veinPaths, BLUE, BLUE_LINE) + vessels('arteries', arteryPaths, RED, RED_LINE) + heart;
  }

  /* ───────────── breathing ───────────── */

  function respiratoryLayer() {
    const LUNG = '#f49ab0', LUNG_LINE = '#c25b78', PIPE = '#f6c6cf', PIPE_LINE = '#b77a87';

    const diaphragm = part('diaphragm', '<g class="breathe-d">'
      + outlined([F('M146,330 C168,302 232,302 254,330 L254,339 C232,313 168,313 146,339 Z')], '#e8907c', '#a85a49', 2)
      + '</g>');

    const lungs = part('lungs', '<g class="breathe">'
      + outlined(both([S([[192, 214], [184, 206], [172, 208], [160, 222], [152, 246], [148, 276], [148, 306], [152, 322], [166, 326], [184, 320], [192, 306], [194, 270], [194, 238]])]), LUNG, LUNG_LINE, 2.6)
      + symMarkup(detail('M182,252 Q172,268 168,292 M182,252 Q170,252 162,242 M176,262 Q178,288 184,306 M170,276 Q160,290 158,306', LUNG_LINE, 1.4))
      + '</g>');

    const tracheaRings = Array.from({ length: 11 }, (_, i) => `M195,${156 + i * 7} L205,${156 + i * 7}`).join(' ');
    const trachea = part('trachea',
      outlined([L('M200,150 L200,236', 10), ...both([L('M200,234 C196,244 188,250 180,256', 7)])], PIPE, PIPE_LINE, 2)
      + detail(tracheaRings, PIPE_LINE, 1.4));

    return diaphragm + lungs + trachea;
  }

  /* ───────────── digestion ───────────── */

  function digestiveLayer() {
    const esophagus = part('esophagus',
      outlined([L('M200,140 C200,200 202,260 204,300 C206,318 212,328 220,334', 7)], '#e99a83', '#a8604c', 2)
      + hitLine('M200,140 C200,200 202,260 204,300 C206,318 212,328 220,334', 12));

    const pancreas = part('pancreas',
      outlined([S([[176, 394], [196, 388], [226, 386], [244, 382], [248, 390], [230, 398], [200, 402], [180, 404]])], '#f3c27b', '#b88a3e', 2.4)
      + detail('M184,396 L238,390', '#d9a556', 1, ' stroke-dasharray="2 4"'));

    const stomach = part('stomach',
      outlined([S([[214, 332], [232, 328], [246, 336], [252, 356], [246, 378], [232, 392], [212, 396], [196, 392], [192, 382], [202, 376], [218, 376], [230, 364], [230, 348], [222, 340]])], '#f08f6e', '#a9533a', 2.6)
      + detail('M240,346 Q244,366 232,382 M226,388 Q214,390 204,386', '#c9684c', 1.3));

    const liver = part('liver',
      outlined([S([[148, 336], [168, 328], [196, 328], [222, 332], [232, 340], [222, 350], [200, 364], [176, 376], [156, 378], [146, 362]])], '#a8453b', '#6e2620', 2.6)
      + detail('M196,331 Q190,346 180,360', '#7f2e27', 1.4)
      + '<ellipse cx="186" cy="372" rx="6" ry="4" fill="#5f9e45" stroke="#3c6b2b" stroke-width="1.2"/>'); // gallbladder

    const SI_D = 'M172,420 L228,420 A6,6 0 0 1 228,432 L172,432 A6,6 0 0 0 172,444 L228,444 A6,6 0 0 1 228,456 L176,456';
    const smallIntestine = part('smallIntestine', outlined([L(SI_D, 9)], '#f6b48f', '#b9714a', 2));

    const LI_D = 'M160,468 L158,416 Q158,410 164,410 L236,410 Q242,410 242,416 L242,452 Q240,464 226,466 L214,466';
    const largeIntestine = part('largeIntestine',
      outlined([L(LI_D, 12)], '#d98c5f', '#8e5230', 2)
      + detail(LI_D, '#b06a40', 12, ' stroke-dasharray="1.4 7" stroke-linecap="butt"')
      + '<path d="M160,468 Q156,478 162,482" fill="none" stroke="#d98c5f" stroke-width="4" stroke-linecap="round"/>'); // appendix

    return esophagus + pancreas + stomach + liver + smallIntestine + largeIntestine;
  }

  /* ───────────── kidneys & bladder ───────────── */

  function urinaryLayer() {
    const kidneys = part('kidneys',
      outlined(both([
        S([[166, 352], [178, 354], [184, 364], [180, 372], [184, 382], [178, 392], [166, 394], [158, 384], [156, 370], [158, 358]]),
      ]), '#9c4f6b', '#6b2c43', 2.6)
      + outlined(both([L('M181,374 C186,410 190,440 194,464', 3)]), '#f0cf6a', '#b39331', 1.4)
      + symMarkup(detail('M176,366 Q170,373 176,380', '#c47a96', 1.4)));

    const bladder = part('bladder',
      outlined([S([[200, 460], [212, 463], [216, 472], [210, 481], [200, 483], [190, 481], [184, 472], [188, 463]])], '#f7d774', '#c9a43a', 2.6)
      + '<ellipse cx="195" cy="468" rx="4" ry="2.5" fill="#fff" opacity=".45"/>');

    return kidneys + bladder;
  }

  const LAYER_BUILDERS = {
    skin: skinLayer,
    skeleton: skeletonLayer,
    muscles: muscleLayer,
    nervous: nervousLayer,
    circulatory: circulatoryLayer,
    respiratory: respiratoryLayer,
    digestive: digestiveLayer,
    urinary: urinaryLayer,
  };

  function buildSVG() {
    const vb = `${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`;
    const layers = DRAW_ORDER.map((id) => `<g class="layer" data-layer="${id}">${LAYER_BUILDERS[id]()}</g>`).join('');
    return `<svg class="body-svg" xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="xMidYMid meet" role="img">`
      + `<title></title>${ghost()}${layers}<g class="overlay" aria-hidden="true"></g></svg>`;
  }

  const api = { buildSVG, DRAW_ORDER, VIEWBOX };
  root.BodySVG = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
