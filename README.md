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
- **No dependencies, no build step, no tracking, no external requests.** All drawings are generated SVG.

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
