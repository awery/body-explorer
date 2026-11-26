/*
 * Body Explorer: application logic (layers, selection, zoom, speech, quiz).
 */
(function () {
  'use strict';

  const { SYSTEMS, PARTS } = window.BodyContent;
  const { LANGS, SPEECH_LOCALES, UI } = window.BodyI18n;
  const { buildSVG, DRAW_ORDER, VIEWBOX } = window.BodySVG;

  const STORE_KEY = 'body-explorer:v1';
  const QUIZ_LENGTH = 10;
  const SEE_THROUGH = ['skin', 'muscles']; // outer layers that turn translucent over deeper ones
  const DEFAULT_LAYERS = ['skin'];

  const sysById = Object.fromEntries(SYSTEMS.map((s) => [s.id, s]));
  const PART_IDS = Object.keys(PARTS);

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ───────────── State & persistence ───────────── */

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
  }

  function pickLang(saved) {
    const fromUrl = new URLSearchParams(location.search).get('lang');
    if (LANGS.includes(fromUrl)) return fromUrl;
    if (LANGS.includes(saved)) return saved;
    for (const l of navigator.languages || [navigator.language || '']) {
      const code = String(l).slice(0, 2).toLowerCase();
      if (LANGS.includes(code)) return code;
    }
    return 'en';
  }

  const saved = load();
  const state = {
    lang: pickLang(saved.lang),
    layers: new Set(Array.isArray(saved.layers) ? saved.layers.filter((id) => sysById[id]) : DEFAULT_LAYERS),
    visited: new Set(Array.isArray(saved.visited) ? saved.visited.filter((id) => PARTS[id]) : []),
    sound: saved.sound !== false,
    selected: null,
    mode: 'explore',
    quiz: null,
    exploreLayers: null, // layers to restore when leaving the quiz
  };

  function save() {
    const layers = state.mode === 'quiz' && state.exploreLayers ? state.exploreLayers : state.layers;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        lang: state.lang, layers: [...layers], visited: [...state.visited], sound: state.sound,
      }));
    } catch { /* storage unavailable (private mode…): the app still works */ }
  }

  /* ───────────── i18n helpers ───────────── */

  function t(key, vars) {
    let s = UI[state.lang][key] ?? UI.en[key] ?? key;
    if (Array.isArray(s)) s = s[0];
    return vars ? s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? '')) : s;
  }
  const partText = (id) => PARTS[id][state.lang];
  const sysName = (id) => sysById[id].name[state.lang];

  /* ───────────── DOM setup ───────────── */

  const stage = $('#stage');
  const viewer = $('#viewer');
  const panel = $('#panel');
  const tooltip = $('#tooltip');
  const fx = $('#fx');
  const layerList = $('#layer-list');

  viewer.innerHTML = buildSVG();
  const svg = $('svg', viewer);
  const overlay = $('.overlay', svg);
  const layerEls = Object.fromEntries($$('.layer', svg).map((g) => [g.dataset.layer, g]));
  svg.classList.add('anim');

  layerList.innerHTML = SYSTEMS.map((s) => `
    <button type="button" class="layer-btn" data-layer="${s.id}" style="--c:${s.color}" aria-pressed="false">
      <span class="dot" aria-hidden="true">${s.emoji}</span>
      <span class="label"></span>
      <span class="switch" aria-hidden="true"></span>
    </button>`).join('');

  /* ───────────── Static texts ───────────── */

  function renderStatic() {
    document.documentElement.lang = state.lang;
    document.title = t('docTitle');
    $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    $$('[data-i18n-title]').forEach((el) => {
      el.title = t(el.dataset.i18nTitle);
      el.setAttribute('aria-label', t(el.dataset.i18nTitle));
    });
    $('title', svg).textContent = t('viewerLabel');
    $('#to-3d').href = `3d/index.html?lang=${state.lang}`;
    $$('.layer-btn', layerList).forEach((b) => { $('.label', b).textContent = sysName(b.dataset.layer); });
    $$('#lang-switch button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang)));
    $$('#mode-switch button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)));
    const sound = $('#sound-toggle');
    sound.setAttribute('aria-pressed', String(state.sound));
    sound.setAttribute('aria-label', t(state.sound ? 'soundOn' : 'soundOff'));
    sound.title = t(state.sound ? 'soundOn' : 'soundOff');
    $('span', sound).textContent = state.sound ? '🔔' : '🔕';
  }

  /* ───────────── Layers ───────────── */

  function applyLayers() {
    const depth = (id) => DRAW_ORDER.indexOf(id);
    for (const [id, g] of Object.entries(layerEls)) {
      const on = state.layers.has(id);
      g.classList.toggle('off', !on);
      const seeThrough = on && SEE_THROUGH.includes(id) && [...state.layers].some((o) => depth(o) < depth(id));
      g.classList.toggle('see-through', seeThrough);
    }
    const locked = state.mode === 'quiz';
    $$('.layer-btn', layerList).forEach((b) => {
      b.setAttribute('aria-pressed', String(state.layers.has(b.dataset.layer)));
      b.disabled = locked;
    });
    $('.systems').classList.toggle('locked', locked);
    $('#layers-hint').textContent = t(locked ? 'layersLocked' : 'layersHint');
  }

  function toggleLayer(id) {
    if (state.layers.has(id)) {
      state.layers.delete(id);
      if (state.selected && PARTS[state.selected].system === id) state.selected = null;
    } else {
      state.layers.add(id);
    }
    applyLayers();
    refreshSelection();
    renderPanel();
    save();
    sfx('click');
  }

  function setAllLayers(on) {
    state.layers = new Set(on ? SYSTEMS.map((s) => s.id) : []);
    if (!on) state.selected = null;
    applyLayers();
    refreshSelection();
    renderPanel();
    save();
    sfx('click');
  }

  /* ───────────── Highlight & hover ───────────── */

  // Draws glowing copies of parts on top of everything, so a selected organ is
  // visible even when it sits under another layer.
  function setHighlights(items) {
    overlay.replaceChildren();
    for (const [id, kind] of items) {
      const src = svg.querySelector(`.layer:not(.off) .part[data-part="${id}"]`);
      if (!src) continue;
      const clone = src.cloneNode(true);
      clone.setAttribute('class', `hl hl-${kind}`);
      clone.removeAttribute('data-part');
      overlay.append(clone);
    }
  }

  function refreshSelection() {
    setHighlights(state.mode === 'explore' && state.selected ? [[state.selected, 'select']] : []);
  }

  let hoverId = null;
  function setHover(id) {
    if (id === hoverId) return;
    $$('.part.hover', svg).forEach((p) => p.classList.remove('hover'));
    hoverId = id;
    if (id) $$(`.layer .part[data-part="${id}"]`, svg).forEach((p) => p.classList.add('hover'));
  }

  // Find the body part under a screen point. Translucent outer layers (skin,
  // muscles over deeper systems) let clicks through to what is visible below.
  function partAt(x, y) {
    let fallback = null;
    for (const el of document.elementsFromPoint(x, y)) {
      if (!svg.contains(el)) continue;
      const p = el.closest('.part');
      if (!p || !p.dataset.part) continue;
      if (p.closest('.layer').classList.contains('see-through')) {
        fallback = fallback || p.dataset.part;
        continue;
      }
      return p.dataset.part;
    }
    return fallback;
  }

  let tooltipTimer = null;
  function showTooltip(text, clientX, clientY, autoHideMs = 0) {
    const r = stage.getBoundingClientRect();
    tooltip.textContent = text;
    tooltip.style.left = `${Math.min(Math.max(clientX - r.left, 60), r.width - 60)}px`;
    tooltip.style.top = `${Math.max(clientY - r.top, 40)}px`;
    tooltip.hidden = false;
    clearTimeout(tooltipTimer);
    if (autoHideMs) tooltipTimer = setTimeout(hideTooltip, autoHideMs);
  }
  function hideTooltip() { tooltip.hidden = true; }

  /* ───────────── Zoom & pan ───────────── */

  const BASE = { ...VIEWBOX };
  const MIN_W = BASE.w / 5;
  let view = { ...BASE };
  const clampW = (w) => Math.min(BASE.w, Math.max(MIN_W, w));

  function setView(v) {
    const w = clampW(v.w);
    const h = (w * BASE.h) / BASE.w;
    const x = Math.min(BASE.x + BASE.w - w, Math.max(BASE.x, v.x));
    const y = Math.min(BASE.y + BASE.h - h, Math.max(BASE.y, v.y));
    view = { x, y, w, h };
    svg.setAttribute('viewBox', [x, y, w, h].map((n) => Math.round(n * 100) / 100).join(' '));
    stage.classList.toggle('zoomed', w < BASE.w - 0.5);
  }

  function toSvgPoint(clientX, clientY) {
    const m = svg.getScreenCTM();
    return m ? new DOMPoint(clientX, clientY).matrixTransform(m.inverse()) : { x: view.x + view.w / 2, y: view.y + view.h / 2 };
  }

  function zoomAround(p, from, newW) {
    const k = clampW(newW) / from.w;
    setView({ x: p.x - (p.x - from.x) * k, y: p.y - (p.y - from.y) * k, w: from.w * k });
  }

  function zoomAtClient(factor, clientX, clientY) {
    zoomAround(toSvgPoint(clientX, clientY), view, view.w / factor);
  }

  function zoomCenter(factor) {
    const r = svg.getBoundingClientRect();
    zoomAtClient(factor, r.left + r.width / 2, r.top + r.height / 2);
  }

  const pointers = new Map();
  let gesture = null;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  svg.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { svg.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    if (pointers.size === 1) {
      const ctm = svg.getScreenCTM();
      gesture = { type: 'tap', x0: e.clientX, y0: e.clientY, view0: { ...view }, scale: ctm ? 1 / ctm.a : 1, moved: false };
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      gesture = { type: 'pinch', d0: dist(a, b) || 1, view0: { ...view }, p0: toSvgPoint((a.x + b.x) / 2, (a.y + b.y) / 2) };
      hideTooltip();
    }
  });

  svg.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) {
      if (e.pointerType === 'mouse') hoverAt(e.clientX, e.clientY);
      return;
    }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (gesture?.type === 'tap') {
      const dx = e.clientX - gesture.x0, dy = e.clientY - gesture.y0;
      if (!gesture.moved && Math.hypot(dx, dy) > 6) gesture.moved = true;
      if (gesture.moved && stage.classList.contains('zoomed')) {
        stage.classList.add('panning');
        hideTooltip();
        setView({ ...gesture.view0, x: gesture.view0.x - dx * gesture.scale, y: gesture.view0.y - dy * gesture.scale });
      }
    } else if (gesture?.type === 'pinch' && pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      zoomAround(gesture.p0, gesture.view0, (gesture.view0.w * gesture.d0) / (dist(a, b) || 1));
    }
  });

  function endPointer(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (e.type === 'pointerup' && gesture?.type === 'tap' && !gesture.moved) {
      onTap(partAt(e.clientX, e.clientY), e);
    }
    if (pointers.size === 0) {
      gesture = null;
      stage.classList.remove('panning');
    } else {
      gesture = { type: 'none' }; // a finger left after a pinch: don't treat it as a tap
    }
  }
  svg.addEventListener('pointerup', endPointer);
  svg.addEventListener('pointercancel', endPointer);
  svg.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse') { setHover(null); hideTooltip(); }
  });

  const wideLayout = window.matchMedia('(min-width: 1100px)');
  svg.addEventListener('wheel', (e) => {
    // On narrow layouts the page scrolls, so only zoom on pinch-gesture/ctrl+wheel there.
    if (!wideLayout.matches && !e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    zoomAtClient(Math.exp(-e.deltaY * 0.0018), e.clientX, e.clientY);
  }, { passive: false });

  $('#zoom-in').addEventListener('click', () => zoomCenter(1.4));
  $('#zoom-out').addEventListener('click', () => zoomCenter(1 / 1.4));
  $('#zoom-reset').addEventListener('click', () => setView(BASE));

  function hoverAt(x, y) {
    const id = partAt(x, y);
    setHover(id);
    // No name tooltips during the quiz: that would give the answer away!
    if (id && state.mode === 'explore') showTooltip(partText(id).name, x, y);
    else hideTooltip();
  }

  function onTap(id, e) {
    if (state.mode === 'quiz') {
      quizAnswer(id);
      return;
    }
    if (!id) return;
    select(id);
    if (e.pointerType !== 'mouse') showTooltip(partText(id).name, e.clientX, e.clientY, 1600);
  }

  /* ───────────── Selection & explore panel ───────────── */

  function select(id) {
    const firstTime = id && !state.visited.has(id);
    state.selected = id;
    if (id) {
      state.visited.add(id);
      save();
      sfx(firstTime ? 'discover' : 'click');
      announce(t('selected', { name: partText(id).name }));
    }
    refreshSelection();
    renderPanel();
  }

  function speakButton(action = 'speak') {
    if (!speechOK) return '';
    return `<button type="button" class="btn" data-action="${action}" aria-pressed="false">
      <span aria-hidden="true">🔊</span> <span class="speak-label">${esc(t('readAloud'))}</span></button>`;
  }

  function partCard(id) {
    const s = sysById[PARTS[id].system];
    const p = partText(id);
    return `
      <article class="card" style="--sys:${s.color}" aria-labelledby="card-title">
        <div class="card-head">
          <span class="card-emoji" aria-hidden="true">${s.emoji}</span>
          <div>
            <span class="card-sys">${esc(sysName(s.id))}</span>
            <h2 id="card-title">${esc(p.name)}</h2>
          </div>
        </div>
        <h3>${esc(t('whatItDoes'))}</h3>
        <p>${esc(p.info)}</p>
        <div class="fact">
          <h3><span aria-hidden="true">💡</span> ${esc(t('didYouKnow'))}</h3>
          <p>${esc(p.fact)}</p>
        </div>
        <div class="card-actions">
          ${speakButton()}
          <button type="button" class="btn secondary" data-action="back"><span aria-hidden="true">←</span> ${esc(t('backToStart'))}</button>
        </div>
      </article>`;
  }

  function welcomeCard() {
    const n = state.visited.size, total = PART_IDS.length;
    return `
      <article class="card" aria-labelledby="card-title">
        <div class="card-head">
          <span class="card-emoji" aria-hidden="true">👋</span>
          <h2 id="card-title">${esc(t('welcomeTitle'))}</h2>
        </div>
        <p style="margin-top:10px">${esc(t('welcomeText'))}</p>
        <div class="progress">
          <p><strong>${esc(n === total ? t('allFound') : t('progress', { n, total }))}</strong></p>
          <div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${n}">
            <span style="width:${Math.round((n / total) * 100)}%"></span>
          </div>
        </div>
      </article>`;
  }

  function systemGroup(s) {
    const chips = PART_IDS.filter((id) => PARTS[id].system === s.id).map((id) => {
      const seen = state.visited.has(id);
      return `<button type="button" class="chip" data-select="${id}" aria-current="${id === state.selected}">${esc(partText(id).name)}${seen
        ? `<span class="tick" aria-hidden="true">✓</span><span class="sr-only"> (${esc(t('visited'))})</span>` : ''}</button>`;
    }).join('');
    return `
      <section class="sys-group" style="--sys:${s.color}">
        <h3><span aria-hidden="true">${s.emoji}</span> ${esc(sysName(s.id))}</h3>
        <p class="sys-desc">${esc(s.desc[state.lang])}</p>
        <div class="chips">${chips}</div>
      </section>`;
  }

  function renderPanel() {
    stopSpeaking();
    if (state.mode === 'quiz') { renderQuiz(); return; }
    const html = [state.selected ? partCard(state.selected) : welcomeCard()];
    const active = SYSTEMS.filter((s) => state.layers.has(s.id));
    if (!active.length) html.push(`<p class="empty">${esc(t('noLayers'))}</p>`);
    else html.push(`<h2 class="sr-only">${esc(t('partsTitle'))}</h2>`, ...active.map(systemGroup));
    panel.innerHTML = html.join('');
  }

  /* ───────────── Quiz ───────────── */

  function shuffle(list) {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function setMode(mode) {
    if (mode === state.mode) return;
    stopSpeaking();
    hideTooltip();
    if (mode === 'quiz') {
      state.exploreLayers = new Set(state.layers);
      state.mode = 'quiz';
      state.quiz = { phase: 'intro' };
    } else {
      clearTimeout(state.quiz?.timer);
      state.mode = 'explore';
      state.layers = state.exploreLayers || new Set(DEFAULT_LAYERS);
      state.exploreLayers = null;
      state.quiz = null;
    }
    state.selected = null;
    renderStatic();
    applyLayers();
    refreshSelection();
    renderPanel();
    save();
  }

  function startQuiz() {
    state.quiz = { phase: 'question', order: shuffle(PART_IDS).slice(0, QUIZ_LENGTH), i: 0, score: 0 };
    showQuestion();
  }

  function showQuestion() {
    const q = state.quiz;
    clearTimeout(q.timer);
    Object.assign(q, { tries: 0, solved: false, feedback: null });
    const target = q.order[q.i];
    state.layers = new Set([PARTS[target].system]);
    applyLayers();
    setView(BASE);
    setHighlights([]);
    renderPanel();
    announce(`${t('quizFind')} ${partText(target).name}`);
  }

  function quizAnswer(id) {
    const q = state.quiz;
    if (!q || q.phase !== 'question' || q.solved || !id) return;
    const target = q.order[q.i];
    clearTimeout(q.timer);
    if (id === target) {
      q.solved = true;
      if (q.tries === 0) q.score++;
      q.feedback = { kind: 'good', pick: Math.floor(Math.random() * 100) };
      state.visited.add(target);
      save();
      setHighlights([[target, 'correct']]);
      sfx('correct');
      burst(6);
    } else {
      q.tries++;
      q.feedback = { kind: 'bad', part: id };
      sfx('wrong');
      const hint = q.tries >= 2 ? [[target, 'hint']] : [];
      setHighlights([[id, 'wrong'], ...hint]);
      q.timer = setTimeout(() => { if (state.quiz === q && !q.solved) setHighlights(hint); }, 1200);
    }
    renderPanel();
    announce(feedbackText(q.feedback));
  }

  function feedbackText(fb) {
    if (!fb) return '';
    if (fb.kind === 'good') {
      const cheers = UI[state.lang].quizCorrect;
      return cheers[fb.pick % cheers.length];
    }
    return t('quizWrong', { name: partText(fb.part).name });
  }

  function nextQuestion() {
    const q = state.quiz;
    q.i++;
    if (q.i >= q.order.length) {
      q.phase = 'done';
      setHighlights([]);
      renderPanel();
      sfx('fanfare');
      burst(14);
    } else {
      showQuestion();
    }
  }

  function renderQuiz() {
    const q = state.quiz;
    if (q.phase === 'intro') {
      panel.innerHTML = `
        <article class="card" aria-labelledby="card-title">
          <div class="card-head">
            <span class="card-emoji" aria-hidden="true">⭐</span>
            <h2 id="card-title">${esc(t('quizTitle'))}</h2>
          </div>
          <p style="margin-top:10px">${esc(t('quizIntro', { total: QUIZ_LENGTH }))}</p>
          <div class="card-actions">
            <button type="button" class="btn big" data-action="quiz-start">${esc(t('quizStart'))}</button>
          </div>
        </article>`;
      return;
    }

    if (q.phase === 'done') {
      const total = q.order.length, ratio = q.score / total;
      const message = ratio >= 0.8 ? 'quizScoreGreat' : ratio >= 0.5 ? 'quizScoreGood' : 'quizScoreKeep';
      panel.innerHTML = `
        <article class="card quiz-done" aria-labelledby="card-title">
          <h2 id="card-title">${esc(t('quizDoneTitle'))}</h2>
          <p class="big-stars quiz-stars" aria-hidden="true">${'★'.repeat(q.score)}${'☆'.repeat(total - q.score)}</p>
          <p><strong>${esc(t('quizScore', { score: q.score, total }))}</strong></p>
          <p>${esc(t(message))}</p>
          <div class="card-actions" style="justify-content:center">
            <button type="button" class="btn big" data-action="quiz-start">${esc(t('quizAgain'))}</button>
            <button type="button" class="btn secondary" data-action="quiz-exit">${esc(t('quizBackExplore'))}</button>
          </div>
        </article>`;
      return;
    }

    const target = q.order[q.i];
    const s = sysById[PARTS[target].system];
    const p = partText(target);
    const fb = q.feedback;
    const last = q.i === q.order.length - 1;
    panel.innerHTML = `
      <article class="card" style="--sys:${s.color}" aria-labelledby="card-title">
        <div class="quiz-meta">
          <span>${esc(t('quizProgress', { n: q.i + 1, total: q.order.length }))}</span>
          <span class="quiz-stars" aria-label="${esc(t('stars'))}: ${q.score}">★ ${q.score}</span>
        </div>
        <div class="progress-bar" aria-hidden="true"><span style="width:${Math.round((q.i / q.order.length) * 100)}%"></span></div>
        <p style="margin-top:12px;font-weight:700">${esc(t('quizFind'))}</p>
        <div class="quiz-target">
          <span class="card-emoji" aria-hidden="true">${s.emoji}</span>
          <strong id="card-title">${esc(p.name)}</strong>
        </div>
        <p class="hint" style="margin-top:8px">${esc(t('quizTap'))}</p>
        <p class="feedback ${fb ? (fb.kind === 'good' ? 'good' : 'bad') : ''}">${esc(feedbackText(fb))}</p>
        ${!q.solved && q.tries >= 2 ? `<p class="hint">${esc(t('quizHint'))}</p>` : ''}
        ${q.solved ? `<div class="fact"><h3><span aria-hidden="true">💡</span> ${esc(t('didYouKnow'))}</h3><p>${esc(p.fact)}</p></div>` : ''}
        <div class="card-actions">
          ${speakButton('speak-question')}
          ${q.solved
            ? `<button type="button" class="btn big" data-action="quiz-next">${esc(t(last ? 'quizFinish' : 'quizNext'))} <span aria-hidden="true">→</span></button>`
            : `<button type="button" class="btn secondary" data-action="quiz-skip">${esc(t('quizSkip'))}</button>`}
        </div>
      </article>`;
  }

  /* ───────────── Speech (read aloud) ───────────── */

  const speechOK = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  let currentUtterance = null;
  let speakingBtn = null;

  function pickVoice() {
    const voices = window.speechSynthesis.getVoices();
    for (const loc of SPEECH_LOCALES[state.lang]) {
      const v = voices.find((voice) => voice.lang.replace('_', '-').toLowerCase().startsWith(loc.toLowerCase()));
      if (v) return v;
    }
    return null;
  }

  function setSpeakBtn(btn, speaking) {
    if (!btn || !btn.isConnected) return;
    btn.setAttribute('aria-pressed', String(speaking));
    $('.speak-label', btn).textContent = t(speaking ? 'stopReading' : 'readAloud');
  }

  function speak(text, btn) {
    if (!speechOK) return;
    if (btn && speakingBtn === btn) { stopSpeaking(); return; }
    stopSpeaking();
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    u.lang = voice ? voice.lang : SPEECH_LOCALES[state.lang][0];
    if (voice) u.voice = voice;
    u.rate = 0.92;
    u.pitch = 1.05;
    const done = () => {
      if (currentUtterance !== u) return;
      setSpeakBtn(speakingBtn, false);
      speakingBtn = null;
      currentUtterance = null;
    };
    u.onend = done;
    u.onerror = done;
    currentUtterance = u;
    speakingBtn = btn || null;
    setSpeakBtn(btn, true);
    window.speechSynthesis.speak(u);
  }

  function stopSpeaking() {
    if (!speechOK) return;
    currentUtterance = null;
    window.speechSynthesis.cancel();
    setSpeakBtn(speakingBtn, false);
    speakingBtn = null;
  }

  /* ───────────── Sound effects & fun ───────────── */

  let audioCtx = null;
  const TUNES = {
    click: [[660, 0, 0.05]],
    discover: [[523, 0, 0.08], [784, 0.08, 0.14]],
    correct: [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.2]],
    wrong: [[247, 0, 0.14], [196, 0.13, 0.22]],
    fanfare: [[523, 0, 0.12], [659, 0.12, 0.12], [784, 0.24, 0.12], [1047, 0.36, 0.35]],
  };

  function sfx(kind) {
    if (!state.sound) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const t0 = audioCtx.currentTime;
      for (const [freq, start, dur] of TUNES[kind]) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = kind === 'wrong' ? 'triangle' : 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t0 + start);
        gain.gain.exponentialRampToValueAtTime(kind === 'click' ? 0.06 : 0.16, t0 + start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(t0 + start);
        osc.stop(t0 + start + dur + 0.03);
      }
    } catch { /* audio not available */ }
  }

  function burst(n) {
    if (reducedMotion.matches) return;
    const icons = ['⭐', '✨', '🌟'];
    for (let i = 0; i < n; i++) {
      const el = document.createElement('span');
      el.textContent = icons[i % icons.length];
      el.style.left = `${25 + Math.random() * 50}%`;
      el.style.top = `${30 + Math.random() * 40}%`;
      el.style.setProperty('--dx', `${Math.round(Math.random() * 120 - 60)}px`);
      el.style.animationDelay = `${i * 50}ms`;
      fx.append(el);
      setTimeout(() => el.remove(), 1500 + i * 50);
    }
  }

  const announcer = $('#announcer');
  function announce(text) {
    announcer.textContent = '';
    requestAnimationFrame(() => { announcer.textContent = text; });
  }

  /* ───────────── Events ───────────── */

  layerList.addEventListener('click', (e) => {
    const b = e.target.closest('.layer-btn');
    if (b && state.mode === 'explore') toggleLayer(b.dataset.layer);
  });
  $('#show-all').addEventListener('click', () => setAllLayers(true));
  $('#hide-all').addEventListener('click', () => setAllLayers(false));

  $('#mode-switch').addEventListener('click', (e) => {
    const b = e.target.closest('[data-mode]');
    if (b) setMode(b.dataset.mode);
  });

  $('#lang-switch').addEventListener('click', (e) => {
    const b = e.target.closest('[data-lang]');
    if (!b || b.dataset.lang === state.lang) return;
    state.lang = b.dataset.lang;
    save();
    renderStatic();
    applyLayers();
    renderPanel();
    hideTooltip();
  });

  $('#sound-toggle').addEventListener('click', () => {
    state.sound = !state.sound;
    save();
    renderStatic();
    sfx('click');
  });

  panel.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-select]');
    if (chip) {
      const id = chip.dataset.select;
      select(id);
      $(`[data-select="${id}"]`, panel)?.focus({ preventScroll: true });
      panel.scrollTo({ top: 0, behavior: 'smooth' }); // show the info card
      return;
    }
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    switch (action) {
      case 'speak': {
        const p = partText(state.selected);
        speak(`${p.name}. ${p.info} ${t('didYouKnow')} ${p.fact}`, btn);
        return;
      }
      case 'speak-question': {
        const q = state.quiz;
        const p = partText(q.order[q.i]);
        speak(q.solved ? `${feedbackText(q.feedback)} ${p.fact}` : `${t('quizFind')} ${p.name}?`, btn);
        return;
      }
      case 'back': select(null); break;
      case 'quiz-start': startQuiz(); break;
      case 'quiz-next': nextQuestion(); break;
      case 'quiz-skip': nextQuestion(); break;
      case 'quiz-exit': setMode('explore'); break;
      default: return;
    }
    // Keep keyboard focus inside the panel after it re-renders.
    const again = $(`[data-action="${action}"]`, panel) || $('button', panel);
    if (again) again.focus({ preventScroll: true });
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea')) return;
    if (e.key === 'Escape' && state.mode === 'explore' && state.selected) select(null);
    else if (e.key === '+' || e.key === '=') zoomCenter(1.4);
    else if (e.key === '-') zoomCenter(1 / 1.4);
    else if (e.key === '0') setView(BASE);
  });

  /* ───────────── Start ───────────── */

  setView(BASE);
  renderStatic();
  applyLayers();
  renderPanel();
})();
