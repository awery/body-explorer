# Body Explorer · Explore ton corps · Ontdek je lichaam

An interactive, child-friendly tour of the human body that runs in the browser.
It's available in **French, Dutch and English** and was made for primary-school children (about 6–11 years old).

Children switch the body's **layers** on and off. Each layer is one body system. They can tap any organ, bone or
muscle to learn what it does, along with a fun "Did you know?" fact. A **quiz mode** turns it into a
find-the-body-part game.

## Features

- **8 body systems, 42 parts**: skin & senses, skeleton, muscles, brain & nerves, heart & blood, breathing,
  digestion, kidneys & bladder.
- **Stacked layers**: when deeper systems are shown, the skin and muscles become see-through so you can look
  inside. Taps go through those see-through layers to the organ underneath.
- **Info cards** with a short explanation, a fun fact and a **read-aloud** button (browser speech synthesis,
  using a French, Dutch or English voice).
- **Quiz**: 10 random "Can you find…?" questions, with a hint after two wrong tries and a star score at the end.
- **Discovery progress**: a ✓ appears next to each part a child has already opened (saved in the browser).
- **Zoom & pan**: buttons, mouse wheel, pinch and drag; keyboard `+` `-` `0`.
- Small touches: a beating heart, breathing lungs and blinking eyes, plus optional sound effects.
- Works on **desktop, tablet and phone**, supports **dark mode**, and respects *reduced motion* settings.
- Accessibility: keyboard-friendly controls, screen-reader labels and live announcements. Every body part can also be
  picked from a list of buttons, not just by clicking the drawing.
- **No dependencies, no build step, no tracking, no external requests.** All 2D drawings are generated SVG.

## Running it

Open `index.html` in a browser. That's all: it works straight from the file system.

Or serve the folder with any static web server, for example:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

To force a language, add `?lang=fr`, `?lang=nl` or `?lang=en` to the URL. Otherwise the app uses the browser
language, then the last language chosen.

### Publishing with GitHub Pages

Push the repository to GitHub, then go to **Settings → Pages → Build and deployment**. Choose
*Deploy from a branch*, then `main` / `(root)`. The site is published at `https://<user>.github.io/<repo>/`.

## 3D view (prototype)

`3d/index.html` shows a real 3D body that you can rotate, zoom into and tap. It shares the
texts, languages and "discovered parts" progress with the 2D app.

- Rendered with **three.js WebGPURenderer**: it uses **WebGPU** where the browser supports it
  and falls back to **WebGL 2** automatically. A badge shows which one is in use.
- Shaders are written in **TSL** (three.js shading language). They give a glowing X-ray skin,
  a pulsing highlight on the selected part that is visible through bones, a beating heart and
  breathing lungs, all computed on the GPU.
- **Cut** slider: a clipping plane slices the body from front to back to look inside organs.
- **Spread out** slider: the visible body systems slide apart side by side.
- Tapping a part flies the camera to it and opens its info card.
- 7 of the 8 systems are available. The source data has almost no skeletal muscles and no
  peripheral nerves, so *Muscles* is marked "not in 3D yet" and *Brain & nerves* has the brain
  and spinal cord only. Hair and ears are not in the 3D model either.

**It needs a web server**, because browsers don't load ES modules or 3D models from `file://`.
Use `python3 -m http.server` and open `http://localhost:8000/3d/`, or use GitHub Pages.

Download size: about 6 MB for the model and 4 MB of JavaScript (about 1 MB once compressed by the server).

### Rebuilding the 3D model

The model comes from **BodyParts3D, © The Database Center for Life Science, licensed under
CC Attribution 4.0 International**. That credit is shown in the 3D page footer and must be kept.

1. Download from https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html:
   `partof_element_parts.txt` and `partof_BP3D_4.0_obj_99.zip`. Unzip the zip so the folder
   contains `partof_BP3D_4.0_obj_99/FJ*.obj`.
2. Run Blender headless (4.2 or newer; tested with 5.0):
   ```sh
   blender -b --factory-startup -Y --python-exit-code 1 \
     -P tools/3d/build_model.py -- --bp3d /path/to/bodyparts3d --out 3d/model/body.glb
   ```

The script maps the app's parts to BodyParts3D concepts and sets a triangle budget per part
(see `PARTS` at the top of the script). It also dresses the skin in swim shorts, because the
source body is an unclothed adult. three.js 0.187.0 is vendored unmodified in `3d/vendor/three/` (MIT).

## Project structure

```
index.html          Page layout
css/styles.css      All styling (theme, layout, animations, responsive rules)
js/content.js       Body systems and parts: names, explanations and fun facts in FR/NL/EN
js/i18n.js          Interface text in FR/NL/EN, speech locales
js/body-svg.js      Generates the layered SVG body illustration
js/app.js           App logic: layers, selection, zoom/pan, read aloud, sounds, quiz
assets/favicon.svg  Icon
tests/index.html    Consistency checks (open it in a browser)
3d/                 3D view (prototype): index.html, app3d.js, style3d.css, model/, vendor/three/
tools/3d/           Blender script that builds 3d/model/body.glb from BodyParts3D
```

## Checking the content

Open `tests/index.html` in a browser. It checks that:

- every part has a name, explanation and fact in all three languages;
- every interface string exists in all three languages, with matching `{placeholders}`;
- every part in `content.js` is drawn in the right layer of the illustration, and every drawn part has content.

Run it after editing texts or drawings. Headless runs work too:

```sh
google-chrome --headless=new --dump-dom tests/index.html | grep summary
```

## Adding or changing content

- **Texts**: edit `js/content.js` (body parts) or `js/i18n.js` (interface). Keep the three languages in sync.
- **A new body part**:
  1. Add an entry in `PARTS` in `js/content.js` with its `system` and its `en`/`fr`/`nl` texts.
  2. Draw it in the matching layer function in `js/body-svg.js`, wrapped in `part('yourId', …)`.
  3. Open `tests/index.html` to confirm everything matches.
- **Drawing coordinates**: the body uses a 400 × 800 viewBox centred on x = 200. Most shapes are drawn for the
  left side only and mirrored with `both()` / `symMarkup()`.

## Notes

- The illustration is a simplified, educational drawing, not an exact anatomical one, and not to scale.
- Read-aloud uses the voices installed on the device. If no French or Dutch voice is installed, the browser may
  fall back to another voice. Most phones, tablets, Windows and macOS include them.
- No licence has been chosen yet. Add a `LICENSE` file before publishing if you want others to reuse the code.
