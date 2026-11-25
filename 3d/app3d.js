/*
 * Body Explorer 3D (prototype).
 *
 * Renders model/body.glb with three.js' WebGPURenderer (WebGPU when available,
 * WebGL 2 otherwise). Materials are written in TSL (three.js shading language),
 * which compiles to WGSL or GLSL: X-ray skin, glowing selection, beating heart,
 * breathing lungs. Texts come from ../js/content.js and ../js/i18n.js.
 */
import * as THREE from 'three/webgpu';
import {
  abs, attribute, color, distance, dot, float, mix, normalView, oneMinus, positionLocal,
  positionViewDirection, positionWorld, pow, sin, smoothstep, time, uniform, uv, vec2, vec3,
} from 'three/tsl';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const { SYSTEMS, PARTS } = window.BodyContent;
const { LANGS, SPEECH_LOCALES, UI } = window.BodyI18n;

const MODEL_URL = 'model/body.glb';
const STORE_KEY = 'body-explorer:v1'; // shared with the 2D page (language, discovered parts)
const DEFAULT_LAYERS = ['skin', 'skeleton', 'circulatory', 'respiratory', 'digestive'];

/* Texts only used by the 3D page. */
const T3 = {
  en: {
    title3d: 'Body Explorer 3D', prototype: 'Prototype', back2d: '2D view',
    hint3d: 'Drag to turn the body, pinch or scroll to zoom, tap a part to learn about it.',
    loading: 'Loading the body… {pct}%', preparing: 'Getting the 3D body ready…',
    noGpu: 'Sorry, this browser cannot show 3D graphics.', try2d: 'Try the 2D version!',
    slice: 'Cut', explode: 'Spread out', spin: 'Spin', resetView: 'Reset view',
    notIn3d: 'not in 3D yet', renderer: 'Drawn with {api}',
    credits: '3D anatomy: BodyParts3D, © The Database Center for Life Science, CC BY 4.0',
  },
  fr: {
    title3d: 'Explore ton corps en 3D', prototype: 'Prototype', back2d: 'Vue 2D',
    hint3d: 'Fais glisser pour tourner le corps, pince ou fais défiler pour zoomer, touche une partie pour la découvrir.',
    loading: 'Chargement du corps… {pct} %', preparing: 'Préparation du corps en 3D…',
    noGpu: 'Désolé, ce navigateur ne peut pas afficher la 3D.', try2d: 'Essaie la version 2D !',
    slice: 'Couper', explode: 'Écarter', spin: 'Tourner', resetView: 'Vue de départ',
    notIn3d: 'pas encore en 3D', renderer: 'Dessiné avec {api}',
    credits: 'Anatomie 3D : BodyParts3D, © The Database Center for Life Science, licence CC BY 4.0',
  },
  nl: {
    title3d: 'Ontdek je lichaam in 3D', prototype: 'Prototype', back2d: '2D-weergave',
    hint3d: 'Sleep om het lichaam te draaien, knijp of scrol om te zoomen, tik op een deel om het te ontdekken.',
    loading: 'Het lichaam wordt geladen… {pct}%', preparing: 'Het 3D-lichaam wordt klaargemaakt…',
    noGpu: 'Sorry, deze browser kan geen 3D tonen.', try2d: 'Probeer de 2D-versie!',
    slice: 'Doorsnijden', explode: 'Uit elkaar', spin: 'Draaien', resetView: 'Beginweergave',
    notIn3d: 'nog niet in 3D', renderer: 'Getekend met {api}',
    credits: '3D-anatomie: BodyParts3D, © The Database Center for Life Science, licentie CC BY 4.0',
  },
};

/* Colours per part (friendly, matching the 2D drawing). */
const BONE = 0xefe6cf;
const PART_COLORS = {
  skin: 0xf2c4a0, eyes: 0xe8eef8, nose: 0xf0b08c, mouth: 0xe57373,
  skull: BONE, spine: BONE, ribs: BONE, collarbone: BONE, humerus: BONE, forearm: BONE, hand: BONE,
  pelvis: BONE, femur: BONE, kneecap: 0xf5edd8, shin: BONE, foot: BONE,
  brain: 0xf4a6bd, spinalCord: 0xf5c518,
  heart: 0xd62839, arteries: 0xe0303e, veins: 0x3d6fd8,
  trachea: 0xf2c6cf, lungs: 0xf48fb1, diaphragm: 0xd97a68,
  esophagus: 0xe99a83, stomach: 0xf08f6e, liver: 0xa8453b, pancreas: 0xf3c27b,
  smallIntestine: 0xf6b48f, largeIntestine: 0xd98c5f,
  kidneys: 0x9c4f6b, bladder: 0xf7d774,
};

/* "Spread out" view: visible systems slide apart side by side, this far apart (metres). */
const EXPLODE_SPACING = 0.72;

/* The BodyParts3D skin is an adult body: it gets swim shorts. The build script marks the
   shorts area per vertex (_shorts attribute, arms excluded); the shader adds crisp edges. */
const SHORTS = { bottom: 0.70, top: 1.0, color: 0x4f7bd8, band: 0xffffff };

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ───────────── State ───────────── */

function loadStore() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
}
function saveStore() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ ...loadStore(), lang: state.lang, visited: [...state.visited] }));
  } catch { /* storage unavailable */ }
}
function pickLang(saved) {
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (LANGS.includes(fromUrl)) return fromUrl;
  if (LANGS.includes(saved)) return saved;
  for (const l of navigator.languages || []) {
    const code = String(l).slice(0, 2).toLowerCase();
    if (LANGS.includes(code)) return code;
  }
  return 'en';
}

const stored = loadStore();
const state = {
  lang: pickLang(stored.lang),
  visited: new Set(Array.isArray(stored.visited) ? stored.visited.filter((id) => PARTS[id]) : []),
  layers: new Set(DEFAULT_LAYERS),
  selected: null,
  hover: null,
};

const t = (key, vars) => {
  let s = UI[state.lang][key] ?? UI.en[key] ?? key;
  if (Array.isArray(s)) s = s[0];
  return vars ? s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '') : s;
};
const t3 = (key, vars) => {
  const s = T3[state.lang][key] ?? T3.en[key] ?? key;
  return vars ? s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '') : s;
};
const partText = (id) => PARTS[id][state.lang];
const sysById = Object.fromEntries(SYSTEMS.map((s) => [s.id, s]));

/* ───────────── DOM ───────────── */

const stage = $('#stage');
const canvas = $('#canvas3d');
const panel = $('#panel');
const tooltip = $('#tooltip');
const layerList = $('#layer-list');
const loading = $('#loading');

// Filled once the model is loaded.
const meshesByPart = new Map();   // part id -> Mesh
const uniformsByPart = new Map(); // part id -> { sel, hover }
const systemsIn3d = new Set();

/* ───────────── Static texts ───────────── */

function renderStatic() {
  document.documentElement.lang = state.lang;
  document.title = t3('title3d');
  $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $$('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
  $$('[data-t3]').forEach((el) => { el.textContent = t3(el.dataset.t3); });
  $$('[data-t3-title]').forEach((el) => {
    el.title = t3(el.dataset.t3Title);
    el.setAttribute('aria-label', t3(el.dataset.t3Title));
  });
  $$('#lang-switch button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang)));
  $('#to-2d').href = `../index.html?lang=${state.lang}`;
  renderLayerButtons();
  if (rendererName) $('#gpu-badge').textContent = t3('renderer', { api: rendererName });
}

function renderLayerButtons() {
  layerList.innerHTML = SYSTEMS.map((s) => {
    const available = !meshesByPart.size || systemsIn3d.has(s.id);
    return `
      <button type="button" class="layer-btn" data-layer="${s.id}" style="--c:${s.color}"
        aria-pressed="${state.layers.has(s.id) && available}" ${available ? '' : 'disabled'}>
        <span class="dot" aria-hidden="true">${s.emoji}</span>
        <span class="label">${esc(s.name[state.lang])}</span>
        ${available ? '<span class="switch" aria-hidden="true"></span>' : `<span class="soon">${esc(t3('notIn3d'))}</span>`}
      </button>`;
  }).join('');
}

/* ───────────── Renderer & scene ───────────── */

let renderer;
let rendererName = '';
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
const clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 10);
const bodyGroup = new THREE.ClippingGroup(); // everything that can be sliced
bodyGroup.clippingPlanes = [clipPlane];
bodyGroup.enabled = false;
scene.add(bodyGroup);

const bodyBox = new THREE.Box3();
const bodyCenter = new THREE.Vector3();
let controls;

// Shared shader building blocks.
const fresnel = (power) => pow(oneMinus(abs(dot(normalView, positionViewDirection))), float(power));
const breath = sin(time.mul(1.3)).mul(0.5).add(0.5);              // 0..1, slow
const heartbeat = pow(sin(time.mul(3.4)).mul(0.5).add(0.5), float(10)); // short pulses

const uSkinSolid = uniform(1); // 1 = normal skin, 0 = X-ray glass

function glowNodes(u) {
  const rim = fresnel(2.2);
  const pulse = sin(time.mul(4.5)).mul(0.5).add(0.5);
  return color(0xffb300).mul(u.sel.mul(rim.mul(1.8).add(pulse.mul(0.2))))
    .add(color(0xffffff).mul(u.hover.mul(rim).mul(0.55)));
}

function makeMaterial(partId, system) {
  const u = { sel: uniform(0), hover: uniform(0) };
  uniformsByPart.set(partId, u);
  const hex = PART_COLORS[partId] ?? 0xcccccc;

  if (partId === 'skin') {
    const m = new THREE.MeshPhysicalNodeMaterial({
      color: hex, roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color(0xffd9c2),
      transparent: true, side: THREE.FrontSide,
    });
    const rim = fresnel(2.5);
    // Swim shorts with a white waistband, painted by height.
    const y = positionWorld.y;
    const shorts = smoothstep(0.5, 0.9, attribute('_shorts', 'float'))
      .mul(smoothstep(SHORTS.bottom - 0.004, SHORTS.bottom + 0.004, y))
      .mul(oneMinus(smoothstep(SHORTS.top - 0.004, SHORTS.top + 0.004, y)));
    const band = smoothstep(SHORTS.top - 0.03, SHORTS.top - 0.026, y).mul(shorts);
    m.colorNode = mix(mix(color(hex), color(SHORTS.color), shorts), color(SHORTS.band), band);
    // Solid skin, or a glowing glass shell when inner layers are shown.
    m.opacityNode = mix(rim.mul(0.75).add(0.05), float(1), uSkinSolid);
    m.emissiveNode = color(0xff9e7a).mul(rim.mul(0.55).mul(oneMinus(uSkinSolid))).add(glowNodes(u));
    return m;
  }

  const bone = system === 'skeleton';
  const m = new THREE.MeshPhysicalNodeMaterial({
    color: hex,
    roughness: bone ? 0.62 : 0.42,
    clearcoat: bone ? 0.1 : 0.45,
    clearcoatRoughness: 0.35,
    side: THREE.DoubleSide, // so the inside shows when the body is cut open
  });
  m.emissiveNode = glowNodes(u);

  if (!reducedMotion) {
    // Vertex animation on the GPU. Positions are local to each part (centred), so scaling
    // them makes the organ grow/shrink around its own centre.
    if (partId === 'heart') m.positionNode = positionLocal.mul(heartbeat.mul(0.045).add(1));
    if (partId === 'lungs') {
      m.positionNode = positionLocal.mul(vec3(breath.mul(0.03).add(1), breath.mul(0.03).add(1), breath.mul(0.05).add(1)));
    }
    if (partId === 'diaphragm') m.positionNode = positionLocal.sub(vec3(0, breath.mul(0.05), 0));
  }
  return m;
}

// Glowing copy of the selected part drawn on top of everything (depth test off),
// so it can be seen even behind bones or other organs.
const ghostMaterial = (() => {
  const m = new THREE.MeshBasicNodeMaterial({ transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide });
  const pulse = sin(time.mul(4.5)).mul(0.5).add(0.5);
  m.colorNode = color(0xffc400);
  m.opacityNode = fresnel(1.5).mul(0.55).add(pulse.mul(0.1)).add(0.06);
  return m;
})();
let ghost = null;

function setGhost(id) {
  if (ghost) ghost.removeFromParent();
  ghost = null;
  const mesh = id && meshesByPart.get(id);
  if (!mesh || id === 'skin') return;
  ghost = new THREE.Mesh(mesh.geometry, ghostMaterial);
  ghost.renderOrder = 999;
  mesh.add(ghost); // follows the part when it moves; hidden with it
}

function addGroundShadow() {
  const mat = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
  mat.colorNode = color(0x1d2742);
  mat.opacityNode = smoothstep(0.5, 0.0, distance(uv(), vec2(0.5, 0.5))).mul(0.25);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.55, 64), mat);
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.002;
  scene.add(disc);
}

function addLights() {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a93b8, 1.4));
  // Key and fill lights follow the camera so the side you look at is always lit.
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(1.2, 1.6, 1);
  const fill = new THREE.DirectionalLight(0xc8d8ff, 0.8);
  fill.position.set(-1.5, 0.3, 0.5);
  camera.add(key, fill);
  scene.add(camera);
}

/* ───────────── Camera ───────────── */

let focus = null; // { target: Vector3, dist: number } while flying to a part

function visibleBox() {
  const box = new THREE.Box3();
  for (const mesh of meshesByPart.values()) if (mesh.visible) box.expandByObject(mesh);
  return box.isEmpty() ? bodyBox.clone() : box;
}

function homeView() {
  const box = visibleBox();
  const size = box.getSize(new THREE.Vector3());
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  const dist = Math.max(size.y / 2 / Math.tan(vFov / 2), size.x / 2 / Math.tan(hFov / 2)) * (explodeValue > 0 ? 1.3 : 1.12);
  return { target: box.getCenter(new THREE.Vector3()), dist };
}

function flyTo(view) {
  focus = view;
  if (reducedMotion && controls) {
    // No camera flight for people who asked for reduced motion: jump straight there.
    const dir = camera.position.clone().sub(controls.target).normalize();
    controls.target.copy(view.target);
    camera.position.copy(view.target).addScaledVector(dir, view.dist);
    focus = null;
  }
}

function focusPart(id) {
  const mesh = meshesByPart.get(id);
  if (!mesh) return;
  const box = new THREE.Box3().setFromObject(mesh);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const dist = Math.max(0.6, (sphere.radius / Math.sin(vFov / 2)) * 2); // keep some surroundings in view
  flyTo({ target: sphere.center, dist: Math.min(dist, homeView().dist) });
  setGhost(id);
}

function updateCamera() {
  if (!focus) return;
  controls.target.lerp(focus.target, 0.12);
  const offset = camera.position.clone().sub(controls.target);
  const len = offset.length();
  offset.setLength(len + (focus.dist - len) * 0.12);
  camera.position.copy(controls.target).add(offset);
  if (controls.target.distanceTo(focus.target) < 0.002 && Math.abs(len - focus.dist) < 0.005) focus = null;
}

/* ───────────── Layers, slicing, explode ───────────── */

function skinIsXray() {
  return [...state.layers].some((id) => id !== 'skin' && systemsIn3d.has(id));
}

function applyLayers() {
  for (const mesh of meshesByPart.values()) mesh.visible = state.layers.has(mesh.userData.system);
  applyExplode();
  if (explodeValue > 0 && controls) flyTo(homeView());
  const skin = meshesByPart.get('skin');
  if (skin) {
    const xray = skinIsXray();
    uSkinSolid.value = xray ? 0 : 1;
    if (skin.material.depthWrite === xray) {
      skin.material.depthWrite = !xray;
      skin.material.needsUpdate = true;
    }
    skin.renderOrder = xray ? 10 : 0;
  }
  if (state.selected && !state.layers.has(PARTS[state.selected].system)) select(null);
  $$('.layer-btn', layerList).forEach((b) => b.setAttribute('aria-pressed', String(state.layers.has(b.dataset.layer) && systemsIn3d.has(b.dataset.layer))));
}

let sliceZ = Infinity;
function applySlice(value) {
  const front = bodyBox.max.z + 0.01;
  const back = bodyBox.min.z - 0.01;
  bodyGroup.enabled = value > 0;
  sliceZ = value > 0 ? front - (value / 100) * (front - back) : Infinity;
  clipPlane.constant = sliceZ; // keeps points with z <= constant
}

let explodeValue = 0;
function applyExplode(value = explodeValue) {
  explodeValue = value;
  const k = value / 100;
  const row = SYSTEMS.map((s) => s.id).filter((id) => state.layers.has(id) && systemsIn3d.has(id));
  for (const mesh of meshesByPart.values()) {
    const { base, system } = mesh.userData;
    const slot = row.indexOf(system);
    const dx = slot < 0 ? 0 : (slot - (row.length - 1) / 2) * EXPLODE_SPACING;
    mesh.position.set(base.x + dx * k, base.y, base.z);
  }
}

/* ───────────── Picking & hover ───────────── */

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function pick(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const visible = [...meshesByPart.values()].filter((m) => m.visible);
  let fallback = null;
  for (const hit of raycaster.intersectObjects(visible, false)) {
    if (hit.point.z > sliceZ + 1e-4) continue; // cut away
    const id = hit.object.userData.part;
    if (id === 'skin' && skinIsXray()) { fallback = fallback || id; continue; } // click through glass skin
    return id;
  }
  return fallback;
}

function setHover(id) {
  if (id === state.hover) return;
  if (state.hover) uniformsByPart.get(state.hover).hover.value = 0;
  state.hover = id;
  if (id) uniformsByPart.get(id).hover.value = 1;
  stage.classList.toggle('over-part', Boolean(id));
}

function showTooltip(text, x, y) {
  const r = stage.getBoundingClientRect();
  tooltip.textContent = text;
  tooltip.style.left = `${Math.min(Math.max(x - r.left, 60), r.width - 60)}px`;
  tooltip.style.top = `${Math.max(y - r.top, 40)}px`;
  tooltip.hidden = false;
}

/* ───────────── Selection & panel ───────────── */

function select(id) {
  if (state.selected) uniformsByPart.get(state.selected).sel.value = 0;
  state.selected = id;
  if (!id) setGhost(null);
  stopSpeaking();
  if (id) {
    uniformsByPart.get(id).sel.value = 1;
    state.visited.add(id);
    saveStore();
    focusPart(id);
    controls.autoRotate = false;
    $('#spin').setAttribute('aria-pressed', 'false');
    announce(t('selected', { name: partText(id).name }));
  }
  renderPanel();
}

function renderPanel() {
  const html = [];
  if (state.selected) {
    const id = state.selected;
    const s = sysById[PARTS[id].system];
    const p = partText(id);
    html.push(`
      <article class="card" style="--sys:${s.color}" aria-labelledby="card-title">
        <div class="card-head">
          <span class="card-emoji" aria-hidden="true">${s.emoji}</span>
          <div><span class="card-sys">${esc(s.name[state.lang])}</span><h2 id="card-title">${esc(p.name)}</h2></div>
        </div>
        <h3>${esc(t('whatItDoes'))}</h3>
        <p>${esc(p.info)}</p>
        <div class="fact"><h3><span aria-hidden="true">💡</span> ${esc(t('didYouKnow'))}</h3><p>${esc(p.fact)}</p></div>
        <div class="card-actions">
          ${speechOK ? `<button type="button" class="btn" data-action="speak"><span aria-hidden="true">🔊</span> <span class="speak-label">${esc(t('readAloud'))}</span></button>` : ''}
          <button type="button" class="btn secondary" data-action="back"><span aria-hidden="true">←</span> ${esc(t('backToStart'))}</button>
        </div>
      </article>`);
  } else {
    html.push(`
      <article class="card" aria-labelledby="card-title">
        <div class="card-head"><span class="card-emoji" aria-hidden="true">🧊</span><h2 id="card-title">${esc(t('welcomeTitle'))}</h2></div>
        <p style="margin-top:10px">${esc(t3('hint3d'))}</p>
      </article>`);
  }
  for (const s of SYSTEMS) {
    if (!state.layers.has(s.id) || !systemsIn3d.has(s.id)) continue;
    const chips = Object.keys(PARTS).filter((id) => PARTS[id].system === s.id && meshesByPart.has(id)).map((id) => `
      <button type="button" class="chip" data-select="${id}" aria-current="${id === state.selected}">${esc(partText(id).name)}${state.visited.has(id)
        ? `<span class="tick" aria-hidden="true">✓</span><span class="sr-only"> (${esc(t('visited'))})</span>` : ''}</button>`).join('');
    html.push(`
      <section class="sys-group" style="--sys:${s.color}">
        <h3><span aria-hidden="true">${s.emoji}</span> ${esc(s.name[state.lang])}</h3>
        <p class="sys-desc">${esc(s.desc[state.lang])}</p>
        <div class="chips">${chips}</div>
      </section>`);
  }
  if (html.length === 1 && !state.layers.size) html.push(`<p class="empty">${esc(t('noLayers'))}</p>`);
  panel.innerHTML = html.join('');
}

const announcer = $('#announcer');
function announce(text) {
  announcer.textContent = '';
  requestAnimationFrame(() => { announcer.textContent = text; });
}

/* ───────────── Speech ───────────── */

const speechOK = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
let speaking = null;

function speak(text, btn) {
  if (!speechOK) return;
  if (speaking) { stopSpeaking(); return; }
  const u = new SpeechSynthesisUtterance(text);
  const voices = speechSynthesis.getVoices();
  const voice = SPEECH_LOCALES[state.lang].map((loc) => voices.find((v) => v.lang.replace('_', '-').toLowerCase().startsWith(loc.toLowerCase()))).find(Boolean);
  u.lang = voice ? voice.lang : SPEECH_LOCALES[state.lang][0];
  if (voice) u.voice = voice;
  u.rate = 0.92;
  u.onend = u.onerror = () => { if (speaking === u) stopSpeaking(); };
  speaking = u;
  if (btn) $('.speak-label', btn).textContent = t('stopReading');
  speechSynthesis.speak(u);
}

function stopSpeaking() {
  if (!speechOK) return;
  speaking = null;
  speechSynthesis.cancel();
  $$('.speak-label', panel).forEach((el) => { el.textContent = t('readAloud'); });
}

/* ───────────── Events ───────────── */

function bindEvents() {
  layerList.addEventListener('click', (e) => {
    const b = e.target.closest('.layer-btn');
    if (!b || b.disabled) return;
    const id = b.dataset.layer;
    if (state.layers.has(id)) state.layers.delete(id); else state.layers.add(id);
    applyLayers();
    renderPanel();
  });
  $('#show-all').addEventListener('click', () => { state.layers = new Set(systemsIn3d); applyLayers(); renderPanel(); });
  $('#hide-all').addEventListener('click', () => { state.layers.clear(); applyLayers(); renderPanel(); });

  $('#lang-switch').addEventListener('click', (e) => {
    const b = e.target.closest('[data-lang]');
    if (!b) return;
    state.lang = b.dataset.lang;
    saveStore();
    stopSpeaking();
    renderStatic();
    renderPanel();
  });

  panel.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-select]');
    if (chip) {
      select(chip.dataset.select);
      $(`[data-select="${chip.dataset.select}"]`, panel)?.focus({ preventScroll: true });
      panel.scrollTo({ top: 0, behavior: 'smooth' }); // show the info card
      return;
    }
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'speak') {
      const p = partText(state.selected);
      speak(`${p.name}. ${p.info} ${t('didYouKnow')} ${p.fact}`, btn);
    } else if (btn.dataset.action === 'back') {
      select(null);
      flyTo(homeView());
    }
  });

  $('#slice').addEventListener('input', (e) => applySlice(Number(e.target.value)));
  $('#explode').addEventListener('input', (e) => {
    applyExplode(Number(e.target.value));
    if (!state.selected) flyTo(homeView());
  });
  $('#spin').addEventListener('click', (e) => {
    controls.autoRotate = !controls.autoRotate;
    e.currentTarget.setAttribute('aria-pressed', String(controls.autoRotate));
  });
  $('#reset-view').addEventListener('click', () => flyTo(homeView()));

  // Tap = pointer released close to where it was pressed (otherwise it was a drag/rotate).
  let down = null;
  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; tooltip.hidden = true; });
  canvas.addEventListener('pointerup', (e) => {
    if (!down) return;
    const tap = Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6 && performance.now() - down.t < 600;
    down = null;
    if (!tap) return;
    const id = pick(e.clientX, e.clientY);
    if (id) select(id);
  });

  // Hover (mouse only), throttled: ray casting half a million triangles is not free.
  let pending = null;
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || e.buttons) return;
    if (pending) { pending = { x: e.clientX, y: e.clientY }; return; }
    pending = { x: e.clientX, y: e.clientY };
    setTimeout(() => {
      const { x, y } = pending;
      pending = null;
      const id = pick(x, y);
      setHover(id);
      if (id) showTooltip(partText(id).name, x, y); else tooltip.hidden = true;
    }, 60);
  });
  canvas.addEventListener('pointerleave', () => { setHover(null); tooltip.hidden = true; });

  controls.addEventListener('start', () => {
    focus = null;
    if (controls.autoRotate) {
      controls.autoRotate = false;
      $('#spin').setAttribute('aria-pressed', 'false');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.selected) { select(null); flyTo(homeView()); }
  });

  new ResizeObserver(resize).observe(stage);
}

// The model is stored with 16/8-bit quantized vertices (small download). WebGPU has no
// 3-component formats for those, so convert them to plain floats once after loading.
function toFloatAttributes(geometry) {
  const getters = ['getX', 'getY', 'getZ', 'getW'];
  for (const [name, attr] of Object.entries(geometry.attributes)) {
    if (attr.array instanceof Float32Array && !attr.isInterleavedBufferAttribute) continue;
    const size = attr.itemSize;
    const out = new Float32Array(attr.count * size);
    for (let i = 0; i < attr.count; i++) {
      for (let c = 0; c < size; c++) out[i * size + c] = attr[getters[c]](i); // getX… de-normalize
    }
    geometry.setAttribute(name, new THREE.BufferAttribute(out, size));
  }
}

function resize() {
  const { width, height } = stage.getBoundingClientRect();
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

/* ───────────── Start ───────────── */

function showError() {
  loading.classList.add('error');
  loading.innerHTML = `<p>${esc(t3('noGpu'))}</p><p><a href="../index.html?lang=${state.lang}">${esc(t3('try2d'))}</a></p>`;
}

async function main() {
  renderStatic();
  renderPanel();
  $('#loading-text').textContent = t3('loading', { pct: 0 });

  try {
    renderer = new THREE.WebGPURenderer({ canvas, antialias: true, alpha: true });
    await renderer.init();
  } catch (err) {
    console.error(err);
    showError();
    return;
  }
  rendererName = renderer.backend.isWebGPUBackend ? 'WebGPU' : 'WebGL 2';
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;
  $('#gpu-badge').textContent = t3('renderer', { api: rendererName });
  $('#gpu-badge').hidden = false;

  addLights();
  addGroundShadow();

  let gltf;
  try {
    gltf = await new GLTFLoader().loadAsync(MODEL_URL, (e) => {
      if (!e.total) return;
      const pct = Math.round((e.loaded / e.total) * 100);
      $('#loading-bar').style.width = `${pct}%`;
      $('#loading-text').textContent = t3('loading', { pct });
    });
  } catch (err) {
    console.error(err);
    showError();
    return;
  }

  $('#loading-text').textContent = t3('preparing');
  const meshes = [];
  gltf.scene.traverse((o) => { if (o.isMesh && o.userData.part && PARTS[o.userData.part]) meshes.push(o); });
  for (const mesh of meshes) {
    const { part, system } = mesh.userData;
    toFloatAttributes(mesh.geometry);
    mesh.material = makeMaterial(part, system);
    mesh.updateMatrixWorld(true);
    mesh.userData.base = mesh.position.clone();
    mesh.userData.centre = new THREE.Box3().setFromObject(mesh).getCenter(new THREE.Vector3());
    meshesByPart.set(part, mesh);
    systemsIn3d.add(system);
    bodyGroup.add(mesh);
  }
  bodyBox.setFromObject(bodyGroup);
  bodyBox.getCenter(bodyCenter);

  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 0.3;
  controls.maxDistance = 14;
  controls.autoRotate = !reducedMotion;
  controls.autoRotateSpeed = 0.9;
  $('#spin').setAttribute('aria-pressed', String(controls.autoRotate));

  resize();
  const home = homeView();
  controls.target.copy(home.target);
  camera.position.set(home.target.x, home.target.y + 0.05, home.target.z + home.dist);

  renderLayerButtons();
  applyLayers();
  renderPanel();
  bindEvents();

  // Compile all shaders before showing the body, so the first rotation is smooth.
  await renderer.compileAsync(scene, camera);
  renderer.setAnimationLoop(() => {
    updateCamera();
    controls.update();
    renderer.render(scene, camera);
  });
  loading.classList.add('done');
}

main();
