// MATERIAL MEDIA STORAGE — work detail
(() => {
  // pages that do not exist yet
  document.querySelectorAll("[data-soon]").forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // Back: to the list we came from
  const back = document.querySelector("[data-back]");
  back?.addEventListener("click", (e) => {
    if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) { e.preventDefault(); history.back(); }
  });

  // Share: a box with this page's link; Copy puts it on the clipboard.
  // ※ GitHub 에 올리면 location.href 가 자동으로 실제 주소가 됨. 다른 도메인을 쓰려면 SHARE_BASE 에 적기
  //    (예: "https://materialmedia.storage.kr/") — 그러면 그 주소 + 이 파일 이름이 링크가 됨
  const SHARE_BASE = "";
  const sh = document.getElementById("sh");
  const shareBtn = document.querySelector("[data-share]");
  if (sh && shareBtn) {
    const url = sh.querySelector(".sh__url");
    const copyBtn = sh.querySelector(".sh__copy");
    const link = () => SHARE_BASE ? new URL(location.pathname.split("/").pop() || "", SHARE_BASE).href : location.href.split("#")[0];
    const openSh = () => {
      url.value = link(); copyBtn.textContent = "Copy";
      sh.hidden = false; document.body.classList.add("sh-lock");
      requestAnimationFrame(() => sh.classList.add("is-open"));
    };
    const closeSh = () => {
      sh.classList.remove("is-open"); document.body.classList.remove("sh-lock");
      setTimeout(() => { sh.hidden = true; }, 250);
    };
    const copy = async () => {
      let ok = false;
      try { await navigator.clipboard.writeText(url.value); ok = true; } catch (e) {}
      if (!ok) {   // file:// etc.: old way
        url.focus(); url.select();
        try { ok = document.execCommand("copy"); } catch (e) {}
        url.setSelectionRange(0, 0); url.blur();
      }
      copyBtn.textContent = ok ? "Copied" : "Copy";
      if (ok) setTimeout(() => (copyBtn.textContent = "Copy"), 1600);
    };
    shareBtn.addEventListener("click", openSh);
    copyBtn.addEventListener("click", copy);
    sh.querySelector(".sh__x").addEventListener("click", closeSh);
    sh.addEventListener("click", (e) => { if (!e.target.closest(".sh__box")) closeSh(); });
    url.addEventListener("focus", () => url.select());
    addEventListener("keydown", (e) => { if (!sh.hidden && e.key === "Escape") closeSh(); });
  }

  // paid → the picture at the top becomes the film's player (not saved: a reload shows the picture again)
  function unlockFilm(save) {
    const hero = document.querySelector(".wk-hero[data-film]");
    // the Paid button turns into a filled "Purchased" mark (also not saved: a reload shows Paid again)
    document.querySelectorAll("button[data-paid]").forEach((b) => {
      b.textContent = "Purchased"; b.classList.add("is-active", "is-bought"); b.disabled = true;
    });
    if (!hero || hero.classList.contains("is-film")) return;
    const poster = hero.querySelector("img")?.getAttribute("src") || "";
    const v = document.createElement("video");
    v.controls = true; v.playsInline = true; v.preload = "metadata"; v.poster = poster;
    v.src = hero.dataset.film;
    v.addEventListener("error", () => { if (hero.dataset.filmOrig && !v.src.includes(encodeURI(hero.dataset.filmOrig))) { v.src = hero.dataset.filmOrig; v.load(); } }, { once: true });
    hero.innerHTML = ""; hero.appendChild(v); hero.classList.add("is-film");
  }

  // boxes over the page: open / close (X, outside, Esc)
  const boxes = [...document.querySelectorAll(".sh--terms, .sh--pay, .sh--done")];   // .sh--proc is a .sh--done too
  const openBox = (el) => {
    el.hidden = false; document.body.classList.add("sh-lock");
    el.querySelectorAll(".tm__body").forEach((b) => (b.scrollTop = 0));
    requestAnimationFrame(() => el.classList.add("is-open"));
  };
  const closeBox = (el, keepLock) => {
    el.classList.remove("is-open"); if (!keepLock) document.body.classList.remove("sh-lock");
    setTimeout(() => { el.hidden = true; }, 250);
  };
  // one box straight to the next: the dark layer never goes away, so nothing flashes
  const swapBox = (from, to) => {
    to.style.transition = "none";
    to.hidden = false; to.classList.add("is-open");
    to.offsetHeight;                       // apply at once
    to.style.transition = "";
    from.style.transition = "none";
    from.classList.remove("is-open"); from.hidden = true;
    from.offsetHeight; from.style.transition = "";
  };
  boxes.forEach((el) => {
    el.querySelector(".sh__x").addEventListener("click", () => closeBox(el));
    el.addEventListener("click", (e) => { if (!e.target.closest(".sh__box")) closeBox(el); });
  });
  addEventListener("keydown", (e) => { if (e.key === "Escape") boxes.forEach((el) => { if (!el.hidden) closeBox(el); }); });

  // Paid → Copyright Consent → Agree → payment → any way to pay → done (→ My Library later)
  const terms = document.getElementById("terms"), pay = document.getElementById("pay"), done = document.getElementById("done");
  document.querySelectorAll("[data-paid], [data-extend]").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); openBox(terms); }));
  terms?.querySelector(".tm__agree").addEventListener("click", () => swapBox(terms, pay));
  // any way to pay → "paying" box: two lines pass with the AI-draft shimmer, then the done box comes up
  const proc = document.getElementById("proc");
  const STEP = 3000, LINES = ["결제 정보를 확인하는 중이에요", "결제를 승인받는 중이에요", "마이 스튜디오에 작품을 담는 중이에요"];
  let procT = [];
  const stopProc = () => { procT.forEach(clearTimeout); procT = []; };
  if (proc) {
    proc.querySelector(".sh__x").addEventListener("click", stopProc);
    proc.addEventListener("click", (e) => { if (!e.target.closest(".sh__box")) stopProc(); });
    addEventListener("keydown", (e) => { if (e.key === "Escape") stopProc(); });
  }
  pay?.querySelectorAll("[data-pay]").forEach((b) => b.addEventListener("click", () => {
    if (!proc) { swapBox(pay, done); return; }
    const s = proc.querySelector(".dn__think");
    stopProc();
    s.classList.remove("is-out", "is-in"); s.textContent = LINES[0];
    swapBox(pay, proc);
    LINES.slice(1).forEach((t, i) => procT.push(setTimeout(() => {
      s.classList.add("is-out");
      procT.push(setTimeout(() => {
        s.textContent = t; s.classList.remove("is-out"); s.classList.add("is-in");
        requestAnimationFrame(() => requestAnimationFrame(() => s.classList.remove("is-in")));
      }, 350));
    }, STEP * (i + 1))));
    procT.push(setTimeout(() => { if (!proc.hidden) { swapBox(proc, done); unlockFilm(true); } }, STEP * LINES.length));
  }));

  // (old single-box code below is kept off)

  // Image: a still opens large; arrows (or ← →) move through them, X / outside the picture / Esc closes
  const lb = document.getElementById("lb");
  const fulls = [...document.querySelectorAll("[data-full]")];
  if (lb && fulls.length) {
    const img = lb.querySelector(".lb__img");
    let cur = 0;
    fulls.forEach((b) => { new Image().src = b.dataset.full; });   // ready before the arrows are pressed
    const show = (i, swap) => {
      cur = (i + fulls.length) % fulls.length;
      const src = fulls[cur].dataset.full;
      img.src = src;
    };
    const open = (i) => {
      show(i, false);
      lb.hidden = false; document.body.classList.add("lb-lock");
      requestAnimationFrame(() => lb.classList.add("is-open"));
    };
    const close = () => {
      lb.classList.remove("is-open"); document.body.classList.remove("lb-lock");
      setTimeout(() => { lb.hidden = true; }, 300);
    };
    fulls.forEach((b, i) => b.addEventListener("click", () => open(i)));
    lb.querySelector(".lb__nav--prev").addEventListener("click", () => show(cur - 1, true));
    lb.querySelector(".lb__nav--next").addEventListener("click", () => show(cur + 1, true));
    lb.querySelector(".lb__x").addEventListener("click", close);
    lb.addEventListener("click", (e) => { if (!e.target.closest(".lb__img, .lb__nav, .lb__x")) close(); });
    addEventListener("keydown", (e) => {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(cur - 1, true);
      else if (e.key === "ArrowRight") show(cur + 1, true);
    });
  }

  // Image: the arrow moves to the next still; at the end it turns round and goes back to the first
  const track = document.querySelector(".wk-track");
  const arrow = document.querySelector(".wk-arrow");
  if (!track || !arrow) return;
  const shots = [...track.children];
  const atEnd = () => track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  const update = () => {
    const end = atEnd();
    arrow.classList.toggle("is-back", end);
    arrow.setAttribute("aria-label", end ? "처음 이미지로" : "다음 이미지");
  };
  arrow.addEventListener("click", () => {
    if (atEnd()) { track.scrollTo({ left: 0 }); return; }
    const x = track.scrollLeft + 2;
    const next = shots.find((s) => s.offsetLeft - track.offsetLeft > x) || shots[shots.length - 1];
    track.scrollTo({ left: next.offsetLeft - shots[0].offsetLeft });
  });
  track.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
  addEventListener("resize", update);
  update();
})();
