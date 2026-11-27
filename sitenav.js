// Top-left logo: a ▾ button beside it opens a small menu to move between the three sites
// (MATERIAL MEDIA · ARCHIVE · STORAGE). Hovering the logo opens it too (mouse only).
// Used on the home, the archive introduction, the storage pages and the archive (기입) pages.
(() => {
  const logo = document.querySelector(".lnb > a.box-btn:first-child");
  if (!logo) return;
  const onArchive = !!logo.dataset.goto;                       // archive pages route through myarchive.js (leave warning)
  const file = location.pathname.split("/").pop() || "index.html";
  const here = /^myarchive-/.test(file) ? "archive" : (file === "index.html" || file === "archive.html") ? "media" : "storage";
  const SITES = [
    { key: "media",   label: "MATERIAL MEDIA", href: "index.html",          goto: "site-home" },
    { key: "archive", label: "ARCHIVE",        href: "myarchive-login.html", goto: "archive-home" },
    { key: "storage", label: "STORAGE",        href: "storage.html",         goto: "storage-home" },
  ];
  const wrap = document.createElement("div");
  wrap.className = "lnb-site";
  logo.parentNode.insertBefore(wrap, logo);
  wrap.appendChild(logo);

  // the ▾ button
  const blue = logo.classList.contains("box-btn--blue") ? " box-btn--blue" : "";
  const arrow = document.createElement("button");
  arrow.type = "button";
  arrow.className = "box-btn lnb-site__arrow" + blue;
  arrow.setAttribute("aria-label", "사이트 이동");
  arrow.setAttribute("aria-haspopup", "menu");
  arrow.setAttribute("aria-expanded", "false");
  arrow.innerHTML = '<svg viewBox="0 0 10 6" aria-hidden="true"><path d="M.5.5 5 5 9.5.5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';
  wrap.appendChild(arrow);

  const menu = document.createElement("div");
  menu.className = "lnb-site__menu";
  menu.setAttribute("role", "menu");
  SITES.forEach((s) => {
    const a = document.createElement("a");
    a.className = "box-btn" + blue + (s.key === here ? " is-current" : "");
    a.textContent = s.label; a.href = s.href; a.setAttribute("role", "menuitem");
    if (onArchive) a.dataset.goto = s.goto;
    if (s.key === here) a.setAttribute("aria-current", "page");
    menu.appendChild(a);
  });
  wrap.appendChild(menu);

  let hoverAt = 0;   // the mouse may have just opened it on the way to the ▾: a click then keeps it open
  const open = (on) => { wrap.classList.toggle("is-open", on); arrow.setAttribute("aria-expanded", on); };
  arrow.addEventListener("click", (e) => {
    e.preventDefault(); e.stopPropagation();
    const isOpen = wrap.classList.contains("is-open");
    open(!isOpen || performance.now() - hoverAt < 500);
  });
  document.addEventListener("click", (e) => { if (!wrap.contains(e.target)) open(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") open(false); });

  // mouse: hovering opens, with a small delay before closing so the pointer can travel into the menu
  if (matchMedia("(hover: hover)").matches) {
    let t;
    wrap.addEventListener("mouseenter", () => { clearTimeout(t); if (!wrap.classList.contains("is-open")) hoverAt = performance.now(); open(true); });
    wrap.addEventListener("mouseleave", () => { t = setTimeout(() => open(false), 180); });
  }
  wrap.addEventListener("focusout", (e) => { if (!wrap.contains(e.relatedTarget)) open(false); });
})();
