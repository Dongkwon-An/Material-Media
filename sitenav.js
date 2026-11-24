// Top-left logo: hovering it opens a small menu to move between the three sites
// (MATERIAL MEDIA · MATERIAL ARCHIVE · MATERIAL STORAGE). Used on the storage pages and the archive (기입) pages.
(() => {
  const logo = document.querySelector(".lnb > a.box-btn:first-child");
  if (!logo) return;
  const onArchive = !!logo.dataset.goto;                       // archive pages route through myarchive.js (leave warning)
  const here = /^myarchive-/.test(location.pathname.split("/").pop()) ? "archive" : "storage";
  const SITES = [
    { key: "media",   label: "MATERIAL MEDIA",   href: "index.html",          goto: "site-home" },
    { key: "archive", label: "ARCHIVE", href: "myarchive-login.html", goto: "archive-home" },
    { key: "storage", label: "STORAGE", href: "storage.html",         goto: "storage-home" },
  ];
  const wrap = document.createElement("div");
  wrap.className = "lnb-site";
  logo.parentNode.insertBefore(wrap, logo);
  wrap.appendChild(logo);
  const menu = document.createElement("div");
  menu.className = "lnb-site__menu";
  menu.setAttribute("role", "menu");
  SITES.forEach((s) => {
    const a = document.createElement("a");
    a.className = logo.className + (s.key === here ? " is-current" : "");
    a.textContent = s.label; a.href = s.href; a.setAttribute("role", "menuitem");
    if (onArchive) a.dataset.goto = s.goto;
    if (s.key === here) a.setAttribute("aria-current", "page");
    menu.appendChild(a);
  });
  wrap.appendChild(menu);
  // small delay before closing so the pointer can travel from the logo into the menu
  let t;
  wrap.addEventListener("mouseenter", () => { clearTimeout(t); wrap.classList.add("is-open"); });
  wrap.addEventListener("mouseleave", () => { t = setTimeout(() => wrap.classList.remove("is-open"), 180); });
  wrap.addEventListener("focusin", () => wrap.classList.add("is-open"));
  wrap.addEventListener("focusout", (e) => { if (!wrap.contains(e.relatedTarget)) wrap.classList.remove("is-open"); });
})();
