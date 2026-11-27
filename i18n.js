// MATERIAL MEDIA — KR / EN switch (top right of the header).
// EN: every Korean text of the site becomes English (i18n-dict.js) — except the criticism article bodies.
// KR: the English buttons, tabs and tags become Korean (PAIRS below); Highlights · New · Rising stay English.
// Never touched: the logos (MATERIAL MEDIA · STORAGE · ARCHIVE), the footer box and copyright line,
// and the storage footer logo line. The choice is remembered (localStorage "mm_lang").
(() => {
  // [English, 한국어] — the UI words that are English on the page and turn Korean in KR
  const PAIRS = [
    ["About", "소개"], ["Collections", "소장품"], ["Archive", "아카이브"], ["My Studio", "마이 스튜디오"], ["Search", "검색"],
    ["Datacenter", "데이터센터"], ["Storage", "스토리지"], ["My Archive", "마이 아카이브"], ["Back", "뒤로"],
    ["Moving image", "무빙 이미지"], ["Software-based art", "소프트웨어 기반 예술"], ["Network-based art", "네트워크 기반 예술"],
    ["Light & Kinetic", "라이트 & 키네틱"], ["Performance", "퍼포먼스"], ["Digital Image", "디지털 이미지"],
    ["Categories", "카테고리"], ["All", "전체"],
    ["Paid", "결제"], ["Purchased", "구매 완료"], ["Share", "공유"], ["Image", "이미지"],
    ["Related Collections", "관련 소장품"], ["Related Archive", "관련 아카이브"], ["Related Text", "관련 텍스트"], ["Text", "텍스트"],
    ["Copy", "복사"], ["Copied", "복사됨"], ["Copyright Consent", "저작권 동의"], ["Agree", "동의"], ["Collection", "작품 정보"], ["URL:", "URL:"],
    ["Criticism", "비평"], ["Artist Criticism", "작가 비평"], ["Exhibition Criticism", "전시 비평"], ["Interviews", "인터뷰"], ["Interview", "인터뷰"],
    ["Continue Watching", "이어 보기"], ["My Videos", "내 영상"], ["Not Free", "유료"], ["Free", "무료"], ["Private", "비공개"], ["End", "종료"], ["Extend", "연장하기"],
    ["Notice", "알림"],
    ["Collections List", "소장품 목록"], ["Get Started", "시작"], ["Details", "상세 정보"], ["Provenance", "작품 이력"],
    ["Upload", "업로드"], ["Submit", "제출"], ["Save", "저장"], ["Next", "다음"], ["Review Result", "심사 결과"],
    ["Leave", "나가기"], ["Continue", "계속 작성"], ["Final Submission", "최종 제출"], ["Loading", "불러오는 중"], ["State", "상태"],
  ];
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  const toKo = new Map(PAIRS.map(([en, ko]) => [en, ko]));
  const toEn = new Map();
  (window.MM_EN || []).forEach(([ko, en]) => toEn.set(norm(ko), en));
  window.mmEn = (s) => toEn.get(norm(s)) || "";          // for search: the English of a Korean title / name

  const SKIP = ".lnb > a.box-btn:first-child, .lnb-site, .mm-menu, .footer__box, .footer__copy, .st-logo, .lang-sw, .cr-text, script, style, noscript";

  let lang = "en";
  try { lang = localStorage.getItem("mm_lang") === "ko" ? "ko" : "en"; } catch (e) {}

  const orig = new WeakMap(), wrote = new WeakMap();      // text node → its own text / what we last wrote into it
  const tr = (o) => {
    const k = norm(o); if (!k) return null;
    return lang === "en" ? toEn.get(k) : toKo.get(k);
  };
  const doText = (node) => {
    const el = node.parentElement;
    if (!el || el.closest(SKIP)) return;
    const now = node.nodeValue;
    if (!orig.has(node) || wrote.get(node) !== now) orig.set(node, now);   // new, or rewritten by the page itself
    const o = orig.get(node), t = tr(o);
    const val = t == null ? o : (o.match(/^\s*/)[0] + t + o.match(/\s*$/)[0]);
    if (now !== val) node.nodeValue = val;
    wrote.set(node, val);
  };
  const ATTRS = ["placeholder", "data-tip"];
  const doAttrs = (el) => ATTRS.forEach((a) => {
    if (!el.hasAttribute(a) || el.closest(SKIP)) return;
    const key = "i18n" + a.replace(/-(\w)/g, (m, c) => c.toUpperCase()).replace(/^./, (c) => c.toUpperCase());
    const now = el.getAttribute(a);
    if (el.dataset[key] == null || el.dataset[key + "W"] !== now) el.dataset[key] = now;
    const o = el.dataset[key], t = tr(o), val = t == null ? o : t;
    if (now !== val) el.setAttribute(a, val);
    el.dataset[key + "W"] = val;
  });
  // text fields the page fills in (not what people type, not checkboxes)
  const doValue = (el) => {
    if (!(el.matches("textarea, input[type=text], input:not([type])")) || el.closest(SKIP) || document.activeElement === el) return;
    if (el.dataset.i18nV == null) { if (!el.value || document.activeElement === el) return; el.dataset.i18nV = el.value; }
    else if (el.value !== el.dataset.i18nVW) { el.dataset.i18nV = el.value; }
    const o = el.dataset.i18nV, t = tr(o), val = t == null ? o : t;
    if (el.value !== val) el.value = val;
    el.dataset.i18nVW = val;
  };
  const run = (root) => {
    if (!root) return;
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) doText(n);
    const els = [root, ...root.querySelectorAll("[placeholder], [data-tip], input, textarea")];
    els.forEach((el) => { if (el.nodeType === 1) { doAttrs(el); if (el.matches("input, textarea")) doValue(el); } });
  };
  // the browser tab title
  let titleOrig = document.title;
  const doTitle = () => {
    const parts = titleOrig.split(" — ");
    const t = parts.map((p) => tr(p) ?? p).join(" — ");
    if (document.title !== t) document.title = t;
  };

  // the text as the page wrote it, whatever the language shown (archive pages read titles and button names)
  window.mmOrig = (el) => {
    if (!el) return "";
    let s = ""; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) s += orig.has(n) && wrote.get(n) === n.nodeValue ? orig.get(n) : n.nodeValue;
    return s;
  };

  // the switch: KR | EN at the right end of the header
  const addSwitch = () => {
    const nav = document.querySelector(".lnb .lnb__nav");
    if (!nav || nav.querySelector(".lang-sw")) return;
    const blue = nav.querySelector(".box-btn--blue") ? " box-btn--blue" : "";
    const sw = document.createElement("div");
    sw.className = "lang-sw"; sw.setAttribute("role", "group"); sw.setAttribute("aria-label", "Language");
    sw.innerHTML = `<button type="button" class="box-btn${blue}" data-lang="ko">KR</button><button type="button" class="box-btn${blue}" data-lang="en">EN</button>`;
    nav.appendChild(sw);
    sw.addEventListener("click", (e) => {
      const b = e.target.closest("[data-lang]"); if (!b) return;
      e.preventDefault(); e.stopPropagation();
      set(b.dataset.lang);
    });
  };
  const mark = () => document.querySelectorAll(".lang-sw [data-lang]").forEach((b) => {
    const on = b.dataset.lang === lang; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", on);
  });
  const set = (l) => {
    lang = l === "ko" ? "ko" : "en";
    try { localStorage.setItem("mm_lang", lang); } catch (e) {}
    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;
    run(document.body); doTitle(); mark();
  };

  const start = () => {
    addSwitch();
    set(lang);
    // text the page writes later (boxes, lists, messages, Paid → Purchased …)
    new MutationObserver((ms) => ms.forEach((m) => {
      if (m.type === "characterData") doText(m.target);
      else if (m.type === "attributes") { if (ATTRS.includes(m.attributeName)) doAttrs(m.target); }
      else m.addedNodes.forEach(run);
    })).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    // fields the page fills in later (after a loading box, a choice in a dropdown …): look at them now and then
    setInterval(() => document.querySelectorAll("textarea, input[type=text], input:not([type])").forEach(doValue), 400);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
