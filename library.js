// MATERIAL MEDIA STORAGE — My Library
(() => {
  const get = (k) => { try { return sessionStorage.getItem(k) || localStorage.getItem(k); } catch (e) { return null; } };

  // name typed on the archive login page; join date = the login time (YY.MM.DD)
  // a reload goes back to the default name (홍길동): the typed name only shows right after logging in
  const nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
  if (nav && nav.type === "reload") {
    try { sessionStorage.removeItem("mm_name"); localStorage.removeItem("mm_name"); } catch (e) {}
  }
  const name = get("mm_name");
  document.getElementById("libName").textContent = name || "홍길동";
  let at = Number(get("mm_login_at"));
  if (!at) { at = Date.now(); try { localStorage.setItem("mm_login_at", String(at)); } catch (e) {} }
  const d = new Date(at), p = (n) => String(n).padStart(2, "0");
  document.getElementById("libJoin").textContent = `${String(d.getFullYear()).slice(2)}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;

  // log out → storage home
  document.getElementById("libLogout").addEventListener("click", () => {
    try { sessionStorage.removeItem("mm_name"); sessionStorage.removeItem("mm_org"); localStorage.removeItem("mm_name"); localStorage.removeItem("mm_login_at"); } catch (e) {}
  });

  // card ↔ list
  const cards = document.getElementById("libCards"), list = document.getElementById("libList");
  const views = [...document.querySelectorAll("[data-view]")];
  const show = (v) => {
    cards.hidden = v !== "card"; list.hidden = v !== "list";
    views.forEach((b) => { const on = b.dataset.view === v; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", on); });
    try { sessionStorage.setItem("mm_lib_view", v); } catch (e) {}
  };
  views.forEach((b) => b.addEventListener("click", () => show(b.dataset.view)));
  try { const v = sessionStorage.getItem("mm_lib_view"); if (v) show(v); } catch (e) {}

  // a coloured card opens its detail page (only the ones that have one); buttons inside do their own thing
  document.querySelectorAll(".lib-card[data-href]").forEach((c) => {
    const go = () => (location.href = c.dataset.href);
    c.addEventListener("click", (e) => { if (!e.target.closest("button, a")) go(); });
    c.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
  });

  // extended: as soon as a way to pay is chosen, A4광장 → D-50 (not saved, so a reload shows 만료 again)
  const extend = () => {
    const due = document.querySelector("#rowA4 [data-due]"); if (due) due.textContent = "D-50";
    const btn = document.querySelector("#rowA4 [data-extend]");
    if (btn) { const v = document.createElement("button"); v.className = "lib-btn"; v.type = "button"; v.textContent = "열람하기"; btn.replaceWith(v); }
    const ext = document.getElementById("cardA4Extend");
    if (ext) { const d = document.createElement("span"); d.className = "lib-chip lib-chip--static"; d.textContent = "D-50"; ext.replaceWith(d); }
  };
  document.querySelectorAll("#pay [data-pay]").forEach((b) => b.addEventListener("click", extend));
  const done = document.getElementById("done");
  if (done) new MutationObserver(() => { if (!done.hidden) extend(); }).observe(done, { attributes: true, attributeFilter: ["hidden"] });

  // payment done here: "My Library" just closes the box
  document.querySelectorAll(".dn__lib").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault(); const box = a.closest(".sh"); box.classList.remove("is-open"); document.body.classList.remove("sh-lock"); setTimeout(() => (box.hidden = true), 250);
  }));
})();
