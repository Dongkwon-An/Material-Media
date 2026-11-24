// MATERIAL MEDIA STORAGE — Search: finds works from Storage home + Collections (storage-data.js)
(() => {
  const works = window.MM_WORKS || [];
  const form = document.getElementById("srForm"), input = document.getElementById("srInput");
  const scope = document.getElementById("srScope");
  const msg = document.getElementById("srMsg"), grid = document.getElementById("srGrid");

  document.querySelectorAll("[data-soon]").forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));
  const back = document.querySelector("[data-back]");
  back.addEventListener("click", (e) => { if (document.referrer && history.length > 1) { e.preventDefault(); history.back(); } });

  // spaces and letter case don't matter ("a4 광장" finds "A4광장")
  const norm = (s) => (s || "").toLowerCase().replace(/\s+/g, "");
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const render = (q) => {
    const k = norm(q);
    const sc = scope.dataset.value;
    // Archive · Interview have no data yet: say so right away
    if (sc !== "collections") { msg.textContent = sc === "archive" ? "아카이브 목록이 비어 있습니다" : "인터뷰 목록이 비어 있습니다"; msg.hidden = false; grid.hidden = true; grid.innerHTML = ""; return; }
    if (!k) { msg.textContent = "검색어를 입력하세요"; msg.hidden = false; grid.hidden = true; grid.innerHTML = ""; return; }
    // only Collections has data for now (Archive · Interview: nothing yet)
    const hits = scope.dataset.value !== "collections" ? [] : works.filter((w) => norm([w.title, w.artist, w.info, w.keys].join(" ")).includes(k));
    if (!hits.length) { msg.textContent = "미디어 목록이 비어 있습니다"; msg.hidden = false; grid.hidden = true; grid.innerHTML = ""; return; }
    msg.hidden = true; grid.hidden = false;
    grid.innerHTML = hits.map((w) => `
      <a class="cl-item" href="${w.href || "#"}"${w.href ? "" : " data-soon"}>
        <span class="cl-img" style="--w:${w.w}; --h:${w.h}"><img src="${w.img}" alt="${esc(w.artist)}, ${esc(w.title)}"></span>
        <p class="cl-cap"><span>${esc(w.title)}</span><span>${esc(w.artist)}</span></p>
      </a>`).join("");
    grid.querySelectorAll("[data-soon]").forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));
  };

  // the query lives in the address (?q=…) so reload / back keep the result
  const run = (q, push) => {
    const url = new URL(location.href);
    if (q.trim()) url.searchParams.set("q", q.trim()); else url.searchParams.delete("q");
    history.replaceState(null, "", url);   // Back still leaves the search page
    render(q);
  };
  // scope dropdown (like the My Archive pages)
  const sBtn = scope.querySelector(".sr-scope__btn");
  const openS = (on) => { scope.classList.toggle("is-open", on); sBtn.setAttribute("aria-expanded", on); };
  sBtn.addEventListener("click", () => openS(!scope.classList.contains("is-open")));
  scope.querySelectorAll("[data-v]").forEach((o) => o.addEventListener("click", () => {
    scope.dataset.value = o.dataset.v; sBtn.querySelector("span").textContent = o.textContent;
    scope.querySelectorAll("[data-v]").forEach((x) => x.classList.toggle("is-selected", x === o));
    openS(false); render(input.value);
  }));
  document.addEventListener("click", (e) => { if (!scope.contains(e.target)) openS(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") openS(false); });
  form.addEventListener("submit", (e) => { e.preventDefault(); run(input.value, true); });
  addEventListener("popstate", () => { const q = new URL(location.href).searchParams.get("q") || ""; input.value = q; render(q); });

  const q0 = new URL(location.href).searchParams.get("q") || "";
  input.value = q0; render(q0);
  if (!q0) input.focus();
})();
