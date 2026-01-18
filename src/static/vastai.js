(function () {
  // -------- Config
  const POLL_MS = 8000; // 8s
  const AJAX_URL = (function () {
    // Keep query params clean, always call same page with ajax flag
    const u = new URL(window.location.href);
    u.searchParams.set("ajax", "instances");
    return u.toString();
  })();

  // -------- Format helpers
  function money(n) {
    try { return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    catch (e) { return (Math.round(n * 100) / 100).toFixed(2); }
  }

  function intFmt(n) {
    try { return n.toLocaleString(undefined, { maximumFractionDigits: 0 }); }
    catch (e) { return String(Math.round(n)); }
  }

  function flopsFmt(n) {
    try { return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    catch (e) { return (Math.round(n * 100) / 100).toFixed(2); }
  }

  function parseMoneyText(s) {
    const t = (s || "").toString().trim();
    if (!t) return 0;
    const cleaned = t.replace(/[^0-9.+-]/g, "");
    const v = parseFloat(cleaned);
    return isNaN(v) ? 0 : v;
  }

  function num(v) {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  // -------- Status helpers
  function statusTextFromRow(row) {
    const b = row ? row.querySelector(".js-status-badge") : null;
    return b ? (b.textContent || "").trim() : "";
  }

  function isRunningStatus(text) {
    const t = (text || "").toLowerCase().trim();
    if (!t) return false;
    return (t.includes("running") || t.includes("active") || t.includes("started") || t === "on");
  }

  function classifyStatus(text) {
    const t = (text || "").toLowerCase().trim();
    if (!t) return "is-muted";
    if (t.includes("running") || t.includes("active") || t.includes("started") || t === "on") return "is-good";
    if (t.includes("stopping") || t.includes("starting") || t.includes("loading") || t.includes("boot")) return "is-info";
    if (t.includes("stopped") || t.includes("paused") || t.includes("offline") || t === "off") return "is-muted";
    if (t.includes("error") || t.includes("failed") || t.includes("dead") || t.includes("destroy")) return "is-bad";
    if (t.includes("warn") || t.includes("degraded")) return "is-warn";
    return "is-muted";
  }

  function styleStatusBadge(badgeEl, statusText) {
    if (!badgeEl) return;
    const cls = classifyStatus(statusText);
    badgeEl.classList.remove("is-good", "is-warn", "is-bad", "is-info", "is-muted");
    badgeEl.classList.add(cls);

    if (!badgeEl.querySelector(".dot")) {
      const dot = document.createElement("span");
      dot.className = "dot";
      badgeEl.prepend(dot);
    }
  }

  // -------- DOM refs
  const runningHourlyWrap = document.getElementById("runningHourlyWrap");
  const runningHourlyText = document.getElementById("runningHourlyText");

  const runningGpusWrap = document.getElementById("runningGpusWrap");
  const runningGpusText = document.getElementById("runningGpusText");

  const runningFlopsWrap = document.getElementById("runningFlopsWrap");
  const runningFlopsText = document.getElementById("runningFlopsText");

  const instanceCountEl = document.getElementById("instanceCount");

  const selectedHourlyWrap = document.getElementById("selectedHourlyWrap");
  const selectedHourlyText = document.getElementById("selectedHourlyText");

  // -------- Badge creation (Selected GPUs/FLOPS)
  function ensureBadge(idWrap, idText, title, cls, insertAfterWrapId) {
    let wrap = document.getElementById(idWrap);
    let text = document.getElementById(idText);
    if (wrap && text) return { wrap, text };

    const anchor =
      (insertAfterWrapId ? document.getElementById(insertAfterWrapId) : null) ||
      document.getElementById("selectedHourlyWrap") ||
      document.getElementById("runningHourlyWrap");

    wrap = document.createElement("span");
    wrap.id = idWrap;
    wrap.className = "d-none";

    const badge = document.createElement("span");
    badge.className = "vast-badge " + (cls || "is-info");
    badge.title = title || "";

    const dot = document.createElement("span");
    dot.className = "dot";

    text = document.createElement("span");
    text.id = idText;

    badge.appendChild(dot);
    badge.appendChild(text);
    wrap.appendChild(badge);

    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(wrap, anchor.nextSibling);
    }
    return { wrap, text };
  }

  function ensureSelectedGpusBadge() {
    return ensureBadge("selectedGpusWrap", "selectedGpusText", "Total selected GPUs from offers", "is-good", "selectedHourlyWrap");
  }

  function ensureSelectedFlopsBadge() {
    return ensureBadge("selectedFlopsWrap", "selectedFlopsText", "Total selected FLOPS from offers", "is-good", "selectedGpusWrap");
  }

  // -------- Offers UI
  const searchForm = document.getElementById("vastSearchForm");
  if (searchForm) {
    searchForm.addEventListener("submit", function () {
      const input = searchForm.querySelector('input[name="gpu_names_csv"]');
      if (!input) return;

      const csv = (input.value || "").trim();
      if (!csv) return;

      const names = csv.split(",").map(v => v.trim()).filter(v => v.length > 0);
      for (const n of names) {
        const h = document.createElement("input");
        h.type = "hidden";
        h.name = "gpu_names[]";
        h.value = n;
        searchForm.appendChild(h);
      }
    });
  }

  const filter = document.getElementById("offerFilter");
  const sortSelect = document.getElementById("offerSort");
  const selectAll = document.getElementById("selectAllOffers");
  const selectedCount = document.getElementById("selectedCount");
  const btnRentSelected = document.getElementById("btnRentSelected");
  const rentMultiForm = document.getElementById("vastRentMultiForm");

  const btnPrev = document.getElementById("offerPrev");
  const btnNext = document.getElementById("offerNext");
  const pageText = document.getElementById("offerPageText");
  const rangeText = document.getElementById("offerRangeText");
  const pageSizeSel = document.getElementById("offerPageSize");

  let currentPage = 1;
  let pageSize = 50;

  function getOfferRows() {
    return Array.from(document.querySelectorAll("#offersTable tbody tr.offerRow"));
  }

  function getTbody() {
    return document.querySelector("#offersTable tbody");
  }

  function isRowVisible(row) {
    return row && row.style.display !== "none";
  }

  function getVisibleRows() {
    return getOfferRows().filter(isRowVisible);
  }

  function clampPage() {
    const vis = getVisibleRows();
    const total = vis.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    return { total, totalPages, vis };
  }

  function applyPagination() {
    const { total, totalPages, vis } = clampPage();

    for (const r of vis) r.classList.add("d-none");

    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = Math.min(total, startIdx + pageSize);
    for (let i = startIdx; i < endIdx; i++) {
      if (vis[i]) vis[i].classList.remove("d-none");
    }

    if (pageText) pageText.textContent = "Page " + currentPage + " / " + totalPages;

    if (rangeText) {
      if (total === 0) rangeText.textContent = "Showing 0–0 of 0";
      else rangeText.textContent = "Showing " + (startIdx + 1) + "–" + endIdx + " of " + total;
    }

    if (btnPrev) btnPrev.disabled = (currentPage <= 1);
    if (btnNext) btnNext.disabled = (currentPage >= totalPages);

    if (selectAll) selectAll.checked = false;
    updateSelectedCount();
  }

  function resetToFirstPage() {
    currentPage = 1;
    applyPagination();
  }

  function getRowHourlyCostFromCheckbox(cb) {
    const row = cb.closest("tr.offerRow");
    if (!row) return 0;
    return num(row.dataset.hour || "0");
  }

  function getRowGpuCountFromCheckbox(cb) {
    const row = cb.closest("tr.offerRow");
    if (!row) return 0;
    const v = parseInt(row.dataset.ng || "0", 10);
    return isNaN(v) ? 0 : v;
  }

  function getRowFlopsFromCheckbox(cb) {
    const row = cb.closest("tr.offerRow");
    if (!row) return 0;
    return num(row.dataset.flops || "0");
  }

  function updateSelectedHourlyBadge() {
    if (!selectedHourlyWrap || !selectedHourlyText) return;

    const checks = document.querySelectorAll(".offerSelect:checked");
    let total = 0;
    for (const cb of checks) total += getRowHourlyCostFromCheckbox(cb);

    if (checks.length === 0 || total <= 0) {
      selectedHourlyWrap.classList.add("d-none");
      selectedHourlyText.textContent = "Selected: $0.00/hr";
      return;
    }

    selectedHourlyWrap.classList.remove("d-none");
    selectedHourlyText.textContent = "Selected: $" + money(total) + "/hr";
  }

  function updateSelectedGpusBadge() {
    const els = ensureSelectedGpusBadge();
    const checks = document.querySelectorAll(".offerSelect:checked");

    let gpus = 0;
    for (const cb of checks) gpus += getRowGpuCountFromCheckbox(cb);

    if (checks.length === 0 || gpus <= 0) {
      els.wrap.classList.add("d-none");
      els.text.textContent = "Selected: 0 GPUs";
      return;
    }

    els.wrap.classList.remove("d-none");
    els.text.textContent = "Selected: " + intFmt(gpus) + " GPU" + (gpus === 1 ? "" : "s");
  }

  function updateSelectedFlopsBadge() {
    const els = ensureSelectedFlopsBadge();
    const checks = document.querySelectorAll(".offerSelect:checked");

    let flops = 0;
    for (const cb of checks) flops += getRowFlopsFromCheckbox(cb);

    if (checks.length === 0 || flops <= 0) {
      els.wrap.classList.add("d-none");
      els.text.textContent = "Selected: 0.00 FLOPS";
      return;
    }

    els.wrap.classList.remove("d-none");
    els.text.textContent = "Selected: " + flopsFmt(flops) + " FLOPS";
  }

  function updateSelectedBadges() {
    updateSelectedHourlyBadge();
    updateSelectedGpusBadge();
    updateSelectedFlopsBadge();
  }

  function updateSelectedCount() {
    const checks = document.querySelectorAll(".offerSelect:checked");
    const n = checks.length;
    if (selectedCount) selectedCount.textContent = n + " selected";
    if (btnRentSelected) btnRentSelected.disabled = (n === 0);
    updateSelectedBadges();
  }

  function sortRows(mode) {
    const tbody = getTbody();
    if (!tbody) return;

    const rows = getOfferRows();

    function cmpNum(a, b, key, dir) {
      const av = num(a.dataset[key]);
      const bv = num(b.dataset[key]);
      return dir === "asc" ? (av - bv) : (bv - av);
    }

    function cmpStr(a, b, key, dir) {
      const av = (a.dataset[key] || "").toLowerCase();
      const bv = (b.dataset[key] || "").toLowerCase();
      if (av < bv) return dir === "asc" ? -1 : 1;
      if (av > bv) return dir === "asc" ? 1 : -1;
      return 0;
    }

    rows.sort(function (a, b) {
      switch (mode) {
        case "fpd_desc": return cmpNum(a, b, "fpd", "desc");
        case "hour_asc": return cmpNum(a, b, "hour", "asc");
        case "hour_desc": return cmpNum(a, b, "hour", "desc");
        case "flops_desc": return cmpNum(a, b, "flops", "desc");
        case "rel_desc": return cmpNum(a, b, "rel", "desc");
        case "up_desc": return cmpNum(a, b, "up", "desc");
        case "down_desc": return cmpNum(a, b, "down", "desc");
        case "ng_asc": return cmpNum(a, b, "ng", "asc");
        case "ng_desc": return cmpNum(a, b, "ng", "desc");
        default: return cmpStr(a, b, "gpu", "asc");
      }
    });

    for (const r of rows) tbody.appendChild(r);
    applyPagination();
  }

  if (pageSizeSel) {
    const v = parseInt(pageSizeSel.value, 10);
    if (!isNaN(v) && v > 0) pageSize = v;

    pageSizeSel.addEventListener("change", function () {
      const nv = parseInt(pageSizeSel.value, 10);
      if (!isNaN(nv) && nv > 0) pageSize = nv;
      resetToFirstPage();
    });
  }

  if (btnPrev) btnPrev.addEventListener("click", function () { currentPage -= 1; applyPagination(); });
  if (btnNext) btnNext.addEventListener("click", function () { currentPage += 1; applyPagination(); });

  if (filter) {
    filter.addEventListener("input", function () {
      const q = (filter.value || "").toLowerCase().trim();
      const rows = getOfferRows();

      for (const r of rows) {
        const gpuCell = r.querySelector(".offerGpuName");
        const text = gpuCell ? (gpuCell.textContent || "").toLowerCase() : "";
        r.style.display = (q === "" || text.indexOf(q) !== -1) ? "" : "none";
        r.classList.remove("d-none");
      }
      resetToFirstPage();
    });
  }

  if (sortSelect) sortSelect.addEventListener("change", function () { sortRows(sortSelect.value); });

  document.addEventListener("change", function (e) {
    if (e.target && e.target.classList && e.target.classList.contains("offerSelect")) updateSelectedCount();
  });

  if (selectAll) {
    selectAll.addEventListener("change", function () {
      const rows = getOfferRows();
      for (const r of rows) {
        if (!isRowVisible(r)) continue;
        if (r.classList.contains("d-none")) continue;
        const cb = r.querySelector(".offerSelect");
        if (cb) cb.checked = selectAll.checked;
      }
      updateSelectedCount();
    });
  }

  if (rentMultiForm) {
    rentMultiForm.addEventListener("submit", function (e) {
      const checks = document.querySelectorAll(".offerSelect:checked");
      if (checks.length === 0) { e.preventDefault(); return; }

      for (const c of checks) {
        const h = document.createElement("input");
        h.type = "hidden";
        h.name = "ask_contract_ids[]";
        h.value = c.value;
        rentMultiForm.appendChild(h);
      }

      if (!confirm("Rent " + checks.length + " selected offer(s) on Vast.ai?")) e.preventDefault();
    });
  }

  // -------- Running badges (instances table)
  function getInstanceRows() {
    return Array.from(document.querySelectorAll("#instancesTable tbody tr.instanceRow"));
  }

  function getInstanceGpus(row) {
    if (!row) return 0;

    const d = parseInt(row.dataset.ng || "", 10);
    if (!isNaN(d)) return d;

    const cell = row.querySelector(".js-instance-gpus");
    const v = cell ? parseInt((cell.textContent || "").trim(), 10) : 0;
    return isNaN(v) ? 0 : v;
  }

  function getInstanceFlops(row) {
    if (!row) return 0;
    return num(row.dataset.flops || "0");
  }

  function updateRunningHourlyBadge() {
    if (!runningHourlyWrap || !runningHourlyText) return;

    const rows = getInstanceRows();
    let totalHr = 0;
    let runningCount = 0;

    for (const r of rows) {
      if (!isRunningStatus(statusTextFromRow(r))) continue;
      const cell = r.querySelector(".instanceCost");
      totalHr += parseMoneyText(cell ? cell.textContent : "");
      runningCount++;
    }

    if (runningCount > 0) {
      runningHourlyWrap.classList.remove("d-none");
      runningHourlyText.textContent = "Running: $" + money(totalHr) + "/hr";
    } else {
      runningHourlyWrap.classList.add("d-none");
      runningHourlyText.textContent = "Running: $0.00/hr";
    }
  }

  function updateRunningGpusBadge() {
    if (!runningGpusWrap || !runningGpusText) return;

    const rows = getInstanceRows();
    let totalGpus = 0;
    let runningCount = 0;

    for (const r of rows) {
      if (!isRunningStatus(statusTextFromRow(r))) continue;
      totalGpus += getInstanceGpus(r);
      runningCount++;
    }

    if (runningCount > 0) {
      runningGpusWrap.classList.remove("d-none");
      runningGpusText.textContent = "Running: " + intFmt(totalGpus) + " GPU" + (totalGpus === 1 ? "" : "s");
    } else {
      runningGpusWrap.classList.add("d-none");
      runningGpusText.textContent = "Running: 0 GPUs";
    }
  }

  function updateRunningFlopsBadge() {
    if (!runningFlopsWrap || !runningFlopsText) return;

    const rows = getInstanceRows();
    let totalFlops = 0;
    let runningCount = 0;

    for (const r of rows) {
      if (!isRunningStatus(statusTextFromRow(r))) continue;
      totalFlops += getInstanceFlops(r);
      runningCount++;
    }

    if (runningCount > 0) {
      runningFlopsWrap.classList.remove("d-none");
      runningFlopsText.textContent = "Running: " + flopsFmt(totalFlops) + " FLOPS";
    } else {
      runningFlopsWrap.classList.add("d-none");
      runningFlopsText.textContent = "Running: 0.00 FLOPS";
    }
  }

  function updateRunningBadges() {
    updateRunningHourlyBadge();
    updateRunningGpusBadge();
    updateRunningFlopsBadge();
  }

  // -------- Live updating: instances table
  function getCsrfToken() {
    const el = document.querySelector('input[name="csrf"]');
    return el ? (el.value || "") : "";
  }

  function instancesTbody() {
    return document.querySelector("#instancesTable tbody");
  }

  function rowIdFromDom(row) {
    // Prefer data-id if you add it; fallback to first <code> in the row
    const did = (row && row.dataset && row.dataset.id) ? String(row.dataset.id) : "";
    if (did) return did;

    const code = row ? row.querySelector("td code") : null;
    return code ? (code.textContent || "").trim() : "";
  }

  function findRowByInstanceId(id) {
    if (!id) return null;
    const rows = getInstanceRows();
    for (const r of rows) {
      if (rowIdFromDom(r) === String(id)) return r;
    }
    return null;
  }

  function setCellText(row, selector, value) {
    const el = row.querySelector(selector);
    if (!el) return;
    el.textContent = value == null ? "" : String(value);
  }

  function setCellHtml(row, selector, html) {
    const el = row.querySelector(selector);
    if (!el) return;
    el.innerHTML = html;
  }

  function buildIpCell(publicIp, sshPort) {
    if (!publicIp) return "";
    const ip = String(publicIp);
    const port = String(sshPort || "");
    const txt = port ? (ip + ":" + port) : ip;
    return "<code>" + escapeHtml(txt) + "</code>";
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function updateInstanceRow(row, inst) {
    // dataset
    if (row && row.dataset) {
      row.dataset.ng = inst.num_gpus || "0";
      row.dataset.flops = inst.total_flops_raw || "0";
      if (inst.id) row.dataset.id = String(inst.id);
    }

    // Label
    setCellText(row, "td.col-label", inst.label || "");

    // Status
    const badge = row.querySelector(".js-status-badge");
    if (badge) {
      badge.textContent = inst.status || "";
      styleStatusBadge(badge, inst.status || "");
    }

    // GPU name
    // Column order: ID, Label, Status, GPU, GPUs, $/hr, IP:SSH, Started, Actions
    const tds = row.querySelectorAll("td");
    if (tds && tds.length >= 9) {
      tds[3].textContent = inst.gpu_name || "";
    }

    // GPUs cell
    const gCell = row.querySelector(".js-instance-gpus");
    if (gCell) gCell.textContent = inst.num_gpus || "";

    // Cost cell
    const cCell = row.querySelector(".instanceCost");
    if (cCell) cCell.textContent = inst.cost_per_hour || "";

    // IP cell
    if (tds && tds.length >= 9) {
      tds[6].innerHTML = buildIpCell(inst.public_ip || "", inst.ssh_port || "");
    }

    // Started cell
    if (tds && tds.length >= 9) {
      tds[7].innerHTML = inst.start ? ("<code>" + escapeHtml(inst.start) + "</code>") : "";
    }
  }

  function createInstanceRow(inst) {
    const csrf = getCsrfToken();
    const id = String(inst.id || "");
    const flops = String(inst.total_flops_raw || "0");
    const ng = String(inst.num_gpus || "0");

    const tr = document.createElement("tr");
    tr.className = "instanceRow";
    tr.dataset.flops = flops;
    tr.dataset.ng = ng;
    tr.dataset.id = id;

    tr.innerHTML =
      '<td><code>' + escapeHtml(id) + '</code></td>' +
      '<td class="col-label">' + escapeHtml(inst.label || "") + "</td>" +
      '<td><span class="vast-badge is-muted js-status-badge">' + escapeHtml(inst.status || "") + "</span></td>" +
      "<td>" + escapeHtml(inst.gpu_name || "") + "</td>" +
      '<td class="text-center js-instance-gpus">' + escapeHtml(ng) + "</td>" +
      '<td class="text-end instanceCost">' + escapeHtml(inst.cost_per_hour || "") + "</td>" +
      "<td>" + buildIpCell(inst.public_ip || "", inst.ssh_port || "") + "</td>" +
      '<td>' + (inst.start ? ("<code>" + escapeHtml(inst.start) + "</code>") : "") + "</td>" +
      '<td style="white-space: nowrap;">' +
      '  <div class="d-inline-flex align-items-center gap-1" role="group" aria-label="Instance actions">' +
      '    <form method="POST" action="" class="m-0">' +
      '      <input type="hidden" name="csrf" value="' + escapeHtml(csrf) + '">' +
      '      <input type="hidden" name="action" value="vastStart">' +
      '      <input type="hidden" name="instance_id" value="' + escapeHtml(id) + '">' +
      '      <button type="submit" class="btn btn-secondary btn-sm">Start</button>' +
      "    </form>" +
      '    <form method="POST" action="" class="m-0">' +
      '      <input type="hidden" name="csrf" value="' + escapeHtml(csrf) + '">' +
      '      <input type="hidden" name="action" value="vastStop">' +
      '      <input type="hidden" name="instance_id" value="' + escapeHtml(id) + '">' +
      '      <button type="submit" class="btn btn-warning btn-sm">Stop</button>' +
      "    </form>" +
      '    <form method="POST" action="" class="m-0" onsubmit="return confirm(\'Destroy this instance on Vast.ai? This cannot be undone.\');">' +
      '      <input type="hidden" name="csrf" value="' + escapeHtml(csrf) + '">' +
      '      <input type="hidden" name="action" value="vastDestroy">' +
      '      <input type="hidden" name="instance_id" value="' + escapeHtml(id) + '">' +
      '      <button type="submit" class="btn btn-danger btn-sm">Destroy</button>' +
      "    </form>" +
      "  </div>" +
      "</td>";

    // Style status badge + ensure dot
    const badge = tr.querySelector(".js-status-badge");
    if (badge) {
      styleStatusBadge(badge, inst.status || "");
    }

    return tr;
  }

  function reconcileInstances(instances) {
    const tbody = instancesTbody();
    if (!tbody) return;

    const incoming = new Map();
    for (const inst of (instances || [])) {
      const id = String(inst.id || "").trim();
      if (!id) continue;
      incoming.set(id, inst);
    }

    // Update existing, mark seen
    const seen = new Set();
    const currentRows = Array.from(tbody.querySelectorAll("tr.instanceRow"));

    for (const row of currentRows) {
      const id = rowIdFromDom(row);
      if (!id) continue;

      const inst = incoming.get(id);
      if (!inst) continue;

      updateInstanceRow(row, inst);
      seen.add(id);
    }

    // Add new rows
    for (const [id, inst] of incoming.entries()) {
      if (seen.has(id)) continue;
      tbody.appendChild(createInstanceRow(inst));
    }

    // Remove rows that are no longer present (keep the "No instances loaded" row if it exists)
    const afterRows = Array.from(tbody.querySelectorAll("tr.instanceRow"));
    for (const row of afterRows) {
      const id = rowIdFromDom(row);
      if (!id) continue;
      if (!incoming.has(id)) row.remove();
    }

    // Handle empty state row
    const anyInstances = tbody.querySelectorAll("tr.instanceRow").length > 0;
    const emptyRow = tbody.querySelector("tr:not(.instanceRow)");
    if (!anyInstances) {
      if (!emptyRow) {
        const tr = document.createElement("tr");
        tr.innerHTML = '<td colspan="9" class="text-muted">No instances loaded.</td>';
        tbody.appendChild(tr);
      }
    } else {
      if (emptyRow && emptyRow.querySelector('td[colspan="9"]')) {
        emptyRow.remove();
      }
    }

    // Update row count
    if (instanceCountEl) {
      instanceCountEl.textContent = String(incoming.size);
    }

    // Recompute running totals
    updateRunningBadges();
  }

  async function pollInstancesOnce() {
    try {
      const res = await fetch(AJAX_URL, {
        method: "GET",
        headers: { "Accept": "application/json" },
        cache: "no-store",
        credentials: "same-origin"
      });

      if (!res.ok) return;

      const data = await res.json();
      if (!data || data.ok !== 1) return;

      reconcileInstances(data.instances || []);
    } catch (e) {
      // Silent: do not spam UI
    }
  }

  function startPolling() {
    // Only poll if instances table exists on page
    if (!document.getElementById("instancesTable")) return;

    // First run quickly, then interval
    pollInstancesOnce();
    setInterval(pollInstancesOnce, POLL_MS);
  }

  // -------- Initial status badge styling for anything already on page
  (function initStatusBadges() {
    const statusBadges = document.querySelectorAll(".js-status-badge");
    for (const b of statusBadges) {
      const txt = b.textContent || "";
      styleStatusBadge(b, txt);
    }
  })();

  // -------- Init paging + badges
  if (sortSelect) sortRows(sortSelect.value);
  else applyPagination();

  updateRunningBadges();
  updateSelectedCount();

  // -------- Start polling
  startPolling();
})();
