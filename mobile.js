// MATERIAL MEDIA — phone support (with mobile.css)
//  · the archive (기입) pages are PC only: on a phone, any link into them opens a notice instead,
//    and opening one directly shows the same notice with a way back
//  · the top-left logo: ☰ opens a black full-screen menu (header buttons, the three sites, KR / EN)
(() => {
  const mq = matchMedia("(max-width: 767px)");
  const isPhone = () => mq.matches;
  const file = (href) => { try { return new URL(href, location.href).pathname.split("/").pop(); } catch (e) { return ""; } };
  const isArchive = (name) => /^myarchive-/.test(name);
  const onArchive = isArchive(file(location.href));

  // ---------- notice ----------
  let box = null;
  const build = () => {
    box = document.createElement("div");
    box.className = "mn";
    box.hidden = true;
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-labelledby", "mnTitle");
    box.innerHTML =
      '<div class="mn__box">' +
        '<div class="mn__head"><span class="mn__tag">Notice</span>' +
          (onArchive ? "" : '<button class="mn__x" type="button" aria-label="닫기">X</button>') +
        "</div>" +
        '<div class="mn__body">' +
          '<p class="mn__title" id="mnTitle">아카이브는 PC 웹에서 이용해 주세요</p>' +
          '<p class="mn__sub">작품 등록과 정보 기입은 넓은 화면에서 진행됩니다.<br>컴퓨터로 접속해 주세요.</p>' +
        "</div>" +
        '<div class="mn__foot">' +
          (onArchive
            ? '<a class="mn__btn" href="index.html">홈으로</a><a class="mn__btn" href="storage.html">스토리지로</a>'
            : '<button class="mn__btn mn__ok" type="button">확인</button>') +
        "</div>" +
      "</div>";
    document.body.appendChild(box);
    const close = () => { box.classList.remove("is-open"); setTimeout(() => { box.hidden = true; }, 250); document.documentElement.classList.remove("mn-lock"); };
    box.querySelectorAll(".mn__x, .mn__ok").forEach((b) => b.addEventListener("click", close));
    if (!onArchive) box.addEventListener("click", (e) => { if (e.target === box) close(); });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && !onArchive && !box.hidden) close(); });
  };
  const open = () => {
    if (!box) build();
    box.hidden = false;
    document.documentElement.classList.add("mn-lock");
    requestAnimationFrame(() => box.classList.add("is-open"));
  };

  // links into the archive pages (capture: before any other click handler)
  addEventListener("click", (e) => {
    if (!isPhone() || onArchive) return;
    const a = e.target.closest && e.target.closest("a[href]");
    if (!a || !isArchive(file(a.getAttribute("href")))) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    if (window.mmMenuClose) window.mmMenuClose();
    open();
  }, true);

  // opened directly on a phone: the archive page stays behind the notice
  const guard = () => { if (onArchive && isPhone()) open(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", guard); else guard();
  // the archive page's own leave-warning must not catch the notice buttons
  if (onArchive) addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest(".mn a[href]");
    if (!a) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    location.href = a.href;
  }, true);

  // ---------- payment (phone): 더보기 opens the rest of the banks instead of paying ----------
  addEventListener("click", (e) => {
    const more = isPhone() && e.target.closest && e.target.closest('.sh--pay .py__bank[aria-label="더보기"]');
    if (!more) return;
    const py = more.closest(".py");
    if (py.classList.contains("is-more")) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    py.classList.add("is-more");
  }, true);

  // ---------- top-left logo on a phone: MATERIAL MEDIA STORAGE goes to the storage home, the other logos do nothing
  //            (the ▾ beside it opens the site menu — sitenav.js) ----------
  addEventListener("click", (e) => {
    if (!isPhone() || !e.target.closest) return;
    const logo = e.target.closest(".lnb > a.box-btn:first-child, .lnb-site > a.box-btn");
    if (!logo) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    if (/STORAGE/.test(logo.textContent)) location.href = "storage.html";
  }, true);

  // ---------- phone menu: ☰ beside the logo opens a black full-screen menu
  //            (the header buttons in large type, then the three sites and KR / EN) ----------
  const buildMenu = () => {
    const lnb = document.querySelector(".lnb");
    const wrap = document.querySelector(".lnb-site");
    if (!lnb || !wrap || wrap.querySelector(".lnb-site__burger")) return;
    const logo = wrap.querySelector(":scope > a.box-btn");
    const burger = document.createElement("button");
    burger.type = "button";
    burger.className = "box-btn lnb-site__burger";
    burger.setAttribute("aria-label", "메뉴 열기");
    burger.setAttribute("aria-expanded", "false");
    burger.innerHTML = '<svg viewBox="0 0 16 12" aria-hidden="true"><path d="M0 1h16M0 6h16M0 11h16" stroke="currentColor" stroke-width="1.4"/></svg>';
    wrap.insertBefore(burger, logo.nextSibling);

    const pane = document.createElement("div");
    pane.className = "mm-menu";
    pane.hidden = true;
    pane.setAttribute("role", "dialog");
    pane.setAttribute("aria-modal", "true");
    pane.setAttribute("aria-label", "메뉴");
    document.body.appendChild(pane);

    const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const fill = () => {
      const lang = document.documentElement.dataset.lang || "en";
      const big = [...lnb.querySelectorAll(".lnb__nav > a")];
      const sites = [...wrap.querySelectorAll(".lnb-site__menu a")];
      const bigLinks = (big.length ? big : sites).map((a) =>
        `<a class="mm-menu__big${a.classList.contains("is-active") || a.classList.contains("is-current") ? " is-on" : ""}" href="${a.getAttribute("href")}">${esc(a.textContent.trim())}</a>`).join("");
      const siteLinks = big.length ? sites.map((a) =>
        `<a class="mm-menu__small${a.classList.contains("is-current") ? " is-on" : ""}" href="${a.getAttribute("href")}">${esc(a.textContent.trim())}</a>`).join("") : "";
      pane.innerHTML =
        `<div class="mm-menu__top"><button class="mm-menu__x" type="button" aria-label="메뉴 닫기"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 1l14 14M15 1 1 15" stroke="currentColor" stroke-width="1.4"/></svg></button>` +
        `<span class="mm-menu__name">${esc(logo.textContent.trim())}</span></div>` +
        `<nav class="mm-menu__bigs">${bigLinks}</nav>` +
        `<div class="mm-menu__smalls">${siteLinks}` +
        `<div class="mm-menu__lang"><button type="button" data-lang="ko" class="${lang === "ko" ? "is-on" : ""}">KR</button><span>/</span><button type="button" data-lang="en" class="${lang === "en" ? "is-on" : ""}">EN</button></div></div>`;
    };
    const openMenu = () => {
      fill(); pane.hidden = false; burger.setAttribute("aria-expanded", "true");
      document.documentElement.classList.add("mn-lock");
      requestAnimationFrame(() => pane.classList.add("is-open"));
    };
    const closeMenu = () => {
      if (pane.hidden) return;
      pane.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false");
      document.documentElement.classList.remove("mn-lock");
      setTimeout(() => { pane.hidden = true; }, 220);
    };
    window.mmMenuClose = closeMenu;
    burger.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); openMenu(); });
    pane.addEventListener("click", (e) => {
      if (e.target.closest(".mm-menu__x")) { closeMenu(); return; }
      const l = e.target.closest("[data-lang]");
      if (l) {   // the header's own KR / EN does the work (i18n.js); then the menu is written again in that language
        const sw = document.querySelector(`.lang-sw [data-lang="${l.dataset.lang}"]`);
        if (sw) sw.click();
        setTimeout(fill, 30);
        return;
      }
      if (e.target.closest("a[href]")) setTimeout(closeMenu, 0);
    });
    addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
    mq.addEventListener && mq.addEventListener("change", () => { if (!isPhone()) closeMenu(); });
  };
  addEventListener("load", buildMenu);
})();
