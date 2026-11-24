(() => {
  /* ======================================================
     1. HERO CAROUSEL
     - 6 slides (photo 3 + gray placeholder 3)
     - auto-advance, click a dot to jump (active dot becomes long)
     ====================================================== */
  if (document.getElementById("track")) (() => {
  const SLIDES = [
    { src: "photo/home3.png", caption: "안동권, &lt;그대는 무엇이든 될 수 있다&gt;, 2026, 단채널 비디오, 사운드, 흑백, 6분 44초" },
    { src: "photo/home1.png", caption: "김예성, &lt;오디세이 큐브&gt;, 단채널 비디오, 컬러, 사운드, 10분" },
    { src: "photo/home2.png", caption: "이효성, &lt;아사달 연대기&gt;, 2024, 단채널 비디오, 무음, 흑백, 8분 32초" },
    { src: "photo/home4.jpg", caption: "전아현, &lt;Sisyphus' Light Ascent&gt;, 2025, 단채널 비디오, 컬러, 무음, 루프", pos: "center 53%" }, // portrait photo: keep the TV in frame
    { src: "photo/home5.png", caption: "최민재, &lt;기억의 합성&gt;, 2026, AI 생성 영상, 사운드, 컬러, 실시간 생성", pos: "center 30%" }, // square image: keep the face in frame
    { src: "photo/home6.png", caption: "정유나, &lt;연결된 침묵&gt;, 2025, 네트워크 기반, 웹 브라우저, 실시간 데이터, 가변 설치", pos: "center 62%" } // keep the three figures in frame
  ];
  const AUTO_MS = 4000;  // time per slide
  const CLONES = 2;      // clones on each side for seamless looping

  const track = document.getElementById("track");
  const dotsWrap = document.getElementById("dots");
  const n = SLIDES.length;

  const slideHTML = (s) =>
    `<div class="slide">${s.src ? `<img src="${s.src}" alt=""${s.pos ? ` style="object-position:${s.pos}"` : ""}>` : ""}${
      s.caption ? `<p class="slide__caption">${s.caption}</p>` : ""}</div>`;

  const order = [];
  for (let i = n - CLONES; i < n; i++) order.push(SLIDES[i]);
  SLIDES.forEach((s) => order.push(s));
  for (let i = 0; i < CLONES; i++) order.push(SLIDES[i]);
  track.innerHTML = order.map(slideHTML).join("");

  SLIDES.forEach((_, i) => {
    const b = document.createElement("button");
    b.className = "dot";
    b.setAttribute("aria-label", `${i + 1}번 슬라이드`);
    b.addEventListener("click", () => { goTo(i + CLONES); restartAuto(); });
    dotsWrap.appendChild(b);
  });
  const dots = [...dotsWrap.children];

  let pos = CLONES; // index inside the track (CLONES = first real slide)
  const setPos = (p, animate = true) => {
    track.classList.toggle("no-anim", !animate);
    pos = p;
    track.style.setProperty("--pos", p);
    const real = ((p - CLONES) % n + n) % n;
    dots.forEach((d, i) => d.classList.toggle("is-active", i === real));
  };
  const goTo = (p) => setPos(p, true);

  track.addEventListener("transitionend", (e) => {
    if (e.target !== track) return;
    if (pos >= n + CLONES) setPos(pos - n, false);
    else if (pos < CLONES) setPos(pos + n, false);
    track.offsetHeight; // flush
  });

  let timer = null;
  const restartAuto = () => {
    clearInterval(timer);
    timer = setInterval(() => goTo(pos + 1), AUTO_MS);
  };
  setPos(CLONES, false);
  restartAuto();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearInterval(timer); else restartAuto();
  });
  })();

  /* ======================================================
     2. DATACENTER GALLERIES
     - hover a thumbnail: the others fade (CSS)
     - click a thumbnail: it swaps places with the big image (no motion)
       and its caption becomes the big title (SemiBold, bottom-aligned)
     ====================================================== */
  const GALLERIES = {
    dc1: [
      { img: "photo/dc1-main.jpg", pos: "center bottom", title: "내진성능평가 1등급<br>정밀안전진단 통과", caption: "내진성능평가 1등급 정밀안전진단 통과" },
      { img: "photo/dc1-1.jpg", caption: "도심에 위치한 데이터센터 전경" },
      { img: "photo/dc1-2.jpg", title: "지진과 같은 재해에서 센터를<br>보호하는 내진설계 구조", caption: "지진과 같은 재해에서 센터를 보호하는 내진설계 구조" },
      { img: "photo/dc1-3.jpg", caption: "데이터센터의 모든 상황을 한 눈에 파악하고 대응할 수 있는 관제센터" },
      { img: "photo/dc1-4.jpg", title: "정갈하게 정돈되어 서버실 랙에<br>연결되어 있는 케이블", caption: "정갈하게 정돈되어 서버실 랙에 연결되어 있는 케이블" }
    ],
    dc2: [
      { img: "photo/dc2-main.jpg", title: "재생에너지 10GW<br>냉각효율 PUE 1.2", caption: "재생에너지 10GW 냉각효율 PUE 1.2", note: "PUE가 낮을수록 전력 효율이 높고, 친환경적입니다." },
      { img: "photo/dc2-1.jpg", caption: "냉각수를 위해 바다 앞에 위치한 데이터센터" },
      { img: "photo/dc2-2.jpg", caption: "냉각 효율 PUE 1.2" },
      { img: "photo/dc2-3.jpg", caption: "AI로 사고 리스크를 선제 대응하는 종합 안전관리 솔루션" },
      { img: "photo/dc2-4.jpg", caption: "데이터센터 온실가스 배출 절감을 위한 태양광 설비" }
    ]
  };

  document.querySelectorAll(".gallery").forEach((section) => {
    const items = GALLERIES[section.dataset.gallery].slice(); // [0] = big, [1..4] = thumbs
    const mainImg = section.querySelector(".gallery__main img");
    const title = section.querySelector(".gallery__title");
    const note = section.querySelector(".gallery__note");
    const thumbsWrap = section.querySelector(".thumbs");

    // preload every image so swaps are instant
    items.forEach((it) => { const im = new Image(); im.src = it.img; });

    const render = () => {
      const big = items[0];
      mainImg.src = big.img;
      mainImg.style.objectPosition = big.pos || "";   // per-photo crop (only set where needed)
      mainImg.alt = big.caption;
      title.innerHTML = big.title || big.caption;
      if (big.note) { note.textContent = big.note; note.hidden = false; }
      else { note.hidden = true; }
      thumbsWrap.innerHTML = items.slice(1).map((it, i) =>
        `<button class="thumb" data-i="${i + 1}">
           <img class="thumb__img" src="${it.img}" alt="">
           <span class="thumb__cap">${it.caption}</span>
         </button>`).join("");
    };

    thumbsWrap.addEventListener("click", (e) => {
      const btn = e.target.closest(".thumb");
      if (!btn) return;
      const i = Number(btn.dataset.i);
      [items[0], items[i]] = [items[i], items[0]];
      render();
    });
    render();
  });

  /* ======================================================
     3. PART NAVIGATION ARROW (fixed, bottom-right)
     - click: jump to the next part
     - at the bottom of the page it points up and returns to the top
     ====================================================== */
  const arrow = document.getElementById("partArrow");
  if (arrow) {
  const parts = [...document.querySelectorAll(".part")];
  const atBottom = () =>
    window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;

  const updateArrow = () => {
    const up = atBottom();
    arrow.classList.toggle("is-up", up);
    arrow.setAttribute("aria-label", up ? "맨 위로 이동" : "다음 파트로 이동");
  };

  arrow.addEventListener("click", () => {
    if (atBottom()) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    const y = window.scrollY;
    const next = parts.find((p) => p.getBoundingClientRect().top + y > y + 4);
    if (next) window.scrollTo({ top: next.getBoundingClientRect().top + y, behavior: "smooth" });
  });
  window.addEventListener("scroll", updateArrow, { passive: true });
  window.addEventListener("resize", updateArrow);
  updateArrow();
  }
})();

/* placeholder links (e.g. 작가 → next page, not connected yet) do nothing for now */
document.querySelectorAll('a[href="#"]').forEach((a) =>
  a.addEventListener("click", (e) => e.preventDefault()));

/* ======================================================
   4. VIDEOS — make sure the looping videos start by themselves
   (some browsers skip the autoplay attribute, e.g. Safari power saving;
    so play() is called when ready, when the part scrolls into view,
    and once more on the first click / key / scroll)
   ====================================================== */
(() => {
  const videos = [...document.querySelectorAll("video:not([data-playlist])")];
  if (!videos.length) return;
  const play = (v) => {
    v.muted = true; v.defaultMuted = true; v.playsInline = true; v.loop = true;
    if (v.paused) v.play().catch(() => {});
  };
  videos.forEach((v) => {
    v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
    play(v);
    v.addEventListener("loadeddata", () => play(v));
    v.addEventListener("canplay", () => play(v));
    v.addEventListener("pause", () => { if (!document.hidden) setTimeout(() => play(v), 200); });
    // if the light web copy is missing, fall back to the original file
    v.addEventListener("error", () => {
      if (v.src.includes("/web/")) { v.src = v.src.replace("/web/", "/"); v.load(); play(v); }
    }, { once: true });
  });
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) =>
      entries.forEach((e) => e.isIntersecting && play(e.target)), { threshold: 0.1 });
    videos.forEach((v) => io.observe(v));
  }
  const kick = () => videos.forEach(play);
  ["click", "keydown", "scroll", "touchstart"].forEach((ev) =>
    window.addEventListener(ev, kick, { once: true, passive: true }));
  document.addEventListener("visibilitychange", () => { if (!document.hidden) kick(); });
})();

/* ======================================================
   5. INTRO VIDEO PLAYLIST — six field videos one after another, looping
   Two <video> elements take turns: while one plays, the next is loaded
   underneath, so the switch has no blank frame.
   ====================================================== */
(() => {
  const box = document.getElementById("introVid");
  if (!box) return;
  const INTRO_VIDEOS = [
    "material-media_moving_20261118-152839",
    "material-media_software_20261118-152910",
    "material-media_network_20261118-152929",
    "material-media_light_20261118-153001",
    "material-media_performance_20261119-142404",
    "material-media_digital_20261119-102253"
  ];
  const src = (i) => `vedio/web/${INTRO_VIDEOS[i % INTRO_VIDEOS.length]}.mp4?v=2`;
  const FADE = 1.4;   // seconds of cross-fade (blur → sharp), same as the CSS transition
  let [cur, nxt] = box.querySelectorAll("video");
  let i = 0, fading = false;
  const prep = (v) => { v.muted = true; v.defaultMuted = true; v.playsInline = true; };
  const play = (v) => { prep(v); if (v.paused) v.play().catch(() => {}); };
  // the next video starts FADE seconds before the current one ends; both overlap while
  // the old one blurs out and the new one comes into focus
  const crossfade = () => {
    if (fading) return;
    fading = true;
    i = (i + 1) % INTRO_VIDEOS.length;
    const out = cur, inn = nxt;
    try { inn.currentTime = 0; } catch (e) {}
    play(inn);
    inn.classList.add("is-on");
    out.classList.remove("is-on");
    [cur, nxt] = [inn, out];
    setTimeout(() => {
      out.pause();
      out.src = src(i + 1); out.load();        // queue the one after
      fading = false;
    }, FADE * 1000 + 100);
  };
  [cur, nxt].forEach((v) => {
    prep(v);
    // light web copy missing → use the original file
    v.addEventListener("error", () => { if (v.src.includes("/web/")) { v.src = v.src.replace("/web/", "/"); v.load(); } });
    v.addEventListener("timeupdate", () => {
      if (v === cur && v.duration && v.duration - v.currentTime <= FADE) crossfade();
    });
    v.addEventListener("ended", () => { if (v === cur) crossfade(); });
  });
  cur.src = src(0); nxt.src = src(1); nxt.load();
  cur.classList.add("is-on");
  play(cur);
  cur.addEventListener("canplay", () => play(cur), { once: true });
  // keep it running (autoplay can be blocked until the first interaction)
  ["click", "keydown", "scroll", "touchstart"].forEach((ev) =>
    window.addEventListener(ev, () => play(cur), { once: true, passive: true }));
  document.addEventListener("visibilitychange", () => { if (!document.hidden) play(cur); });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && play(cur)), { threshold: 0.1 }).observe(box);
  }
})();
