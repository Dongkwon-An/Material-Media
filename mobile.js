// MATERIAL MEDIA — phone support (with mobile.css)
//  · the archive (기입) pages are PC only: on a phone, any link into them opens a notice instead,
//    and opening one directly shows the same notice with a way back
//  · the top-left logo's site menu opens with a tap (there is no hover on a phone)
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

  // ---------- logo site menu: first tap opens it, a tap elsewhere closes it ----------
  addEventListener("load", () => {
    const wrap = document.querySelector(".lnb-site");
    if (!wrap) return;
    const logo = wrap.querySelector(":scope > a.box-btn");
    let wasOpen = false;   // a tap also fires mouseenter (which opens the menu), so look at the state before the tap
    logo.addEventListener("touchstart", () => { wasOpen = wrap.classList.contains("is-open"); }, { passive: true, capture: true });
    logo.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") wasOpen = wrap.classList.contains("is-open"); }, true);
    logo.addEventListener("click", (e) => {
      if (!isPhone() || wasOpen) return;
      e.preventDefault(); e.stopPropagation();
      wrap.classList.add("is-open");
      wasOpen = true;
    }, true);
    document.addEventListener("click", (e) => { if (isPhone() && !wrap.contains(e.target)) wrap.classList.remove("is-open"); });
  });
})();
