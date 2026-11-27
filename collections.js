// MATERIAL MEDIA STORAGE — Collections
(() => {
  const root = document.documentElement;

  // detail pages, other filters and About · Archive · Login · Search come later
  document.querySelectorAll("[data-soon]").forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // All: every work of every category on one page (no pagination) — the grid lines follow the number of rows
  const grid = document.querySelector(".cl-grid");
  if (grid && grid.querySelector("[data-page]")) {
    const cells = [...grid.querySelectorAll(".cl-item")];
    cells.forEach((el) => (el.hidden = false));
    grid.querySelectorAll(".cl-line").forEach((l) => l.remove());
    const rows = Math.max(1, Math.ceil(cells.length / 4)), H = rows * 389;
    const add = (cls, style) => { const i = document.createElement("i"); i.className = "cl-line " + cls; if (style) i.setAttribute("style", style); grid.appendChild(i); };
    add("cl-line--h cl-line--top");
    for (let r = 1; r <= rows; r++) add("cl-line--h", `top:calc(${r * 389} * var(--s) - 1px)`);
    [351, 701, 1052].forEach((x) => add("cl-line--v", `left:calc(${x} / 1403 * 100%); height:calc(${H} * var(--s))`));
  }

  // Categories dropdown: the chevron box opens the list; a category goes to its page (unfinished ones stay put)
  const cats = document.getElementById("clCats");
  if (cats) {
    const cb = cats.querySelector(".cl-cats__btn");
    const openC = (on) => { cats.classList.toggle("is-open", on); cb.setAttribute("aria-expanded", on); };
    cb.addEventListener("click", (e) => { e.stopPropagation(); openC(!cats.classList.contains("is-open")); });
    cats.querySelectorAll(".cl-cats__menu a").forEach((a) => a.addEventListener("click", () => openC(false)));
    document.addEventListener("click", (e) => { if (!cats.contains(e.target)) openC(false); });
    addEventListener("keydown", (e) => { if (e.key === "Escape") openC(false); });
  }

  // ---------- entrance ----------
  if (!root.classList.contains("cl-intro")) { root.classList.add("cl-built"); return; }

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  // no scrolling while the entrance plays (wheel, trackpad, touch, keys); the layout is left alone so nothing jumps
  const SCROLL_KEYS = new Set([" ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End"]);
  const stopScroll = (e) => { if (e.type !== "keydown" || SCROLL_KEYS.has(e.key)) e.preventDefault(); };
  const pin = () => window.scrollTo(0, 0);
  ["wheel", "touchmove", "keydown"].forEach((ev) => addEventListener(ev, stopScroll, { passive: false }));
  addEventListener("scroll", pin);
  const unlockScroll = () => {
    ["wheel", "touchmove", "keydown"].forEach((ev) => removeEventListener(ev, stopScroll, { passive: false }));
    removeEventListener("scroll", pin);
  };
  let boxes = [...document.querySelectorAll(".cl-item:not([hidden]) .cl-img")];   // only the works on this page
  // All (every work on one long page): only the works of the first screen fly in; the rest are simply there below
  if (document.querySelector(".cl-grid [data-page]")) boxes = boxes.filter((b) => b.closest(".cl-item").getBoundingClientRect().top < innerHeight);
  const finish = () => {
    root.classList.add("cl-built");
    root.classList.remove("cl-intro");
    unlockScroll();
  };
  let doneAt = 0;
  const end = () => { if (done) return; done = true; doneAt = performance.now(); finish(); removeEventListener("pointerdown", skip, true); };
  // a click anywhere during the motion skips it (keys don't — so screen capture shortcuts still work): everything goes straight home
  function skip(e) {
    if (done) return;
    e.preventDefault(); e.stopPropagation();
    skipping = true;
    timers.forEach(clearTimeout);
    if (onSkip) onSkip();
    boxes.forEach((b) => { b.style.opacity = ""; set(b, T(0, 0, 0, 0, 0, 0, 1), "transform 450ms cubic-bezier(0.22, 0.61, 0.36, 1)"); });
    setTimeout(() => { boxes.forEach(clean); end(); }, 470);
  }

  // three beats, like screens in space rather than photos on a table:
  //  1) every work stacked as flat layers of one size, stepping down-right (like the reference sketch)
  //  2) they fly apart — different sizes, seen from the side, from the front, from below … (twice)
  //  3) each one turns flat and lands in its own cell; then the lines and the rest appear
  const STACK = 700, SCATTER = 1000, HOLD = 450, HOME = 1100, STAGGER = 40;   // ms
  const EASE = "cubic-bezier(0.65, 0, 0.25, 1)";
  const rnd = (i, k) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };   // fixed "random"
  const T = (dx, dy, dz, rx, ry, rz, s) =>
    `perspective(1400px) translate3d(${dx}px, ${dy}px, ${dz}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s})`;
  const set = (b, t, tr) => { b.style.transition = tr || "none"; b.style.transform = t; };
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clean = (b) => ["transition", "transform", "zIndex", "position", "visibility", "transformOrigin", "willChange", "opacity", "filter"].forEach((p) => (b.style[p] = ""));
  let done = false, skipping = false, onSkip = null;

  // viewing angles for beat 2: side, other side, front, from below, from above, tilted
  const VIEWS = [[6, -40, 0], [4, 38, 2], [0, 0, -4], [40, 6, 0], [-32, -10, 3], [16, 30, -8], [-18, -26, 6], [28, -32, 0]];

  const start = () => {
    window.scrollTo(0, 0);
    addEventListener("pointerdown", skip, true);
    // the click that skips must not also open a work
    const eat = (e) => { if (!done || performance.now() - doneAt < 300) { e.preventDefault(); e.stopPropagation(); } };
    addEventListener("click", eat, true);
    const vw = innerWidth, vh = innerHeight, n = boxes.length;
    const rects = boxes.map((b) => b.getBoundingClientRect());
    const unit = Math.min(vw, vh * 1.6) * 0.27;          // stack layer width

    // 1) stack: flat cards of one size, each step a little right and down, the later ones in front
    const step = Math.min(vw, vh * 1.6) * 0.022;
    boxes.forEach((b, i) => {
      const r = rects[i], k = i - (n - 1) / 2;
      const cx = vw * 0.5 + k * step * 1.15, cy = vh * 0.5 + k * step;
      const dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2);
      b.style.position = "relative"; b.style.zIndex = String(20 + i);
      b.style.transformOrigin = "50% 50%"; b.style.willChange = "transform";
      // same box size for all: scale each picture to the stack card (fit inside unit × unit*0.62)
      const s = Math.min(unit / r.width, (unit * 0.62) / r.height);
      set(b, T(dx, dy, 0, 0, 0, 0, s));
      b.style.visibility = "visible";
    });

    // 2) scatter, twice — every work gets its own cell of a 5 × 4 grid over the screen (no overlaps),
    //    a size that fits that cell, and a new viewing angle each round
    const ROUNDS = 2, COLS = 5, ROWS = 4;
    const cw = vw / COLS, ch = (vh * 0.9) / ROWS, top0 = vh * 0.05;
    const order = (round) => {            // fixed shuffle of the 20 cells for this round
      const cells = [...Array(COLS * ROWS).keys()];
      for (let i = cells.length - 1; i > 0; i--) { const t = Math.floor(rnd(i, 50 + round * 7) * (i + 1)); [cells[i], cells[t]] = [cells[t], cells[i]]; }
      return cells;
    };
    const scatter = (round) => {
      const cells = order(round);
      boxes.forEach((b, i) => {
        const r = rects[i], v = VIEWS[(i + round * 3) % VIEWS.length], k = round * 10;
        const c = cells[i], col = c % COLS, row = Math.floor(c / COLS);
        const fit = Math.min((cw * 0.9) / r.width, (ch * 0.9) / r.height);
        const s = fit * (0.78 + 0.22 * rnd(i, 3 + k));
        const freeX = cw - r.width * s, freeY = ch - r.height * s;   // room left in the cell → small shift inside it
        const tx = col * cw + cw / 2 + (rnd(i, 1 + k) - 0.5) * freeX * 0.8;
        const ty = top0 + row * ch + ch / 2 + (rnd(i, 2 + k) - 0.5) * freeY * 0.8;
        const dx = tx - (r.left + r.width / 2), dy = ty - (r.top + r.height / 2);
        b.style.zIndex = String(50 + i);
        set(b, T(dx, dy, 0, v[0], v[1], v[2], s), `transform ${SCATTER}ms ${EASE} ${i * 25}ms`);
      });
    };
    for (let rd = 0; rd < ROUNDS; rd++) later(() => scatter(rd), STACK + rd * (SCATTER + HOLD));

    // 3) home: flat, real size, own cell
    later(() => {
      boxes.forEach((b, i) => set(b, T(0, 0, 0, 0, 0, 0, 1), `transform ${HOME}ms ${EASE} ${i * STAGGER}ms`));
      later(() => { boxes.forEach(clean); end(); }, HOME + STAGGER * (n - 1) - 100);
    }, STACK + ROUNDS * (SCATTER + HOLD));
  };

  // ---------- Performance: a streamlined (유선형) motion instead ----------
  // the works leave the centre one after another and glide along one smooth figure-eight like a
  // ribbon in a dancer's hand — each turning with the curve and breathing in size — then each peels
  // off on a curved path, continuing its own flow, and settles flat in its cell.
  const flow = () => {
    window.scrollTo(0, 0);
    addEventListener("pointerdown", skip, true);
    const eat = (e) => { if (!done || performance.now() - doneAt < 300) { e.preventDefault(); e.stopPropagation(); } };
    addEventListener("click", eat, true);
    const vw = innerWidth, vh = innerHeight, n = boxes.length;
    const rects = boxes.map((b) => b.getBoundingClientRect());
    const unit = Math.min(vw, vh * 1.6) * 0.2;
    const cx = vw / 2, cy = vh / 2, A = vw * 0.36, B = vh * 0.62;
    const LOOP = 4200, GAP = 70, RUN = 1900, HOMEMS = 1300, HSTAG = 25;   // ms
    const W = (Math.PI * 2) / LOOP;
    // figure-eight: passes through the centre at θ = 0
    const P = (th) => [cx + A * Math.sin(th), cy + B * Math.sin(th) * Math.cos(th)];
    const D = (th) => [A * Math.cos(th), B * Math.cos(2 * th)];
    const smooth = (x) => x * x * x * (x * (x * 6 - 15) + 10);   // smootherstep: starts and ends with no jolt
    const base = rects.map((r) => Math.min(unit / r.width, (unit * 0.66) / r.height));
    boxes.forEach((b, i) => {
      b.style.position = "relative"; b.style.zIndex = String(20 + i);   // fixed stacking: nothing pops in front
      b.style.transformOrigin = "50% 50%"; b.style.willChange = "transform"; b.style.transition = "none";
      b.style.visibility = "visible";
    });
    const pose = (i, t) => {             // where work i is in the stream at time t
      const run = Math.max(0, t - i * GAP), th = run * W;
      const [x, y] = P(th), [dx, dy] = D(th);
      const k = smooth(Math.min(1, run / 700));            // grows softly out of the centre
      const rz = 16 * (dy / (Math.hypot(dx, dy) || 1)) * k; // leans with the curve, no flips
      const s = base[i] * (0.55 + 0.45 * k) * (0.94 + 0.12 * Math.sin(th * 2 + i));
      const ry = 18 * Math.sin(th + i * 0.4) * k;
      return { x, y, s, rz, ry };
    };
    const put = (b, r, x, y, s, rz, ry) => {
      b.style.transform = T(x - (r.left + r.width / 2), y - (r.top + r.height / 2), 0, 0, ry, rz, s);
    };
    const t0 = performance.now();
    // the stream keeps flowing while each work is drawn home: one continuous blend, so the speed never breaks
    const frame = (now) => {
      if (done || skipping) return;
      const t = now - t0;
      let all = true;
      boxes.forEach((b, i) => {
        const r = rects[i], q = pose(i, t);
        let u = (t - RUN - i * HSTAG) / HOMEMS;
        if (u < 1) all = false;
        const w = smooth(Math.max(0, Math.min(1, u)));
        const hx = r.left + r.width / 2, hy = r.top + r.height / 2;
        put(b, r, q.x + (hx - q.x) * w, q.y + (hy - q.y) * w, q.s + (1 - q.s) * w, q.rz * (1 - w), q.ry * (1 - w));
      });
      if (all) { boxes.forEach(clean); end(); return; }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  // ---------- Digital Image: spin in place → a huge pile of layers → flat 2D ----------
  // every picture spins in its own cell, then they all sink into one tall stack of layers seen at an angle
  // (more layers than works — the pile keeps building), the stack folds down flat, and the works lay out in 2D.
  const layers = () => {
    window.scrollTo(0, 0);
    addEventListener("pointerdown", skip, true);
    const eat = (e) => { if (!done || performance.now() - doneAt < 300) { e.preventDefault(); e.stopPropagation(); } };
    addEventListener("click", eat, true);
    const vw = innerWidth, vh = innerHeight, n = boxes.length;
    const rects = boxes.map((b) => b.getBoundingClientRect());
    const SPIN = 1900, SINK = 1000, BUILD = 1600, FLAT = 1000, LAND = 1200, LSTAG = 40;   // ms
    const E = "cubic-bezier(0.65, 0, 0.25, 1)";
    const cardW = Math.min(vw * 0.26, 380), cardH = cardW * 0.66;
    boxes.forEach((b, i) => {
      b.style.position = "relative"; b.style.zIndex = String(20 + i);
      b.style.transformOrigin = "50% 50%"; b.style.willChange = "transform, opacity";
      set(b, T(0, 0, 0, 0, 0, 0, 1)); b.style.visibility = "visible";
    });
    // 1) spin where they are
    requestAnimationFrame(() => boxes.forEach((b, i) =>
      set(b, T(0, 0, 0, 18 * Math.sin(i), 360, 0, 0.92), `transform ${SPIN}ms ${E} ${i * 25}ms`)));

    // the pile: its own layer over the page
    const L = 54, GAP = Math.min(vh * 0.009, 9);
    const pile = document.createElement("div");
    pile.className = "cl-pile";
    pile.style.cssText = "position:fixed;inset:0;z-index:300;pointer-events:none;perspective:1600px;";
    const stk = document.createElement("div");
    stk.style.cssText = `position:absolute;left:50%;top:50%;width:${cardW}px;height:${cardH}px;margin:${-cardH / 2 + L * GAP * 0.42}px 0 0 ${-cardW / 2}px;` +
      `transform-style:preserve-3d;transform:rotateX(58deg) rotateZ(-38deg);transition:transform ${FLAT}ms ${E};`;
    pile.appendChild(stk);
    const srcs = boxes.map((b) => b.querySelector("img").currentSrc || b.querySelector("img").src);
    const sheets = [];
    for (let k = 0; k < L; k++) {
      const im = document.createElement("img");
      im.src = srcs[k % n]; im.alt = "";
      im.style.cssText = `position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;opacity:0;` +
        `transform:translateZ(${k * GAP}px);box-shadow:0 0 0 1px rgba(255,255,255,.35);transition:opacity 160ms linear, transform ${FLAT}ms ${E};`;
      stk.appendChild(im); sheets.push(im);
    }
    document.body.appendChild(pile);
    onSkip = () => pile.remove();

    // 2) sink into the middle (each work turns into the angle of the pile and fades into it) while the pile builds up
    later(() => {
      boxes.forEach((b, i) => {
        const r = rects[i], s = Math.min(cardW / r.width, cardH / r.height);
        const dx = vw / 2 - (r.left + r.width / 2), dy = vh / 2 - (r.top + r.height / 2);
        set(b, T(dx, dy, 0, 58, 0, -38, s), `transform ${SINK}ms ${E} ${i * 20}ms`);
        b.style.transition += `, opacity 300ms linear ${SINK - 200 + i * 20}ms`;
        b.style.opacity = "0";
      });
      sheets.forEach((im, k) => later(() => (im.style.opacity = "1"), 250 + (k * BUILD) / L));
    }, SPIN);

    // 3) the pile folds flat into one 2D picture …
    later(() => {
      stk.style.transition = `transform ${FLAT}ms ${E}, margin ${FLAT}ms ${E}`;
      stk.style.marginTop = `${-cardH / 2}px`;
      stk.style.transform = "rotateX(0deg) rotateZ(0deg)";
      sheets.forEach((im) => (im.style.transform = "translateZ(0px)"));
    }, SPIN + 250 + BUILD + 150);

    // … and the works lay out from it, flat, into their cells
    later(() => {
      boxes.forEach((b, i) => {
        const r = rects[i], s = Math.min(cardW / r.width, cardH / r.height);
        const dx = vw / 2 - (r.left + r.width / 2), dy = vh / 2 - (r.top + r.height / 2);
        set(b, T(dx, dy, 0, 0, 0, 0, s)); b.style.opacity = "1"; b.style.zIndex = String(400 + i);
      });
      pile.style.transition = "opacity 300ms linear"; pile.style.opacity = "0";
      requestAnimationFrame(() => boxes.forEach((b, i) => set(b, T(0, 0, 0, 0, 0, 0, 1), `transform ${LAND}ms ${E} ${i * LSTAG}ms`)));
      later(() => { pile.remove(); boxes.forEach(clean); end(); }, LAND + LSTAG * (n - 1) + 40);
    }, SPIN + 250 + BUILD + 150 + FLAT);
  };
  // ---------- Software-based art: the pictures never leave their cells ----------
  // like the software loop film: a pulse runs from the centre of the screen out to the edges (they grow in,
  // swelling a little), comes back from the edges to the centre (they shrink, leaning like a lens), and goes
  // out once more to settle at full size. Only size and lean change — every picture stays in its place.
  const radial = () => {
    window.scrollTo(0, 0);
    addEventListener("pointerdown", skip, true);
    const eat = (e) => { if (!done || performance.now() - doneAt < 300) { e.preventDefault(); e.stopPropagation(); } };
    addEventListener("click", eat, true);
    const vw = innerWidth, vh = innerHeight, n = boxes.length;
    const rects = boxes.map((b) => b.getBoundingClientRect());
    const cx = vw / 2, cy = vh / 2, maxD = Math.hypot(cx, cy);
    const info = rects.map((r) => {
      const x = r.left + r.width / 2 - cx, y = r.top + r.height / 2 - cy;
      return { d: Math.min(1, Math.hypot(x, y) / maxD), nx: x / cx, ny: y / cy };
    });
    const smooth = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * x * (x * (x * 6 - 15) + 10); };
    // passes: out (centre → edge), in (edge → centre), out again
    const LAG = 700;                                   // how long the pulse takes to cross the screen
    // never bigger than the real size: out to 1, back in to tiny, and out once more to stay
    const PASS = [
      { at: 0,    dur: 1100, to: 1,    out: true },
      { at: 1350, dur: 1100, to: 0.12, out: false },
      { at: 2700, dur: 1200, to: 1,    out: true },
    ];
    const TOTAL = PASS[PASS.length - 1].at + PASS[PASS.length - 1].dur + LAG + 60;
    // pixel feel without any stutter: the motion stays smooth, but the picture itself is drawn as a mosaic —
    // big blocks while it is small, finer and finer as it grows, sharp again at full size
    const imgs = boxes.map((b) => b.querySelector("img"));
    const pix = boxes.map((b) => {
      const cv = document.createElement("canvas");
      cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;image-rendering:crisp-edges;pointer-events:none;";
      b.style.position = "relative"; b.appendChild(cv);
      return { cv, ctx: cv.getContext("2d"), cols: -1 };
    });
    const pixel = (i, s) => {
      const P = pix[i], im = imgs[i];
      const cols = s >= 0.985 ? 0 : Math.max(5, Math.round(6 + Math.pow(Math.min(1, s), 2.2) * 58));
      if (cols === P.cols || !im.naturalWidth) return;
      P.cols = cols;
      if (!cols) { P.cv.style.display = "none"; return; }
      const r = rects[i], rows = Math.max(3, Math.round((cols * r.height) / r.width));
      P.cv.style.display = "block"; P.cv.width = cols; P.cv.height = rows;
      // object-fit: cover crop, like the real image
      const ar = im.naturalWidth / im.naturalHeight, br = r.width / r.height;
      let sw = im.naturalWidth, sh = im.naturalHeight, sx = 0, sy = 0;
      if (ar > br) { sw = sh * br; sx = (im.naturalWidth - sw) / 2; } else { sh = sw / br; sy = (im.naturalHeight - sh) / 2; }
      P.ctx.imageSmoothingEnabled = true; P.ctx.drawImage(im, sx, sy, sw, sh, 0, 0, cols, rows);
    };
    onSkip = () => pix.forEach((P) => P.cv.remove());
    boxes.forEach((b) => {
      b.style.position = "relative"; b.style.transformOrigin = "50% 50%"; b.style.willChange = "transform";
      b.style.transition = "none"; b.style.transform = T(0, 0, 0, 0, 0, 0, 0.04); b.style.visibility = "visible";
    });
    const t0 = performance.now();
    const frame = (now) => {
      if (done || skipping) return;
      const raw = now - t0, t = raw;
      boxes.forEach((b, i) => {
        const { d, nx, ny } = info[i];
        let s = 0.04;
        PASS.forEach((ps) => {
          const lag = (ps.out ? d : 1 - d) * LAG;
          const u = smooth((t - ps.at - lag) / ps.dur);
          if (t >= ps.at + lag) s = s + (ps.to - s) * u;   // picks up from wherever the last pass left it: no jumps
        });
        // the smaller it is, the more it leans away from the centre (a lens / bulge like the film)
        const lean = Math.max(0, 1 - s) * 34;
        b.style.transform = T(0, 0, 0, ny * lean, -nx * lean, 0, s);
        pixel(i, s);
      });
      if (raw >= TOTAL) { pix.forEach((P) => P.cv.remove()); boxes.forEach(clean); end(); return; }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  // ---------- All (Collections): a cloud of pictures in the air, then the camera flies into it ----------
  // like the reference: lots of flat pictures (the works plus extra copies) hang at many depths across the
  // whole screen, leaving an open corridor in the middle; the view drifts, then moves forward through them —
  // the copies stream past and out of sight, and each real work, when the camera reaches it, drops into its cell.
  const fly = () => {
    window.scrollTo(0, 0);
    addEventListener("pointerdown", skip, true);
    const eat = (e) => { if (!done || performance.now() - doneAt < 300) { e.preventDefault(); e.stopPropagation(); } };
    addEventListener("click", eat, true);
    const vw = innerWidth, vh = innerHeight, n = boxes.length;
    const rects = boxes.map((b) => b.getBoundingClientRect());
    const cx = vw / 2, cy = vh / 2, F = 900;                 // focal length (px)
    const smooth = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * x * (x * (x * 6 - 15) + 10); };
    const imgs = [...document.querySelectorAll(".cl-img img")];   // every work, other pages too
    // a point in the air: anywhere on a wide field, but never inside the open corridor in the middle
    const spot = (k1, k2, inner) => {
      const ang = rnd(k1, k2) * Math.PI * 2, u = rnd(k1, k2 + 1);
      const rr = inner + (1.7 - inner) * Math.sqrt(u), rx = vw * rr * 0.62, ry = vh * rr * 0.6;
      return [Math.cos(ang) * rx, Math.sin(ang) * ry];
    };
    const DRIFT = 900, VMAX = 1.7, RAMP = 2600, STEP = 140, BLEND = 1400, MEET = -560;   // ms · px/ms
    // the camera starts moving the moment the page opens — slowly — and keeps speeding up gently
    // (speed grows as (t/RAMP)², then holds at a calm VMAX): no standstill, no sudden rush
    const cam = (t) => t < RAMP ? (VMAX * t * t * t) / (3 * RAMP * RAMP) : VMAX * (RAMP / 3 + (t - RAMP));
    // the real works: flat, met by the camera one after another
    const order = [...Array(n).keys()];
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd(i, 91) * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const rank = []; order.forEach((idx, r) => (rank[idx] = r));
    const items = boxes.map((b, i) => {
      const r = rank[i], start = DRIFT + 250 + r * STEP;
      const [X, Y] = spot(i, 11, 0.42);
      const size = Math.min(vw, vh * 1.5) * (0.13 + 0.07 * rnd(i, 3));
      return { X, Y, Z: MEET - cam(start), base: size / Math.max(rects[i].width, rects[i].height), start, frozen: null };
    });
    // the extra copies: a dense cloud at many depths, streaming past the camera
    const cloud = document.createElement("div");
    cloud.style.cssText = "position:fixed;inset:0;z-index:50;pointer-events:none;overflow:hidden;";   // always behind the real works
    const COPIES = Math.min(110, Math.max(80, imgs.length + 30)), far = cam(DRIFT + 250 + n * STEP + BLEND) + 900;
    const copies = [];
    for (let k = 0; k < COPIES; k++) {
      const src = imgs[(k * 7) % imgs.length], im = document.createElement("img");
      im.src = src.currentSrc || src.src; im.alt = "";
      const ar = (src.naturalWidth || 4) / (src.naturalHeight || 3);
      const w = Math.min(vw, vh * 1.5) * (0.08 + 0.16 * Math.pow(rnd(k, 21), 1.4));
      const [X, Y] = spot(k + 40, 31, 0.32);
      const Z = -(200 + Math.pow(rnd(k, 41), 1.3) * far * 0.7);
      im.style.cssText = `position:absolute;left:0;top:0;width:${w}px;height:${w / ar}px;object-fit:cover;display:block;` +
        `transform-origin:50% 50%;will-change:transform,opacity;opacity:0;`;
      cloud.appendChild(im); copies.push({ im, X, Y, Z, w, h: w / ar, bob: rnd(k, 51) * 6.28 });
    }
    // fixed stacking by depth: every copy moves with the same camera, so near/far order never changes
    copies.slice().sort((p, q) => p.Z - q.Z).forEach((cp, k) => (cp.im.style.zIndex = String(1 + k)));
    document.body.appendChild(cloud);
    onSkip = () => cloud.remove();
    const proj = (X, Y, zr) => { const k = F / (F - zr); return [cx + X * k, cy + Y * k, k]; };
    const fog = (k) => Math.max(0, Math.min(1, (k - 0.16) / 0.2));
    const view = (it, i, t) => {
      // soft limit: past MEET the work keeps coming, more and more slowly, so nothing ever stops dead
      let zr = it.Z + cam(t);
      if (zr > MEET) zr = MEET + 240 * (1 - Math.exp(-(zr - MEET) / 240));
      const [x, y, k] = proj(it.X, it.Y + Math.sin(t / 700 + i) * 10, zr);
      return { x, y, s: it.base * k, o: fog(k) };
    };
    boxes.forEach((b) => {
      b.style.position = "relative"; b.style.transformOrigin = "50% 50%"; b.style.willChange = "transform, opacity";
      b.style.transition = "none"; b.style.visibility = "visible"; b.style.opacity = "0";
    });
    const t0 = performance.now();
    const frame = (now) => {
      if (done || skipping) return;
      const t = now - t0, ct = cam(t);
      // the cloud of copies: flat, getting bigger as the camera passes, gone once behind it
      copies.forEach((cp, k) => {
        const zr = cp.Z + ct;
        if (zr > -60) { cp.im.style.opacity = "0"; return; }
        const [x, y, kk] = proj(cp.X, cp.Y + Math.sin(t / 800 + cp.bob) * 8, zr);
        const near = Math.max(0, Math.min(1, (-zr - 60) / 260));      // fade just before it reaches the eye
        if (!cp.ready) cp.ready = cp.im.complete && cp.im.naturalWidth > 0 ? performance.now() : 0;
        const shown = cp.ready ? Math.min(1, (now - cp.ready) / 400) : 0;   // a picture that loads late fades in instead of popping
        cp.im.style.opacity = String(fog(kk) * near * shown);
        cp.im.style.transform = `translate(${x - cp.w / 2}px, ${y - cp.h / 2}px) scale(${kk})`;
      });
      // the real works
      let all = true;
      boxes.forEach((b, i) => {
        const it = items[i], r = rects[i];
        const hx = r.left + r.width / 2, hy = r.top + r.height / 2;
        const v = view(it, i, t);   // keeps moving with the camera while it lands: one continuous motion
        const w = smooth((t - it.start) / BLEND);
        if (w < 1) all = false;
        b.style.opacity = String(v.o + (1 - v.o) * w);
        b.style.zIndex = String(200 + n - rank[i]);   // fixed: nearer works in front, never swapping
        b.style.transform = T(v.x + (hx - v.x) * w - hx, v.y + (hy - v.y) * w - hy, 0, 0, 0, 0, v.s + (1 - v.s) * w);
      });
      // once every work has landed, the last copies fade away
      if (all) {
        cloud.style.transition = "opacity 350ms linear"; cloud.style.opacity = "0";
        setTimeout(() => cloud.remove(), 400);
        boxes.forEach(clean); end(); return;
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  // ---------- Network-based art: the works meet, and the network grows ----------
  // no lines: the connection is shown by the works themselves. They shrink in their own cells, leave them and meet two by two (each pair
  // touching with a small bump of contact), the pairs join into groups of four, the groups join into one
  // block, which breathes apart and closes once — then every work goes back to its own cell.
  const meet = () => {
    window.scrollTo(0, 0);
    addEventListener("pointerdown", skip, true);
    const eat = (e) => { if (!done || performance.now() - doneAt < 300) { e.preventDefault(); e.stopPropagation(); } };
    addEventListener("click", eat, true);
    const vw = innerWidth, vh = innerHeight, n = boxes.length;
    const rects = boxes.map((b) => b.getBoundingClientRect());
    const cx = vw / 2, cy = vh / 2;
    const smooth = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * x * (x * (x * 6 - 15) + 10); };
    const lerp = (a, b, u) => a + (b - a) * u;
    const bump = (u) => (u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0);
    // the full block: rows of four, every work at one height, edge to edge
    const COLS = 4, rows = Math.ceil(n / COLS);
    const ch = Math.min(vh * 0.6 / rows, vw * 0.105);
    const m = [];
    for (let r0 = 0; r0 < rows; r0++) {
      const idx = [...Array(n).keys()].slice(r0 * COLS, r0 * COLS + COLS);
      const ws = idx.map((i) => rects[i].width * (ch / rects[i].height));
      let x = cx - ws.reduce((a, b) => a + b, 0) / 2;
      const y = cy + (r0 - (rows - 1) / 2) * ch;
      idx.forEach((i, k) => { m[i] = { x: x + ws[k] / 2, y, s: ch / rects[i].height }; x += ws[k]; });
    }
    // pairs = two neighbours in a row; quads = two pairs above each other (a 2 × 2 block)
    const pairOf = (i) => { const r0 = Math.floor(i / COLS), c0 = i % COLS; return [r0 * COLS + (c0 - (c0 % 2)), r0 * COLS + (c0 - (c0 % 2)) + 1].filter((k) => k < n); };
    const quadOf = (i) => { const r0 = Math.floor(i / COLS), c0 = i % COLS, rr = r0 - (r0 % 2), cc = c0 - (c0 % 2); return [rr * COLS + cc, rr * COLS + cc + 1, (rr + 1) * COLS + cc, (rr + 1) * COLS + cc + 1].filter((k) => k < n); };
    const centre = (ids) => ({ x: ids.reduce((a, k) => a + m[k].x, 0) / ids.length, y: ids.reduce((a, k) => a + m[k].y, 0) / ids.length });
    const G = boxes.map((_, i) => ({ p: centre(pairOf(i)), q: centre(quadOf(i)) }));
    // they start where they belong: in their own cells, at full size
    const fromAt = rects.map((r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 }));
    const SHRINK = 550;                                   // first they draw in, smaller, in their cells
    // timeline (ms): pairs meet → pairs join (quads) → quads join (block) → breathe apart → close → home
    const A = SHRINK + 1300, B = A + 900, C = B + 900, D = C + 650, E = D + 650, HOME = 1300, STAG = 40;
    const END = E + 150 + HOME + STAG * (n - 1);
    const KP0 = 1.6, KQ0 = 1.75, BREATH = 1.13;
    boxes.forEach((b) => {
      b.style.position = "relative"; b.style.transformOrigin = "50% 50%"; b.style.willChange = "transform, opacity";
      b.style.transition = "none"; b.style.visibility = "visible"; b.style.opacity = "0";
    });
    const t0 = performance.now();
    const frame = (now) => {
      if (done || skipping) return;
      const t = now - t0;
      const kp = lerp(KP0, 1, smooth((t - A) / (B - A)));                // pairs → quads
      const kq = lerp(KQ0, 1, smooth((t - B) / (C - B)));                // quads → block
      const kg = 1 + (BREATH - 1) * (smooth((t - C) / (D - C)) - smooth((t - D) / (E - D)));   // breathe
      boxes.forEach((b, i) => {
        const r = rects[i], g = G[i], mi = m[i];
        const hx = r.left + r.width / 2, hy = r.top + r.height / 2;
        // place in the growing network: own offset in its pair + pair offset in its quad + quad offset from centre
        let x = cx + ((mi.x - g.p.x) + (g.p.x - g.q.x) * kp + (g.q.x - cx) * kq) * kg;
        let y = cy + ((mi.y - g.p.y) + (g.p.y - g.q.y) * kp + (g.q.y - cy) * kq) * kg;
        // first they shrink in their own cells, then leave them to meet a partner (growing as they meet)
        const pre = lerp(1, 0.5, smooth(t / SHRINK));
        const a = smooth((t - SHRINK - i * 25) / (A - SHRINK));
        x = lerp(fromAt[i].x, x, a); y = lerp(fromAt[i].y, y, a);
        // a small bump each time it touches: meeting its partner, its quad, the block, closing again
        const touch = 0.045 * (bump((t - A + 120) / 360) + bump((t - B + 120) / 360) + bump((t - C + 120) / 360) + bump((t - E + 120) / 360));
        // drifting apart they get a little smaller, coming together they grow back
        let s = lerp(pre, mi.s, a) * (1 + touch) * (1 - (kg - 1) * 1.4);
        const h = smooth((t - E - 150 - i * STAG) / HOME);                  // home
        x = lerp(x, hx, h); y = lerp(y, hy, h); s = lerp(s, 1, h);
        b.style.opacity = "1";
        b.style.zIndex = String(h > 0 ? 300 + i : 100 + i);
        b.style.transform = T(x - hx, y - hy, 0, 0, 0, 0, s);
      });
      if (t >= END) { boxes.forEach(clean); end(); return; }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  // ---------- Light & Kinetic: a rod of light turning in the air ----------
  // the works line up into one long diagonal rod across the middle of the screen; the rod turns slowly in
  // space like a kinetic light sculpture (near end bigger, far end smaller — the pictures always face us),
  // every work glowing clearly; then the rod comes to rest and each work glides back to its own cell.
  const wave = () => {
    window.scrollTo(0, 0);
    addEventListener("pointerdown", skip, true);
    const eat = (e) => { if (!done || performance.now() - doneAt < 300) { e.preventDefault(); e.stopPropagation(); } };
    addEventListener("click", eat, true);
    const vw = innerWidth, vh = innerHeight, n = boxes.length;
    const rects = boxes.map((b) => b.getBoundingClientRect());
    const cx = vw / 2, cy = vh / 2, F = 1100;
    const smooth = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * x * (x * (x * 6 - 15) + 10); };
    const lerp = (a, b, u) => a + (b - a) * u;
    const H = Math.min(vh * 0.2, vw * 0.11);                         // height of each work on the rod
    const LEN = Math.hypot(vw, vh) * 0.62;                           // rod length
    const TILT = (-38 * Math.PI) / 180;                               // the rod leans like a diagonal
    const SPIN = 4800, HOME = 1500, STAG = 50;                        // ms
    const TURNS = 1.25;                                               // how far the rod turns, slowly
    const END = SPIN + HOME + STAG * (n - 1);
    // light only while the rod turns: on the way home it fades out completely
    const REST = [1, 0, 0, 0, 0];
    boxes.forEach((b) => {
      b.style.position = "relative"; b.style.transformOrigin = "50% 50%"; b.style.willChange = "transform, filter, opacity";
      b.style.transition = "none"; b.style.visibility = "visible"; b.style.opacity = "0";
    });
    // where work i is on the turning rod at angle phi
    const onRod = (i, phi) => {
      const u = (i / (n - 1) - 0.5) * LEN;                          // position along the rod
      const ax = Math.cos(TILT) * u, ay = Math.sin(TILT) * u;       // the diagonal
      const x3 = ax * Math.cos(phi), z3 = ax * Math.sin(phi);        // turning around the vertical axis
      const k = F / (F - z3);
      return { x: cx + x3 * k, y: cy + ay * k, k, z: z3 };
    };
    const t0 = performance.now();
    const frame = (now) => {
      if (done || skipping) return;
      const t = now - t0;
      // the rod is there from the first frame; it starts turning gently, turns slowly, and comes to rest
      const phi = smooth(t / SPIN) * TURNS * Math.PI * 2;
      // one fixed front-to-back order for the whole motion (the order along the rod): pictures may overlap,
      // but they never pass through or swap places with each other
      const pulseAt = (t / 1500) % 1;                                 // a light running along the rod
      boxes.forEach((b, i) => {
        const r = rects[i];
        const hx = r.left + r.width / 2, hy = r.top + r.height / 2;
        const q = onRod(i, phi);
        const h = smooth((t - SPIN - i * STAG) / HOME);              // back home, softly
        const s0 = (H / r.height) * q.k;
        const x = lerp(q.x, hx, h), y = lerp(q.y, hy, h), s = lerp(s0, 1, h);
        // light while turning: every work lit, the side coming towards us brighter, and a pulse travelling along the rod
        const near = Math.max(0, q.z) / (LEN * 0.45);
        const d = i / (n - 1) - pulseAt, pulse = Math.exp(-(d * d) / 0.006) * (1 - smooth((t - SPIN + 600) / 600));
        const lit = Math.min(1, 0.65 + 0.35 * near + 0.6 * pulse);
        const live = [1 + 0.16 * lit, 6 + 10 * lit, 0.6 + 0.4 * lit, 26 + 30 * lit, 0.55 + 0.4 * lit];
        const f = live.map((v, j) => lerp(v, REST[j], h));
        b.style.filter = `brightness(${f[0]}) drop-shadow(0 0 ${f[1]}px rgba(245, 248, 255, ${f[2]})) drop-shadow(0 0 ${f[3]}px rgba(140, 180, 255, ${f[4]}))`;
        b.style.opacity = String(Math.min(1, t / 450));
        b.style.zIndex = String(100 + i);
        b.style.transform = T(x - hx, y - hy, 0, 0, 0, 0, s);
      });
      if (t >= END) { boxes.forEach(clean); end(); return; }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  const go = { flow, layers, radial, fly, meet, wave }[document.body.dataset.motion] || start;

  // wait for the pictures (or at most 2.5 s) so the pile is not empty
  const loaded = Promise.all(boxes.map((b) => {
    const img = b.querySelector("img");
    return img.complete ? Promise.resolve() : new Promise((res) => { img.addEventListener("load", res, { once: true }); img.addEventListener("error", res, { once: true }); });
  }));
  Promise.race([loaded, new Promise((r) => setTimeout(r, 2500))]).then(() => requestAnimationFrame(go));

  // coming back with the browser's back button: show the finished page
  addEventListener("pageshow", (e) => { if (e.persisted) finish(); });
})();
