// MATERIAL MEDIA STORAGE — Archive lists: Criticism · Exhibition Criticism · Interviews
(() => {
  document.querySelectorAll("[data-soon]").forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  const tabs = [...document.querySelectorAll("[data-tab]")];
  const lists = [...document.querySelectorAll("[data-list]")];
  const input = document.getElementById("arInput"), empty = document.getElementById("arEmpty");
  const pages = [...document.querySelectorAll(".cl-page")];
  let cur = "criticism";

  // the box on the right finds titles in the list that is open (spaces / case don't matter)
  const norm = (s) => (s || "").toLowerCase().replace(/\s+/g, "");
  const filter = () => {
    const k = norm(input.value); let n = 0;
    lists.forEach((l) => { if (l.dataset.list !== cur) return; l.querySelectorAll("li").forEach((li) => { const hit = !k || norm(li.textContent).includes(k); li.hidden = !hit; if (hit) n++; }); });
    empty.hidden = n > 0;
  };

  const show = (t) => {
    cur = t;
    tabs.forEach((b) => { const on = b.dataset.tab === t; b.classList.toggle("is-active", on); b.setAttribute("aria-pressed", on); });
    lists.forEach((l) => (l.hidden = l.dataset.list !== t));
    pages.forEach((p, i) => { p.classList.toggle("is-active", i === 0); p.toggleAttribute("aria-current", i === 0); });
    history.replaceState(null, "", "#" + t);
    filter();
  };
  tabs.forEach((b) => b.addEventListener("click", () => show(b.dataset.tab)));
  input.addEventListener("input", filter);
  input.closest("label").addEventListener("submit", (e) => e.preventDefault());

  // pagination: clickable, only the number colour changes until the next pages exist
  pages.forEach((b) => b.addEventListener("click", () => {
    pages.forEach((p) => { p.classList.toggle("is-active", p === b); p.removeAttribute("aria-current"); });
    b.setAttribute("aria-current", "page");
  }));

  const h = location.hash.slice(1);
  show(tabs.some((b) => b.dataset.tab === h) ? h : "criticism");
})();
