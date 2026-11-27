// MATERIAL MEDIA — KR / EN switch (top right of the header).
// Swaps the labels of buttons, tabs, tags and small UI text between Korean and English.
// Left as they are: the logos (MATERIAL MEDIA · STORAGE · ARCHIVE), the footer, the storage footer logo line,
// work titles, names and long texts. The choice is remembered (localStorage "mm_lang").
(() => {
  // [English, 한국어]
  const PAIRS = [
    // header
    ["About", "소개"], ["Collections", "소장품"], ["Archive", "아카이브"], ["My Studio", "마이 스튜디오"], ["Search", "검색"],
    ["Datacenter", "데이터센터"], ["Storage", "스토리지"], ["My Archive", "마이 아카이브"], ["Back", "뒤로"],
    // home / archive introduction links
    ["Learn more", "알아보기"], ["Go to Storage", "바로가기"], ["Museum", "미술관"], ["Artist", "작가"],
    // storage home + categories
    ["Highlights", "하이라이트"], ["New", "신소장품"], ["Rising", "주목 작품"],
    ["Moving image", "무빙 이미지"], ["Software-based art", "소프트웨어 기반 예술"], ["Network-based art", "네트워크 기반 예술"],
    ["Light & Kinetic", "라이트 & 키네틱"], ["Performance", "퍼포먼스"], ["Digital Image", "디지털 이미지"],
    ["Categories", "범주"], ["All", "전체"],
    // work detail
    ["Paid", "결제"], ["Purchased", "구매 완료"], ["Share", "공유"], ["Image", "이미지"],
    ["Related Collections", "관련 소장품"], ["Related Archive", "관련 아카이브"],
    ["Year", "제작연도"], ["Type", "유형"], ["Medium", "재료"], ["Duration", "시간"], ["Description", "작품설명"],
    ["Copy", "복사"], ["Copied", "복사됨"], ["Copyright Consent", "저작권 동의"], ["Agree", "동의"],
    // payment
    ["Collection", "작품 정보"], ["Total", "총액"], ["Viewing Period", "이용기간"], ["Payment Method", "결제 수단"],
    ["Interest-free installments", "무이자 할부 안내"], ["App Card", "앱카드 결제"], ["Quick and easy payment", "고민없이 쉽고 빠르게 결제하기"],
    ["Other Payment", "다른 결제"], ["Standard, SMS or login payment", "일반결제, SMS결제, 로그인결제"], ["Easy Pay", "간편결제"], ["Naver Pay", "네이버 페이"],
    ["Paying for the work.", "상품을 결제하는 중입니다."], ["Checking the payment details", "결제 정보를 확인하는 중이에요"],
    ["Getting the payment approved", "결제를 승인받는 중이에요"], ["Adding the work to My Studio", "마이 스튜디오에 작품을 담는 중이에요"],
    ["Your payment is complete.", "선택하신 작품 결제가 완료됐습니다."], ["You can watch the work in My Studio.", "결제하신 작품은 마이 스튜디오에서 감상하실 수 있습니다."],
    // storage archive lists
    ["Criticism", "비평"], ["Artist Criticism", "작가 비평"], ["Exhibition Criticism", "전시 비평"], ["Interview", "인터뷰"], ["Interviews", "인터뷰"],
    ["Search by title", "제목으로 검색"],
    // search
    ["Enter a title or an artist", "작품명, 작가명을 입력하세요"], ["Enter a search term", "검색어를 입력하세요"],
    ["The archive list is empty", "아카이브 목록이 비어 있습니다"], ["The interview list is empty", "인터뷰 목록이 비어 있습니다"], ["No media found", "미디어 목록이 비어 있습니다"],
    // my studio
    ["Continue Watching", "이어 보기"], ["My Videos", "내 영상"], ["Log out", "로그아웃"], ["Edit Profile", "개인정보 변경"], ["Delete Account", "회원탈퇴"],
    ["Position", "직책"], ["Joined", "가입일"], ["Not Free", "유료"], ["Free", "무료"], ["Private", "비공개"], ["End", "종료"], ["Expired", "만료"],
    ["Extend", "연장하기"], ["View", "열람하기"], ["Work", "작업"], ["Category", "분류"], ["Title", "작품명"], ["Name", "이름"], ["Access", "공개범위"], ["Due", "기한"],
    // phone notice (archive is PC only)
    ["Notice", "알림"], ["OK", "확인"], ["Home", "홈으로"], ["To Storage", "스토리지로"],
    ["Please use the archive on a PC", "아카이브는 PC 웹에서 이용해 주세요"],
    ["Registering works and filling in their details is done on a larger screen.", "작품 등록과 정보 기입은 넓은 화면에서 진행됩니다."], ["Please visit on a computer.", "컴퓨터로 접속해 주세요."],
    // archive (기입) pages: their English buttons
    ["Collections List", "소장품 목록"], ["Get Started", "시작"], ["Details", "상세 정보"], ["Provenance", "작품 이력"],
    ["Upload", "업로드"], ["Submit", "제출"], ["Save", "저장"], ["Next", "다음"], ["Review Result", "심사 결과"],
  ];
  const toKo = new Map(), toEn = new Map();
  PAIRS.forEach(([en, ko]) => { toKo.set(en, ko); toEn.set(ko, en); });

  // where labels live, and what is never touched
  const UI = "button, a, label, dt, .step-chip, .box-btn, .cl-chip, .wk-tag, .st-chip, .st-tag, .lib-chip, .lib-btn, .lib-row, .lib-info, .wk-dt, " +
             ".py, .dn, .sh__head, .sh__body, .tm__foot, .mn, .use-card__label, .link-btn, .sr-msg, .ar-empty, .ab-none";
  const SKIP = ".lnb > a.box-btn:first-child, .lnb-site, .footer__box, .footer__copy, .st-logo, .lang-sw, script, style, " +
               ".cl-item, .ar-row, .wk-card, .cr-text, .tm__body, .lib-card__t, .lib-card__bot, .wk-desc__txt";

  let lang = "en";
  try { lang = localStorage.getItem("mm_lang") === "ko" ? "ko" : "en"; } catch (e) {}

  const swapText = (node) => {
    const raw = node.nodeValue, t = raw.trim();
    if (!t) return;
    const map = lang === "ko" ? toKo : toEn;
    const to = map.get(t);
    if (to == null) return;
    const el = node.parentElement;
    if (!el || !el.closest(UI) || el.closest(SKIP)) return;
    node.nodeValue = raw.replace(t, to.trim());
  };
  const swapPh = (el) => {
    const ph = el.getAttribute("placeholder"); if (!ph) return;
    const map = lang === "ko" ? toKo : toEn;
    if (!el.dataset.ph) el.dataset.ph = ph;
    const to = map.get(ph.trim()); if (to) el.setAttribute("placeholder", to);
  };
  const run = (root) => {
    if (!root) return;
    if (root.nodeType === 3) { swapText(root); return; }
    if (root.nodeType !== 1) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) swapText(n);
    if (root.matches && root.matches("[placeholder]")) swapPh(root);
    root.querySelectorAll && root.querySelectorAll("[placeholder]").forEach(swapPh);
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
    run(document.body); mark();
  };

  const start = () => {
    addSwitch();
    set(lang);
    // text that the page writes later (boxes, messages, Paid → Purchased …)
    new MutationObserver((ms) => ms.forEach((m) => {
      if (m.type === "characterData") swapText(m.target);
      else m.addedNodes.forEach(run);
    })).observe(document.body, { childList: true, subtree: true, characterData: true });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
