(() => {
  // the text as written by this page, whatever language is shown (i18n.js)
  const T = (el) => (el ? (window.mmOrig ? window.mmOrig(el) : el.textContent) : "");
  /* ======================================================
     Where the buttons go. Fill in a file name when that page exists;
     an empty value means the button does nothing for now.
     ====================================================== */
  const PAGES = {
    "site-home": "index.html",               // MATERIAL MEDIA → 처음 만든 홈페이지
    "archive-home": "myarchive-login.html",  // 로고 메뉴 · MATERIAL ARCHIVE
    "storage-home": "storage.html",          // 로고 메뉴 · MATERIAL STORAGE
    "myarchive-home": "myarchive-list.html", // My Archive · 로그인 후 이동
    "upload": "myarchive-upload.html",      // 시작하기 · 수정하기 → Upload 페이지
    "details": "myarchive-details.html",     // Upload의 Next → Details 페이지
    "provenance": "myarchive-provenance.html", // Details의 Next → Provenance 페이지
    "submit": "",                            // 최종제출 모달의 Next → 다음 단계(Submit) 페이지
    "reason": "myarchive-reason.html",       // 사유보기 → 심사 결과(반려 사유) 페이지
    "shortcut": ""                           // 바로가기
  };
  // Next always goes on (Upload · Details), without checking empty fields — for the demo video.
  // 다시 필수 항목 검사를 하려면 false 로
  const FREE_NEXT = true;
  const go = (key) => {
    if (key === "resume") { resumeTo(); return; }
    if (PAGES[key]) location.href = PAGES[key];
  };

  document.querySelectorAll("[data-goto]").forEach((a) => {
    const target = PAGES[a.dataset.goto];
    if (target && a.tagName === "A") a.setAttribute("href", target);
    a.addEventListener("click", (e) => {
      e.preventDefault();
      // while writing (Upload · Details · Provenance) going home asks first
      const leaving = ["myarchive-home", "site-home", "archive-home", "storage-home"].includes(a.dataset.goto);
      // on every archive page, going somewhere else asks first (until the work has been submitted)
      if (leaving && !document.body.dataset.submitted) { openLeave(a.dataset.goto); return; }
      go(a.dataset.goto);
    });
  });


  /* ======================================================
     CONFIRM MODALS — Leave ("작성을 멈추고 나가시겠습니까?")
     and Final Submission ("최종제출 하시겠습니까?")
     The page behind (below the progress bar) is blurred.
     X / Continue close it, Leave goes to My Archive home.
     ====================================================== */
  // one builder for the confirm modals (Leave · Final Submission)
  const modals = {};
  const closeModal = (m) => { if (m) { m.classList.remove("is-open"); m.setAttribute("aria-hidden", "true"); } };
  const makeModal = (key, tag, title, sub, buttons) => {
    const m = document.createElement("div");
    m.className = "leave";
    m.setAttribute("aria-hidden", "true");
    m.innerHTML = `
      <div class="leave__dim"></div>
      <div class="leave__box" role="dialog" aria-modal="true" aria-labelledby="mt-${key}">
        <div class="leave__top"><span class="leave__tag">${tag}</span><button class="leave__x" type="button" aria-label="닫기">X</button></div>
        <div class="leave__body">
          <p class="leave__t" id="mt-${key}">${title}</p>
          <p class="leave__s">${sub}</p>
        </div>
        <div class="leave__foot"></div>
      </div>`;
    const foot = m.querySelector(".leave__foot");
    buttons.forEach((bt) => {
      const el = document.createElement("button");
      el.type = "button"; el.className = "leave__btn" + (bt.primary ? " leave__btn--go" : ""); el.textContent = bt.label;
      el.addEventListener("click", () => (bt.action ? bt.action() : closeModal(m)));
      foot.appendChild(el);
    });
    m.querySelector(".leave__x").addEventListener("click", () => closeModal(m));
    m.querySelector(".leave__dim").addEventListener("click", () => closeModal(m));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(m); });
    document.body.appendChild(m);
    return (modals[key] = m);
  };
  // blur starts right under the progress bar, like the Figma frame — kept in step when the window is resized
  const placeBlur = (m) => {
    const ml = document.querySelector(".ml");
    m.style.setProperty("--leave-top", `${ml ? ml.getBoundingClientRect().top : 0}px`);
  };
  window.addEventListener("resize", () => Object.values(modals).forEach((m) => { if (m.classList.contains("is-open")) placeBlur(m); }));
  const showModal = (m) => {
    placeBlur(m);
    m.classList.add("is-open");
    m.setAttribute("aria-hidden", "false");
  };
  let leaveTo = "myarchive-home";   // where Leave goes: My Archive home or the site home
  function openLeave(dest) {
    leaveTo = dest || "myarchive-home";
    showModal(modals.leave || makeModal("leave", "Leave", "작성을 멈추고 나가시겠습니까?", "임시저장하면 작성하던 내용을 이어서 쓸 수 있습니다.", [
      { label: "Continue" },
      { label: "Leave", primary: true, action: () => {
        // a plain link (logout, any other page): follow it; a button key: go there
        if (leaveTo && typeof leaveTo === "object") { if (leaveTo.logout) store.clear(); location.href = leaveTo.url; }
        else go(leaveTo);
      } }
    ]));
  }
  // on every archive page (login · list · upload · details · provenance · reason), every way out asks first — logo, its site menu,
  // My Archive, logout and any other link to another page (until the work has been submitted)
  if (document.body.classList.contains("page-myarchive")) {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href]");
      if (!a || a.dataset.goto || a.closest(".leave") || document.body.dataset.submitted) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript")) return;
      e.preventDefault(); e.stopImmediatePropagation();
      openLeave({ url: a.href, logout: a.id === "logoutBtn" });
    }, true);
  }
  function openSubmit() {
    showModal(modals.submit || makeModal("submit", "Final Submission", "최종제출 하시겠습니까?", "심사 전까지 수정할 수 있습니다.", [
      { label: "Next", primary: true, action: openSubmitting }
    ]));
  }
  // Next → "제출 중입니다" box: three lines pass with the same shimmer as the AI draft box, then 제출 완료
  function openSubmitting() {
    const STEP = 3000;
    const steps = ["파일을 내보내는 중이에요", "추가 자료를 정리 중이에요", "오탈자를 확인 중이에요"];
    closeModal(modals.submit);
    const m = modals.submitting || makeModal("submitting", "Final Submission", "최종제출 중입니다", steps[0], []);
    m.classList.add("leave--loading");
    const timers = () => { (m._ts || []).forEach(clearTimeout); m._ts = []; };
    if (!m.dataset.wired) {
      m.dataset.wired = "1";
      const stop = () => { timers(); m.dataset.run = ""; };
      m.querySelector(".leave__x").addEventListener("click", stop);
      m.querySelector(".leave__dim").addEventListener("click", stop);
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") stop(); });
    }
    const s = m.querySelector(".leave__s");
    const run = String(Date.now()); m.dataset.run = run;
    const alive = () => m.classList.contains("is-open") && m.dataset.run === run;
    const swap = (txt) => {
      if (!alive()) return;
      s.classList.add("is-out");
      setTimeout(() => {
        s.textContent = txt; s.classList.remove("is-out"); s.classList.add("is-in");
        requestAnimationFrame(() => requestAnimationFrame(() => s.classList.remove("is-in")));
      }, 350);
    };
    s.classList.remove("is-out", "is-in"); s.textContent = steps[0];
    showModal(m);
    timers();
    steps.slice(1).forEach((t, i) => m._ts.push(setTimeout(() => swap(t), STEP * (i + 1))));
    m._ts.push(setTimeout(() => { if (alive()) { m.dataset.run = ""; submitDone(); } }, STEP * steps.length));
  }
  // Figma 1182:8260 — submitted: Submit step turns blue, then back to My Archive
  function submitDone() {
    closeModal(modals.submit);
    if (modals.submitting) closeModal(modals.submitting);
    document.body.dataset.submitted = "1";   // already submitted: going home needs no warning
    const chips = document.querySelectorAll(".steps .step-chip"), lines = document.querySelectorAll(".steps .step-line");
    chips.forEach((c) => { c.classList.add("is-current"); c.removeAttribute("aria-current"); });
    lines.forEach((l) => l.classList.add("is-done"));
    if (chips.length) chips[chips.length - 1].setAttribute("aria-current", "step");
    try {
      const f = sessionStorage.getItem("mm_flow"); if (f) sessionStorage.setItem("mm_submitted", f);
      sessionStorage.removeItem("mm_revise"); sessionStorage.removeItem("mm_jump");
    } catch (e) {}
    showModal(modals.done || makeModal("done", "Final Submission", "제출이 완료됐습니다.", "마이 아카이브로 이동합니다.", [
      { label: "My Archive", primary: true, action: () => go("myarchive-home") }
    ]));
  }

  const store = {
    get: (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} },
    clear: () => { try { sessionStorage.removeItem("mm_name"); sessionStorage.removeItem("mm_org"); } catch (e) {} }
  };

  /* ======================================================
     SAVE → 수정하기 로 이어서 작성
     Save on any page remembers that page and its scroll position;
     수정하기 opens the saved page and scrolls back to that spot.
     Works on every page that has #saveBtn (Upload, Details, …).
     ====================================================== */
  const thisPage = () => location.pathname.split("/").pop() || "index.html";
  const scroller = () => document.querySelector(".ml-main") || document.scrollingElement;
  const resume = {
    get: () => { try { return JSON.parse(localStorage.getItem("mm_resume")); } catch (e) { return null; } },
    save: () => { try { localStorage.setItem("mm_resume", JSON.stringify({ page: thisPage(), scroll: scroller().scrollTop, ratio: scroller().scrollTop / scroller().scrollHeight })); } catch (e) {} }
  };
  const resumeTo = () => {
    const r = resume.get();
    const page = (r && r.page) || PAGES.upload;
    try { sessionStorage.setItem("mm_restore", page); } catch (e) {}
    location.href = page;
  };
  // arrived here through 수정하기 → jump to the saved spot
  try {
    const r = resume.get();
    if (sessionStorage.getItem("mm_restore") === thisPage()) {
      sessionStorage.removeItem("mm_restore");
      if (r && r.page === thisPage()) {
        // ratio keeps the same spot even if the window size changed (the page scales with the window)
        const jump = () => { const el = scroller(); el.scrollTop = r.ratio != null ? r.ratio * el.scrollHeight : r.scroll; };
        jump(); requestAnimationFrame(jump); window.addEventListener("load", jump);
      }
    }
  } catch (e) {}

  const saveBtn = document.getElementById("saveBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      resume.save();
      const t = document.getElementById("toast");
      if (!t) return;
      t.textContent = "저장되었습니다."; t.classList.add("is-on");
      clearTimeout(saveBtn._t); saveBtn._t = setTimeout(() => t.classList.remove("is-on"), 1800);
    });
  }


  /* ======================================================
     METADATA — read from the master file on the Upload page,
     shown on the Details page. Runs fully in the browser.
     ====================================================== */
  const readMeta = async (file) => {
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const isAudio = ext === "wav" || /^audio\//.test(file.type);
    const m = { file: file.name, ext, kind: isAudio ? "audio" : "video", sizeMB: file.size / 1048576,
                year: new Date(file.lastModified || Date.now()).getFullYear() };
    const wait = (el, ev, ms = 6000) => new Promise((res) => {
      const t = setTimeout(() => res(false), ms);
      el.addEventListener(ev, () => { clearTimeout(t); res(true); }, { once: true });
      el.addEventListener("error", () => { clearTimeout(t); res(false); }, { once: true });
    });
    const url = URL.createObjectURL(file);
    try {
      const el = document.createElement(isAudio ? "audio" : "video");
      el.muted = true; el.preload = "auto"; el.playsInline = true; el.src = url;
      if (await wait(el, "loadedmetadata")) {
        if (isFinite(el.duration)) m.duration = el.duration;
        if (!isAudio && el.videoWidth) {
          m.width = el.videoWidth; m.height = el.videoHeight;
          // colour: sample one frame and measure saturation
          el.currentTime = Math.min((el.duration || 0) * 0.3, 5);
          if (await wait(el, "seeked", 4000)) {
            const c = document.createElement("canvas"); c.width = 64; c.height = 36;
            const g = c.getContext("2d", { willReadFrequently: true });
            try {
              g.drawImage(el, 0, 0, 64, 36);
              const d = g.getImageData(0, 0, 64, 36).data; let sat = 0;
              for (let i = 0; i < d.length; i += 4) { const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]); sat += mx ? (mx - mn) / mx : 0; }
              m.color = sat / (d.length / 4) > 0.08 ? "컬러" : "흑백";
            } catch (e) {}
          }
          if (el.audioTracks) m.audio = el.audioTracks.length ? "사운드" : "무음";
          else if (typeof el.mozHasAudio === "boolean") m.audio = el.mozHasAudio ? "사운드" : "무음";
        }
      }
    } catch (e) {}
    URL.revokeObjectURL(url);
    if (isAudio) { m.audio = "사운드"; return m; }
    // container boxes (head + tail of the file): sound track, creation date, encoder, camera, lens
    try {
      const N = 4 * 1048576, dec = new TextDecoder("latin1");
      const head = dec.decode(await file.slice(0, N).arrayBuffer());
      const tail = file.size > N ? dec.decode(await file.slice(Math.max(N, file.size - N)).arrayBuffer()) : "";
      const txt = head + tail;
      if (/hdlr[\s\S]{8}soun/.test(txt)) m.audio = "사운드";
      else if (/hdlr[\s\S]{8}vide/.test(txt) && !m.audio) m.audio = "무음";
      const mv = txt.indexOf("mvhd");
      if (mv > 0) {
        const b = (k) => txt.charCodeAt(mv + k) & 255;
        const v = b(4), o = v === 1 ? 12 : 8;
        const secs = v === 1 ? (b(o + 4) * 16777216 + b(o + 5) * 65536 + b(o + 6) * 256 + b(o + 7)) : (b(o) * 16777216 + b(o + 1) * 65536 + b(o + 2) * 256 + b(o + 3));
        const y = new Date((secs - 2082844800) * 1000).getUTCFullYear();
        if (y > 1990 && y <= new Date().getFullYear()) m.year = y;
      }
      const too = txt.match(/\xa9too[\s\S]{4}data[\s\S]{8}([\x20-\x7e]{2,60})/);
      if (too) m.editor = /^Lavf/.test(too[1]) ? "FFmpeg" : too[1].trim();
      const sony = txt.match(/modelName="([^"]+)"/);
      const iphone = txt.match(/(iPhone [0-9A-Za-z ]{1,24})/);
      const mk = txt.match(/manufacturer="([^"]+)"/);
      if (sony) m.camera = ((mk ? mk[1] + " " : "") + sony[1]).trim();
      else if (iphone) m.camera = iphone[1].trim();
      const lens = txt.match(/[Ll]ens[A-Za-z]*Name="([^"]+)"/) || txt.match(/(iPhone [^\x00]{2,30} (?:back|front)[\x20-\x7e]{0,40})/);
      if (lens) m.lens = lens[1].trim();
    } catch (e) {}
    return m;
  };

  /* ======================================================
     LOGIN PAGE
     ====================================================== */
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("f-name").value.trim();
      const org = document.getElementById("f-org");
      store.clear();
      if (name) store.set("mm_name", name);
      if (org.value.trim()) store.set("mm_org", org.dataset.short || org.value.trim());
      // My Library (storage) shows this name and the login time as the join date
      try { localStorage.setItem("mm_name", name || ""); localStorage.setItem("mm_login_at", String(Date.now())); } catch (err) {}
      go("myarchive-home");
    });

    /* 소속 search — museum · gallery list (orgs.js), works offline */
    const layer = document.getElementById("addrLayer");
    const query = document.getElementById("orgQuery");
    const list = document.getElementById("orgList");
    const orgInput = document.getElementById("f-org");
    const ORGS = window.MM_ORGS || [];
    const norm = (s) => s.replace(/\s+/g, "").toLowerCase();
    const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const mark = (name, q) => {
      if (!q) return esc(name);
      // highlight the matched part (ignoring spaces)
      const chars = [...name]; let flat = ""; const map = [];
      chars.forEach((ch, i) => { if (!/\s/.test(ch)) { flat += ch.toLowerCase(); map.push(i); } });
      const at = flat.indexOf(q);
      if (at < 0) return esc(name);
      const s = map[at], e = map[at + q.length - 1];
      return esc(chars.slice(0, s).join("")) + "<mark>" + esc(chars.slice(s, e + 1).join("")) + "</mark>" + esc(chars.slice(e + 1).join(""));
    };

    const render = () => {
      const raw = query.value.trim();
      const q = norm(raw);
      const hits = q ? ORGS.filter((o) => norm(o.name).includes(q) || norm(o.addr).includes(q) || norm(o.type).includes(q)) : ORGS;
      const items = hits.map((o) => `
        <li><button class="org-item" type="button" data-name="${esc(o.name)}">
          <span class="org-item__name">${mark(o.name, q)}</span>
          <span class="org-item__addr"><span class="org-item__tag">${o.type}</span>${esc(o.addr)}</span>
        </button></li>`).join("");
      // not in the list → use what was typed as the 소속 name
      const own = raw && !ORGS.some((o) => norm(o.name) === q)
        ? `<li><button class="org-item" type="button" data-name="${esc(raw)}">
             <span class="org-item__name">'${esc(raw)}' 직접 입력</span>
             <span class="org-item__addr">목록에 없으면 입력한 이름으로 등록돼요</span>
           </button></li>` : "";
      list.innerHTML = items + own || '<li class="org-empty">검색 결과가 없습니다.</li>';
    };

    const close = () => {
      layer.classList.remove("is-open");
      layer.setAttribute("aria-hidden", "true");
    };
    const open = () => {
      layer.classList.add("is-open");
      layer.setAttribute("aria-hidden", "false");
      query.value = "";
      render();
      query.focus();
    };

    query.addEventListener("input", render);
    query.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); const first = list.querySelector(".org-item"); if (first) first.click(); }
    });
    list.addEventListener("click", (e) => {
      const b = e.target.closest(".org-item");
      if (!b) return;
      orgInput.value = b.dataset.name;      // 소속 = 상호명
      orgInput.dataset.short = b.dataset.name;
      close();
    });

    document.getElementById("orgSearch").addEventListener("click", open);
    // 소속 is filled only through the search window; clicking the field also opens it
    orgInput.addEventListener("click", open);
    orgInput.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    document.getElementById("addrClose").addEventListener("click", close);
    layer.addEventListener("click", (e) => { if (e.target === layer) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && layer.classList.contains("is-open")) close(); });
  }

  /* ======================================================
     COLLECTIONS LIST PAGE
     ====================================================== */
  const rowsEl = document.getElementById("rows");
  if (rowsEl) {
    // name typed on the login page
    const name = store.get("mm_name");
    if (name) document.getElementById("userName").textContent = name;
    // 소속 chosen on the login page
    const org = store.get("mm_org");
    if (org) document.getElementById("userOrg").textContent = org;

    document.getElementById("logoutBtn").addEventListener("click", () => store.clear());

    const WORKS = [
      { state: "미작성", title: "작품명", empty: true, date: "2026.11.12", result: "-", action: { label: "시작하기", goto: "upload" } },   // not written yet: placeholder name, gray
      { state: "대기중", title: "무제 2", date: "2026.11.08", result: "-",     action: { label: "수정하기", goto: "resume" } },
      { state: "심사중", title: "무제 3", date: "2026.11.03", result: "-",     action: { label: "수정불가", disabled: true } },
      { state: "반려",   title: "무제 4", date: "2026.10.27", result: "재심사", action: { label: "사유보기", goto: "reason" } },
      { state: "완료",   title: "무제 5", date: "2026.10.15", result: "통과",   action: { label: "바로가기", goto: "shortcut" } }
    ];

    // A work submitted through the whole 시작하기 flow (or resubmitted from 사유보기) shows as 대기중 (수정하기) —
    // only until the list page is reloaded (prototype: nothing is kept for good).
    try {
      const nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
      if (nav && nav.type === "reload") sessionStorage.removeItem("mm_submitted");
      const done = sessionStorage.getItem("mm_submitted");
      const w = done && WORKS.find((x) => x.title === done && (x.state === "미작성" || x.state === "반려"));
      if (w) { w.state = "대기중"; w.result = "-"; w.action = { label: "수정하기", goto: "resume" }; }
    } catch (err) {}

    let currentState = "전체";
    const searchInput = document.getElementById("searchInput");
    const norm = (s) => s.replace(/\s+/g, "").toLowerCase();

    const render = () => {
      const q = norm(searchInput.value);
      const list = WORKS.filter((w) =>
        (currentState === "전체" || w.state === currentState) &&
        (!q || norm(w.title).includes(q)));
      rowsEl.innerHTML = list.length
        ? list.map((w) => `
          <div class="tr" role="row">
            <div class="tr__cells"><span>${w.state}</span><span${w.empty ? ' class="is-empty"' : ""}>${w.title}</span><span>${w.date}</span><span>${w.result}</span></div>
            <span class="tr__act">${w.action.disabled
              ? `<button class="row-btn is-disabled" type="button" disabled>${w.action.label}</button>`
              : `<button class="row-btn" type="button" data-goto-row="${w.action.goto}">${w.action.label}</button>`}</span>
          </div>`).join("")
        : `<div class="tr tr--empty" role="row"><div class="tr__cells"><span>검색 결과가 없습니다.</span></div></div>`;
    };
    rowsEl.addEventListener("click", (e) => {
      const b = e.target.closest("[data-goto-row]");
      if (!b) return;
      const title = T(b.closest(".tr").querySelector(".tr__cells span:nth-child(2)"));
      try {
        localStorage.setItem("mm_work", title);
        // the 대기중 change only counts for a flow begun with 시작하기
        if (T(b).trim() === "시작하기") sessionStorage.setItem("mm_flow", title);
        else sessionStorage.removeItem("mm_flow");
        // a fresh 시작하기 / 수정하기 is not a revision of a rejected work
        if (T(b).trim() !== "사유보기") { sessionStorage.removeItem("mm_revise"); sessionStorage.removeItem("mm_jump"); }
      } catch (err) {}
      go(b.dataset.gotoRow);
    });
    searchInput.addEventListener("input", render);

    /* State dropdown */
    const stateBox = document.getElementById("state");
    const stateBtn = document.getElementById("stateBtn");
    const stateMenu = document.getElementById("stateMenu");
    const stateLabel = document.getElementById("stateLabel");
    const setOpen = (open) => {
      stateMenu.hidden = !open;
      stateBox.classList.toggle("is-open", open);
      stateBtn.setAttribute("aria-expanded", String(open));
    };
    stateBtn.addEventListener("click", () => setOpen(stateMenu.hidden));
    stateMenu.addEventListener("click", (e) => {
      const b = e.target.closest("[data-state]");
      if (!b) return;
      currentState = b.dataset.state;
      stateLabel.textContent = currentState === "전체" ? "State" : currentState;
      stateMenu.querySelectorAll("[data-state]").forEach((x) => x.classList.toggle("is-selected", x === b));
      setOpen(false);
      render();
    });
    document.addEventListener("click", (e) => { if (!stateBox.contains(e.target)) setOpen(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });

    render();
  }

  /* ======================================================
     UPLOAD PAGE
     ====================================================== */
  const nextBtn = document.getElementById("nextBtn");
  if (nextBtn) {
    const $ = (id) => document.getElementById(id);
    const name = store.get("mm_name"); if (name) $("userName").textContent = name;
    const org = store.get("mm_org");   if (org) $("userOrg").textContent = org;
    $("backBtn").addEventListener("click", () => history.back());
    $("logoutBtn").addEventListener("click", () => store.clear());

    const toastEl = $("toast"); let toastT;
    const toast = (msg) => {
      toastEl.textContent = msg; toastEl.classList.add("is-on");
      clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("is-on"), 1800);
    };

    // 작품 유형 (대범주): remember the checked ones for the Details page
    document.querySelectorAll("input[name=type]").forEach((cb) => {
      cb.addEventListener("change", () => {
        const on = [...document.querySelectorAll("input[name=type]:checked")].map((x) => x.value);
        try { localStorage.setItem("mm_types", JSON.stringify(on)); } catch (e) {}
      });
    });
    // every visit starts with no type checked (and no old choice carried into Details)
    try { localStorage.removeItem("mm_types"); localStorage.removeItem("mm_master_name"); } catch (e) {}
    const clearTypes = () => document.querySelectorAll("input[name=type]").forEach((cb) => { cb.checked = false; });
    clearTypes();
    window.addEventListener("pageshow", (e) => { if (e.persisted) { clearTypes(); try { localStorage.removeItem("mm_types"); } catch (err) {} } });

    // 작품 업로드 (mp4 / wav only): pictogram → file picker, name under the icon
    // 마스터본을 올리면 열람본은 압축본이 자동으로 채워집니다.
    const drops = [...document.querySelectorAll(".drop")];
    const [masterDrop, , viewDrop] = drops;
    const setDrop = (drop, name) => {
      drop.querySelector(".drop__name").textContent = name || "";
      drop.classList.toggle("has-file", !!name);
      drop.classList.remove("is-busy");
      if (name) drop.classList.remove("is-missing", "is-fix");
    };
    let autoTimer;
    const autoView = (file) => {
      clearTimeout(autoTimer);
      if (!file) { if (viewDrop.dataset.auto) { delete viewDrop.dataset.auto; setDrop(viewDrop, ""); } return; }
      const base = file.name.replace(/\.[^.]+$/, "");
      const ext = /\.wav$/i.test(file.name) ? "mp3" : "mp4";
      viewDrop.querySelector("input").value = "";
      viewDrop.dataset.auto = "1";
      setDrop(viewDrop, "");
      viewDrop.classList.add("is-busy");
      viewDrop.querySelector(".drop__name").textContent = "압축 중…";
      autoTimer = setTimeout(() => { setDrop(viewDrop, `${base}_열람본.${ext}`); toast("열람본이 자동으로 업로드되었습니다."); }, 1400);
    };
    drops.forEach((drop) => {
      const input = drop.querySelector("input[type=file]");
      const del = document.createElement("button");
      del.type = "button"; del.className = "drop__del"; del.setAttribute("aria-label", "파일 삭제"); del.textContent = "×";
      drop.appendChild(del);
      del.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        input.value = ""; delete drop.dataset.auto; setDrop(drop, "");
        if (drop === masterDrop) { autoView(null); try { localStorage.removeItem("mm_meta"); localStorage.removeItem("mm_master_name"); } catch (err) {} }
      });
      input.addEventListener("change", () => {
        let f = input.files[0];
        if (f && !/\.(mp4|wav)$/i.test(f.name)) { toast("MP4, WAV 파일만 업로드할 수 있습니다."); input.value = ""; f = null; }
        if (!f) return;
        if (drop === viewDrop) { clearTimeout(autoTimer); delete drop.dataset.auto; }
        setDrop(drop, f.name);
        if (drop === masterDrop) {
          autoView(f); readMeta(f).then((m) => { try { localStorage.setItem("mm_meta", JSON.stringify(m)); } catch (err) {} });
          // the master file's name (without .mp4/.wav) becomes 소장품명 on Details
          try { localStorage.setItem("mm_master_name", f.name.replace(/\.[^.]+$/, "").trim()); } catch (err) {}
        }
      });
    });

    // 스틸컷: jpg / png / webp, max 3, shown as photos
    const MAX = 3, stills = [];
    const stillInput = $("stillInput"), thumbs = $("stillThumbs"), add = $("stillAdd"), box = $("stills");
    const drawStills = () => {
      thumbs.innerHTML = "";
      stills.forEach((s, i) => {
        const d = document.createElement("div"); d.className = "thumb-still";
        d.innerHTML = `<img alt=""><button type="button" aria-label="삭제">×</button>`;
        d.querySelector("img").src = s.url; d.querySelector("img").alt = s.name;
        d.querySelector("button").addEventListener("click", () => { URL.revokeObjectURL(s.url); stills.splice(i, 1); drawStills(); });
        thumbs.appendChild(d);
      });
      add.hidden = stills.length >= MAX;
      box.classList.toggle("has-thumbs", stills.length > 0);
      if (stills.length) box.classList.remove("is-missing");
      $("stillCount").textContent = stills.length ? `${stills.length} / ${MAX}` : "";
    };
    add.addEventListener("click", () => stillInput.click());
    stillInput.addEventListener("change", () => {
      const files = [...stillInput.files]; stillInput.value = "";
      const ok = files.filter((f) => /\.(jpe?g|png|webp)$/i.test(f.name) || /^image\/(jpeg|png|webp)$/.test(f.type));
      if (ok.length < files.length) toast("JPG, PNG, WebP 파일만 업로드할 수 있습니다.");
      const room = MAX - stills.length;
      if (ok.length > room) toast("스틸컷은 최대 3장까지 올릴 수 있습니다.");
      ok.slice(0, room).forEach((f) => stills.push({ name: f.name, url: URL.createObjectURL(f) }));
      drawStills();
    });
    drawStills();

    // 추가 자료: pdf / word only, rows become links
    const docs = [], docInput = $("docInput"), docRows = $("docRows");
    const DOC_RE = /\.(pdf|docx?)$/i;
    let replaceAt = -1;
    const today = () => { const d = new Date(); const p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`; };
    const rowHTML = (num, nameHTML, date, empty) =>
      `<div class="drow"><div class="drow__cells"><span>${num}</span><span>${nameHTML}</span><span>${date}</span></div>` +
      `<button class="mini-btn mini-btn--change" type="button"${empty ? " disabled" : ""}>변경하기</button>` +
      `<button class="mini-btn mini-btn--x" type="button" aria-label="삭제"${empty ? " disabled" : ""}>X</button></div>`;
    const drawDocs = () => {
      if (!docs.length) { docRows.innerHTML = rowHTML("01", '<span class="is-empty">파일을 업로드해주세요.</span>', "-", true); return; }
      docRows.innerHTML = docs.map((d, i) => rowHTML(String(i + 1).padStart(2, "0"), '<a target="_blank" rel="noopener"></a>', d.date, false)).join("");
      docRows.querySelectorAll(".drow").forEach((row, i) => {
        const a = row.querySelector("a"); a.href = docs[i].url; a.textContent = docs[i].name;
        row.querySelector(".mini-btn--change").addEventListener("click", () => { replaceAt = i; docInput.click(); });
        row.querySelector(".mini-btn--x").addEventListener("click", () => { URL.revokeObjectURL(docs[i].url); docs.splice(i, 1); drawDocs(); });
      });
    };
    $("docUpload").addEventListener("click", () => { replaceAt = -1; docInput.click(); });
    docInput.addEventListener("change", () => {
      const f = docInput.files[0]; docInput.value = "";
      if (!f) return;
      if (!DOC_RE.test(f.name)) { toast("PDF, Word 파일만 업로드할 수 있습니다."); return; }
      const item = { name: f.name, url: URL.createObjectURL(f), date: today() };
      if (replaceAt >= 0) { URL.revokeObjectURL(docs[replaceAt].url); docs[replaceAt] = item; } else docs.push(item);
      drawDocs();
    });
    drawDocs();

    // 약관동의 → terms filled gray, Next enabled
    const agree = $("agreeBtn"), terms = $("terms");
    agree.addEventListener("click", () => {
      const on = agree.getAttribute("aria-pressed") !== "true";
      agree.setAttribute("aria-pressed", String(on));
      terms.classList.toggle("is-agreed", on);
      nextBtn.disabled = !on && !FREE_NEXT;
    });
    // Next: 마스터본·스틸컷이 비어 있으면 그 위치로 올라가 파란 테두리로 표시
    const main = document.querySelector(".ml-main");
    if (FREE_NEXT) nextBtn.disabled = false;
    nextBtn.addEventListener("click", () => {
      if (FREE_NEXT) { openLoading(); return; }
      if (nextBtn.disabled) return;
      const missing = [];
      if (!masterDrop.classList.contains("has-file")) missing.push(masterDrop);
      if (!stills.length) missing.push(box);
      missing.forEach((el) => el.classList.add("is-missing"));
      if (missing.length) {
        const sec = missing[0].closest(".up-sec");
        const top = sec.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop - 20;
        main.scrollTo({ top, behavior: "smooth" });
        toast(missing.length === 2 ? "작품 파일과 스틸컷을 업로드해주세요." : missing[0] === box ? "스틸컷을 업로드해주세요." : "마스터본 파일을 업로드해주세요.");
        return;
      }
      openLoading();
    });
  }

  /* ---- Upload → Details: two "Loading" boxes (Figma 1329:11394 · 1329:11626).
     The grey band plays the loop video (fitted, centred); when it ends the next box comes,
     and after the second one Details opens and types the extracted info in (blue → black). ---- */
  function openLoading() {
    // no video: the page behind is just frosted like the other boxes.
    // 5s 메타데이터 파서 → 5s AI 초안 → Details
    const STEP = 5000;
    const steps = ["메타데이터 파서기로 기본 정보 추출 중", "AI와 함께 작품설명 작성 중"];
    const m = modals.loading || makeModal("loading", "Loading", "잠시만 기다려주세요", steps[0], []);
    m.classList.add("leave--loading");
    if (!m.dataset.wired) {
      m.dataset.wired = "1";
      const stop = () => { clearTimeout(m._t1); clearTimeout(m._t2); m.dataset.step = ""; };
      m.querySelector(".leave__x").addEventListener("click", stop);
      m.querySelector(".leave__dim").addEventListener("click", stop);
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") stop(); });
    }
    const toStep2 = () => {
      if (!m.classList.contains("is-open") || m.dataset.step !== "0") return;
      m.dataset.step = "1";
      // the line visibly changes: old one slides up and out, new one comes up from below
      const s = m.querySelector(".leave__s");
      s.classList.add("is-out");
      setTimeout(() => {
        s.textContent = steps[1]; s.classList.remove("is-out"); s.classList.add("is-in");
        requestAnimationFrame(() => requestAnimationFrame(() => s.classList.remove("is-in")));
      }, 350);
    };
    const toDetails = () => {
      if (!m.classList.contains("is-open") || m.dataset.step !== "1") return;
      m.dataset.step = "2";
      try { sessionStorage.setItem("mm_typein", "1"); } catch (e) {} go("details");
    };
    m.dataset.step = "0"; m.querySelector(".leave__s").textContent = steps[0];
    showModal(m);
    clearTimeout(m._t1); clearTimeout(m._t2);
    m._t1 = setTimeout(toStep2, STEP);
    m._t2 = setTimeout(toDetails, STEP * 2);
  }

  /* ======================================================
     DETAILS PAGE
     ====================================================== */
  const dtNext = document.getElementById("dtNext");
  if (dtNext) {
    let ready = false;
    const $ = (id) => document.getElementById(id);
    const ls = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
    const name = store.get("mm_name"); if (name) $("userName").textContent = name;
    const org = store.get("mm_org");   if (org) $("userOrg").textContent = org;
    $("backBtn").addEventListener("click", () => history.back());
    $("logoutBtn").addEventListener("click", () => store.clear());
    const toastEl = $("toast"); let toastT;
    const toast = (msg) => { toastEl.textContent = msg; toastEl.classList.add("is-on"); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("is-on"), 1800); };

    /* ---- 작가명(영문): Korean name → romanized "Given-Family" ---- */
    const SURNAME = { 김:"Kim",이:"Lee",박:"Park",최:"Choi",정:"Jung",강:"Kang",조:"Cho",윤:"Yoon",장:"Jang",임:"Lim",한:"Han",오:"Oh",서:"Seo",신:"Shin",권:"Kwon",황:"Hwang",안:"Ahn",송:"Song",류:"Ryu",유:"Yoo",전:"Jeon",홍:"Hong",고:"Ko",문:"Moon",양:"Yang",손:"Son",배:"Bae",백:"Baek",허:"Heo",남:"Nam",심:"Shim",노:"Noh",하:"Ha",곽:"Kwak",성:"Sung",차:"Cha",주:"Joo",우:"Woo",구:"Koo",민:"Min",진:"Jin",나:"Na",지:"Ji",엄:"Eom",변:"Byun",채:"Chae",원:"Won",천:"Cheon",방:"Bang",공:"Kong",현:"Hyun",함:"Ham",염:"Yeom",여:"Yeo",추:"Choo",도:"Do",소:"So",석:"Seok",선:"Sun",설:"Seol",마:"Ma",길:"Gil",연:"Yeon",위:"Wi",표:"Pyo",명:"Myung",기:"Ki",반:"Ban",왕:"Wang",금:"Keum",옥:"Ok",육:"Yook",인:"In",맹:"Maeng",제:"Je",모:"Mo",탁:"Tak",국:"Kook",어:"Eo",은:"Eun",편:"Pyeon",용:"Yong",예:"Ye",경:"Kyung",봉:"Bong",사:"Sa",부:"Boo",가:"Ga",복:"Bok",태:"Tae",목:"Mok",형:"Hyung",피:"Pi",두:"Doo",감:"Gam",빈:"Bin",동:"Dong",호:"Ho",범:"Beom",승:"Seung",상:"Sang",시:"Si",단:"Dan",남궁:"Namgoong",제갈:"Jegal",선우:"Sunwoo",독고:"Dokgo",황보:"Hwangbo",사공:"Sagong",서문:"Seomun" };
    const CHO = ["g","kk","n","d","tt","r","m","b","pp","s","ss","","j","jj","ch","k","t","p","h"];
    const JUNG = ["a","ae","ya","yae","eo","e","yeo","ye","o","wa","wae","oe","yo","u","wo","we","wi","yu","eu","ui","i"];
    const JONG = ["","k","k","k","n","n","n","t","l","k","m","l","l","l","p","l","m","p","p","t","t","ng","t","t","k","t","p","t"];
    const roman = (str) => [...str].map((ch) => {
      const c = ch.charCodeAt(0) - 0xac00;
      if (c < 0 || c > 11171) return ch;
      return CHO[Math.floor(c / 588)] + JUNG[Math.floor((c % 588) / 28)] + JONG[c % 28];
    }).join("");
    const cap = (w) => w ? w[0].toUpperCase() + w.slice(1) : w;
    const toEnglish = (ko) => {
      ko = (ko || "").trim();
      if (!/^[가-힣]{2,5}$/.test(ko)) return ko;
      const two = ko.length >= 4 && SURNAME[ko.slice(0, 2)] ? 2 : 1;
      const fam = ko.slice(0, two), given = ko.slice(two);
      return `${cap(roman(given))}-${SURNAME[fam] || cap(roman(fam))}`;
    };

    /* ---- values: metadata (gray) or manual (white, "-") ---- */
    let meta = null; try { meta = JSON.parse(ls("mm_meta")); } catch (e) {}
    // no master file read yet → sample values from the Figma file so the page is never empty
    const SAMPLE = { kind: "video", ext: "mp4", sizeMB: 688, duration: 600, width: 3840, height: 2160, color: "흑백", audio: "사운드", year: 2026, camera: "소니 A7M4", lens: "탐론 28-70mm" };
    const m = meta || SAMPLE;
    const pad = (n) => String(n).padStart(2, "0");
    const hms = (t) => { t = Math.round(t); return `${pad(Math.floor(t / 3600))}:${pad(Math.floor(t / 60) % 60)}:${pad(t % 60)}`; };
    const res = (w, h) => { const x = Math.max(w, h); return x >= 7680 ? "8K" : x >= 3840 ? "4K" : x >= 2560 ? "QHD" : x >= 1920 ? "FHD" : x >= 1280 ? "HD" : `${w}×${h}`; };
    const koName = name || "홍길동";
    const AUTO = {
      title: ls("mm_master_name") || ls("mm_work") || "무제",   // 마스터본 파일 이름 → 소장품명
      artistKo: koName,
      artistEn: toEnglish(koName),
      year: m.year ? String(m.year) : "",
      material: m.kind === "audio" ? "단채널 사운드" : "단채널 비디오",
      type: (() => { try { return JSON.parse(ls("mm_types") || "[]")[0] || "영상·사운드"; } catch (e) { return "영상·사운드"; } })(),
      channel: "단채널",
      audio: m.audio || "",
      color: m.kind === "video" ? (m.color || "") : "",
      duration: m.duration ? hms(m.duration) : "",
      size: m.sizeMB ? `${m.sizeMB >= 1024 ? (m.sizeMB / 1024).toFixed(1) + "GB" : Math.max(1, Math.round(m.sizeMB)) + "MB"}` : "",
      format: m.ext ? m.ext.toUpperCase() : "",
      resolution: m.width ? res(m.width, m.height) : "",
      camera: m.camera || "",
      editor: m.editor || "",
      lens: m.lens || "",
      venue: org || ""
    };
    const DEFAULT = { soundproof: "필수", loop: "필수" };   // white selects start on their first option

    const CHEV = '<svg viewBox="0 0 10 6" fill="none" stroke="#000" stroke-width="1.4"><path d="M1 1l4 4 4-4"/></svg>';
    const flds = [...document.querySelectorAll(".fld")];
    const closeAll = (except) => flds.forEach((f) => { if (f !== except) f.classList.remove("is-open"); });

    flds.forEach((fld) => {
      const key = fld.dataset.key, kind = fld.dataset.kind;
      const auto = AUTO[key];
      fld.classList.toggle("is-auto", !!auto);
      const box = document.createElement("div"); box.className = "fld__box";
      const input = document.createElement("input");
      input.className = "fld__in"; input.type = "text"; input.placeholder = kind === "text" ? "직접 입력" : "선택"; input.value = auto || DEFAULT[key] || "";
      input.setAttribute("aria-label", fld.querySelector(".fld__l").textContent);
      box.appendChild(input); fld.appendChild(box);
      fld._input = input;
      input.addEventListener("input", () => { fld.classList.remove("is-missing", "is-fix"); check(); });

      if (kind === "select") {
        input.readOnly = true;
        const chev = document.createElement("button"); chev.type = "button"; chev.className = "fld__btn"; chev.style.width = "auto";
        chev.setAttribute("aria-label", "목록 열기"); chev.innerHTML = CHEV; box.appendChild(chev);
        const menu = document.createElement("div"); menu.className = "fld__menu";
        fld.dataset.options.split("|").forEach((o) => {
          const b = document.createElement("button"); b.type = "button"; b.textContent = o;
          b.addEventListener("click", (e) => {
            e.stopPropagation(); fld.classList.remove("is-open");
            menu.querySelectorAll("button").forEach((x) => x.classList.toggle("is-selected", x === b));
            if (o === "직접 입력") { input.readOnly = false; input.value = ""; input.placeholder = "직접 입력"; input.focus(); }
            else { input.readOnly = true; input.placeholder = "선택"; input.value = o; }
            fld.classList.remove("is-missing", "is-fix"); check();
          });
          if (o === input.value) b.classList.add("is-selected");
          menu.appendChild(b);
        });
        box.appendChild(menu);
        box.addEventListener("click", (e) => {
          if (!input.readOnly && e.target === input) return;     // typing a custom value
          e.stopPropagation(); closeAll(fld); fld.classList.toggle("is-open");
        });
        input.style.cursor = "pointer";
      }

      if (kind === "year") {
        input.readOnly = true; input.style.cursor = "pointer";
        const chev = document.createElement("span"); chev.className = "fld__btn"; chev.style.width = "auto"; chev.innerHTML = CHEV; box.appendChild(chev);
        const pop = document.createElement("div"); pop.className = "year-pop";
        pop.innerHTML = `<div class="year-pop__head"><button type="button" data-y="-12" aria-label="이전">‹</button><span></span><button type="button" data-y="12" aria-label="다음">›</button></div><div class="year-pop__grid"></div>`;
        box.appendChild(pop);
        const now = new Date().getFullYear();
        let start;
        const draw = () => {
          pop.querySelector(".year-pop__head span").textContent = `${start} – ${start + 11}`;
          const grid = pop.querySelector(".year-pop__grid"); grid.innerHTML = "";
          for (let y = start; y < start + 12; y++) {
            const b = document.createElement("button"); b.type = "button"; b.textContent = y;
            if (String(y) === input.value) b.classList.add("is-selected");
            if (y > now) { b.disabled = true; b.classList.add("is-out"); }
            b.addEventListener("click", (e) => { e.stopPropagation(); input.value = y; fld.classList.remove("is-open", "is-missing", "is-fix"); check(); });
            grid.appendChild(b);
          }
        };
        pop.addEventListener("click", (e) => {
          e.stopPropagation();
          const d = e.target.closest("[data-y]"); if (d) { start += Number(d.dataset.y); draw(); }
        });
        box.addEventListener("click", (e) => {
          e.stopPropagation(); closeAll(fld);
          if (!fld.classList.contains("is-open")) { const y = Number(input.value) || now; start = y - ((y - (now - 11)) % 12 + 12) % 12; draw(); }
          fld.classList.toggle("is-open");
        });
      }
    });
    document.addEventListener("click", () => closeAll());
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });

    /* ---- 작품설명 (AI draft, editable) + 추가사항 — 1000 chars incl. spaces ---- */
    const LIMIT = 1000;
    const counter = (area, out) => {
      const upd = () => {
        if (area.value.length > LIMIT) area.value = area.value.slice(0, LIMIT);
        out.textContent = `${area.value.length} / ${LIMIT}`;
        out.classList.toggle("is-full", area.value.length >= LIMIT);
      };
      area.addEventListener("input", () => { upd(); area.classList.remove("is-missing"); check(); });
      upd(); return upd;
    };
    const desc = $("desc"), updDesc = counter(desc, $("descCount"));
    counter($("extra"), $("extraCount"));
    // AI draft shown at once, editable right away
    desc.value = desc.dataset.ai.slice(0, LIMIT); updDesc();

    // coming from the Loading boxes: the extracted info and the 작품설명 are typed in, blue while writing → black
    let typeIn = false; try { typeIn = sessionStorage.getItem("mm_typein") === "1"; sessionStorage.removeItem("mm_typein"); } catch (e) {}
    if (typeIn) {
      const autos = flds.filter((f) => f.classList.contains("is-auto") && f._input.value);
      const jobs = autos.map((f) => ({ el: f._input, text: f._input.value, ms: 45 }));
      jobs.push({ el: desc, text: desc.value, ms: 9, isDesc: true });
      jobs.forEach((jb) => { jb.el.value = ""; jb.el.readOnly = true; });
      updDesc();
      const typeOne = (jb) => new Promise((done) => {
        jb.el.classList.add("is-typing");
        const chars = [...jb.text]; let i = 0;
        const tick = () => {
          i = Math.min(chars.length, i + (jb.isDesc ? 2 : 1));
          jb.el.value = chars.slice(0, i).join("");
          if (jb.isDesc) { updDesc(); desc.style.height = "auto"; desc.style.height = `${desc.scrollHeight + 2}px`; }
          if (i < chars.length) setTimeout(tick, jb.ms);
          else { setTimeout(() => { jb.el.classList.remove("is-typing"); done(); }, 250); }
        };
        tick();
      });
      (async () => {
        await new Promise((r) => setTimeout(r, 400));
        for (const jb of jobs) await typeOne(jb);
        jobs.forEach((jb) => { if (!(jb.el._ro)) jb.el.readOnly = false; });
        flds.forEach((f) => { if (f.dataset.kind !== "text") f._input.readOnly = !(f._input.dataset.custom); });
        check();
      })();
    }
    // 작품설명 box follows its text: no empty space under the last line (grows / shrinks while typing)
    const fit = () => { desc.style.height = "auto"; desc.style.height = `${desc.scrollHeight + 2}px`; };
    desc.addEventListener("input", fit);
    window.addEventListener("resize", fit);
    fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

    /* ---- 예산안 / 설치도면: PDF·Word, rows become links ---- */
    const DOC_RE = /\.(pdf|docx?)$/i;
    const today = () => { const d = new Date(); return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`; };
    const docSets = [...document.querySelectorAll("[data-docs]")].map((wrap) => {
      const docs = [], rows = wrap.querySelector(".dt-rows"), input = wrap.querySelector("input[type=file]");
      let at = -1;
      const row = (num, nameHTML, date, empty) =>
        `<div class="drow"><div class="drow__cells"><span>${num}</span><span>${nameHTML}</span><span>${date}</span></div>` +
        `<button class="mini-btn mini-btn--change" type="button"${empty ? " disabled" : ""}>변경하기</button>` +
        `<button class="mini-btn mini-btn--x" type="button" aria-label="삭제"${empty ? " disabled" : ""}>X</button></div>`;
      const draw = () => {
        if (!docs.length) rows.innerHTML = row("01", '<span class="is-empty">파일을 업로드해주세요.</span>', "-", true);
        else {
          rows.innerHTML = docs.map((d, k) => row(pad(k + 1), '<a target="_blank" rel="noopener"></a>', d.date, false)).join("");
          rows.querySelectorAll(".drow").forEach((r, k) => {
            const a = r.querySelector("a"); a.href = docs[k].url; a.textContent = docs[k].name;
            r.querySelector(".mini-btn--change").addEventListener("click", () => { at = k; input.click(); });
            r.querySelector(".mini-btn--x").addEventListener("click", () => { URL.revokeObjectURL(docs[k].url); docs.splice(k, 1); draw(); });
          });
          wrap.classList.remove("is-missing");
        }
        check();
      };
      wrap.querySelector(".dt-up").addEventListener("click", () => { at = -1; input.click(); });
      input.addEventListener("change", () => {
        const f = input.files[0]; input.value = "";
        if (!f) return;
        if (!DOC_RE.test(f.name)) { toast("PDF, Word 파일만 업로드할 수 있습니다."); return; }
        const item = { name: f.name, url: URL.createObjectURL(f), date: today() };
        if (at >= 0) { URL.revokeObjectURL(docs[at].url); docs[at] = item; } else docs.push(item);
        draw();
      });
      return { wrap, docs, draw };
    });

    /* ---- 전시장 스틸컷: JPG·PNG·WebP, max 3 ---- */
    const MAX = 3, vStills = [];
    const vInput = $("vStillInput"), vThumbs = $("vStillThumbs"), vAdd = $("vStillAdd"), vBox = $("vStills");
    const drawV = () => {
      vThumbs.innerHTML = "";
      vStills.forEach((s, k) => {
        const d = document.createElement("div"); d.className = "thumb-still";
        d.innerHTML = `<img alt=""><button type="button" aria-label="삭제">×</button>`;
        d.querySelector("img").src = s.url; d.querySelector("img").alt = s.name;
        d.querySelector("button").addEventListener("click", () => { URL.revokeObjectURL(s.url); vStills.splice(k, 1); drawV(); });
        vThumbs.appendChild(d);
      });
      vAdd.hidden = vStills.length >= MAX;
      vBox.classList.toggle("has-thumbs", vStills.length > 0);
      if (vStills.length) vBox.classList.remove("is-missing");
      $("vStillCount").textContent = vStills.length ? `${vStills.length} / ${MAX}` : "";
      check();
    };
    vAdd.addEventListener("click", () => vInput.click());
    vInput.addEventListener("change", () => {
      const files = [...vInput.files]; vInput.value = "";
      const ok = files.filter((f) => /\.(jpe?g|png|webp)$/i.test(f.name) || /^image\/(jpeg|png|webp)$/.test(f.type));
      if (ok.length < files.length) toast("JPG, PNG, WebP 파일만 업로드할 수 있습니다.");
      const room = MAX - vStills.length;
      if (ok.length > room) toast("스틸컷은 최대 3장까지 올릴 수 있습니다.");
      ok.slice(0, room).forEach((f) => vStills.push({ name: f.name, url: URL.createObjectURL(f) }));
      drawV();
    });

    /* ---- Next: every gray field + 작품설명 + 예산안 + 설치도면 + 스틸컷 (white boxes optional) ---- */
    const missing = () => {
      const out = [];
      flds.forEach((f) => { if (f.classList.contains("is-auto") && !f._input.value.trim()) out.push(f); });
      if (!desc.value.trim()) out.push(desc);
      docSets.forEach((d) => { if (!d.docs.length) out.push(d.wrap); });
      if (!vStills.length) out.push(vBox);
      return out;
    };
    function check() { if (ready) dtNext.setAttribute("aria-disabled", String(!FREE_NEXT && missing().length > 0)); }
    // Next looks disabled until everything is in, but a click still points to what is missing
    dtNext.addEventListener("click", () => {
      const list = FREE_NEXT ? [] : missing();
      if (!list.length) { go("provenance"); return; }
      list.forEach((el) => el.classList.add("is-missing"));
      const main = document.querySelector(".ml-main");
      const top = list[0].getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop - 60;
      main.scrollTo({ top, behavior: "smooth" });
      toast("필수 항목을 모두 입력해주세요.");
    });
    ready = true;
    docSets.forEach((d) => d.draw());
    drawV();
    check();
  }

  /* ======================================================
     PROVENANCE PAGE
     ====================================================== */
  const pvNext = document.getElementById("pvNext");
  if (pvNext) {
    const $ = (id) => document.getElementById(id);
    const name = store.get("mm_name"); if (name) $("userName").textContent = name;
    const org = store.get("mm_org");   if (org) $("userOrg").textContent = org;
    $("backBtn").addEventListener("click", () => history.back());
    $("logoutBtn").addEventListener("click", () => store.clear());
    const toastEl = $("toast"); let toastT;
    const toast = (msg) => { toastEl.textContent = msg; toastEl.classList.add("is-on"); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("is-on"), 1800); };
    const pad = (n) => String(n).padStart(2, "0");
    const today = () => { const d = new Date(); return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`; };
    const DOC_RE = /\.(pdf|docx?)$/i;
    const btns = (empty) =>
      `<button class="mini-btn mini-btn--change" type="button"${empty ? " disabled" : ""}>변경하기</button>` +
      `<button class="mini-btn mini-btn--x" type="button" aria-label="삭제"${empty ? " disabled" : ""}>X</button>`;
    const link = (d) => { const a = document.createElement("a"); a.href = d.url; a.target = "_blank"; a.rel = "noopener"; a.textContent = d.name; return a; };

    // 연혁 tables + 권리: upload PDF / Word, file becomes a link (same as the Upload page)
    document.querySelectorAll("[data-pv]").forEach((wrap) => {
      const four = wrap.dataset.cols === "4";
      const fixed = wrap.dataset.fixed ? wrap.dataset.fixed.split("|") : null;
      const rows = wrap.querySelector(".dt-rows"), input = wrap.querySelector("input[type=file]");
      const docs = fixed ? fixed.map(() => null) : [];
      let at = -1;
      const cls = `drow${four ? " drow--4" : ""}`;
      const draw = () => {
        if (fixed) {
          // 권리: four fixed documents — each row has its own 업로드 button
          rows.innerHTML = fixed.map((label, k) => `<div class="${cls}"><div class="drow__cells"><span>${pad(k + 1)}</span><span>${label}</span><span>-</span><span class="pv-cell-btn"><button class="pill-gray pv-row-up" type="button">업로드</button></span></div>${btns(!docs[k])}</div>`).join("");
          rows.querySelectorAll(".drow").forEach((r, k) => {
            const d = docs[k], cells = r.querySelectorAll(".drow__cells > span");
            if (d) { cells[2].textContent = ""; cells[2].appendChild(link(d)); }
            r.querySelector(".pv-row-up").addEventListener("click", () => { at = k; input.click(); });
            r.querySelector(".mini-btn--change").addEventListener("click", () => { at = k; input.click(); });
            r.querySelector(".mini-btn--x").addEventListener("click", () => { URL.revokeObjectURL(docs[k].url); docs[k] = null; draw(); });
          });
          return;
        }
        if (!docs.length) {
          rows.innerHTML = `<div class="${cls}"><div class="drow__cells"><span>01</span><span class="is-empty">파일을 업로드해주세요.</span>${four ? "<span>-</span>" : ""}<span>-</span></div>${btns(true)}</div>`;
          return;
        }
        rows.innerHTML = docs.map((d, k) => `<div class="${cls}"><div class="drow__cells"><span>${pad(k + 1)}</span><span></span>${four ? "<span>-</span>" : ""}<span>${d.date}</span></div>${btns(false)}</div>`).join("");
        rows.querySelectorAll(".drow").forEach((r, k) => {
          r.querySelector(".drow__cells > span:nth-child(2)").appendChild(link(docs[k]));
          r.querySelector(".mini-btn--change").addEventListener("click", () => { at = k; input.click(); });
          r.querySelector(".mini-btn--x").addEventListener("click", () => { URL.revokeObjectURL(docs[k].url); docs.splice(k, 1); draw(); });
        });
      };
      const up = wrap.querySelector(".dt-up");
      if (up) up.addEventListener("click", () => { at = -1; input.click(); });
      input.addEventListener("change", () => {
        const f = input.files[0]; input.value = "";
        if (!f) return;
        if (!DOC_RE.test(f.name)) { toast("PDF, Word 파일만 업로드할 수 있습니다."); return; }
        const item = { name: f.name, url: URL.createObjectURL(f), date: today() };
        if (at >= 0) { if (docs[at]) URL.revokeObjectURL(docs[at].url); docs[at] = item; } else docs.push(item);
        wrap.classList.remove("is-fix");
        draw();
      });
      draw();
    });

    pvNext.addEventListener("click", openSubmit);   // Final Submission modal
  }

  /* ======================================================
     REVIEW RESULT (반려 사유) PAGE
     ====================================================== */
  const rv = document.querySelector(".rv");
  if (rv) {
    const $ = (id) => document.getElementById(id);
    const name = store.get("mm_name"); if (name) $("userName").textContent = name;
    const org = store.get("mm_org");   if (org) $("userOrg").textContent = org;
    try { const t = localStorage.getItem("mm_work"); if (t) $("rvTitle").textContent = t; } catch (e) {}
    $("backBtn").addEventListener("click", () => history.back());     // back to My Archive home, no modal
    $("logoutBtn").addEventListener("click", () => store.clear());
    rv.querySelectorAll(".rv-tab").forEach((tab) => tab.addEventListener("click", () => {
      rv.querySelectorAll(".rv-tab").forEach((t) => { t.classList.toggle("is-on", t === tab); t.setAttribute("aria-selected", String(t === tab)); });
      rv.querySelectorAll("[data-panel]").forEach((p) => { p.hidden = p.dataset.panel !== tab.dataset.tab; });
    }));
    // 수정하기 → the page of that part; every requested fix stays outlined in blue
    const TARGET = { works: "upload", basic: "details", history: "provenance" };
    rv.querySelectorAll(".rv-fix").forEach((b) => b.addEventListener("click", () => {
      try {
        sessionStorage.setItem("mm_revise", "1");
        sessionStorage.setItem("mm_jump", b.dataset.fix);
        // resubmitting this rejected work turns it into 대기중 on the list
        sessionStorage.setItem("mm_flow", T($("rvTitle")).trim());
      } catch (e) {}
      go(TARGET[b.dataset.fix]);
    }));
  }

  /* ======================================================
     REVISION MODE — parts the reviewer asked to fix get a blue line
     (all three parts, whichever 수정하기 was used). Cleared when fixed.
     ====================================================== */
  (() => {
    let on = false, jump = null;
    try { on = sessionStorage.getItem("mm_revise") === "1"; jump = sessionStorage.getItem("mm_jump"); } catch (e) {}
    if (!on || !document.body.classList.contains("page-upload")) return;
    const FIX = {
      works:   { sec: ".up-sec--works", marks: ".drop" },                                        // 마스터본 · 전시본 · 열람본
      basic:   { sec: ".dt .up-sec",    marks: '.fld[data-key="artistEn"], .fld[data-key="year"]' }, // 영문 작가명 · 제작연도
      history: { sec: ".pv .up-sec",    marks: '[data-pv="acq"], [data-pv="exh"], [data-pv="own"], [data-pv="cons"]' } // 취득 · 전시 · 소장 · 보존
    };
    Object.values(FIX).forEach((f) => document.querySelectorAll(f.marks).forEach((el) => el.classList.add("is-fix")));
    const target = jump && FIX[jump] && document.querySelector(FIX[jump].sec);
    if (target) {
      try { sessionStorage.removeItem("mm_jump"); } catch (e) {}
      const main = document.querySelector(".ml-main");
      const place = () => { main.scrollTop = target.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop - 20; };
      place(); requestAnimationFrame(place);
    }
  })();
})();
