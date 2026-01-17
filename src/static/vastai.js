  (function () {
    const SS_KEY_LAST_RENT_HOURLY = "vast_last_rent_hourly";
    const SS_KEY_LAST_RENT_GPUS = "vast_last_rent_gpus";
    const SS_KEY_LAST_RENT_FLOPS = "vast_last_rent_flops";

    function money(n) {
      try { return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
      catch (e) { return (Math.round(n * 100) / 100).toFixed(2); }
    }

    function intFmt(n) {
      try { return n.toLocaleString(undefined, { maximumFractionDigits: 0 }); }
      catch (e) { return String(Math.round(n)); }
    }

    function flopsFmt(n) {
      // Keep it simple: comma format with 2dp like your table uses.
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

    // ---- Status badge styling
    const statusBadges = document.querySelectorAll(".js-status-badge");
    for (const b of statusBadges) {
      const txt = b.textContent || "";
      const cls = classifyStatus(txt);
      b.classList.remove("is-good", "is-warn", "is-bad", "is-info", "is-muted");
      b.classList.add(cls);
      if (!b.querySelector(".dot")) {
        const dot = document.createElement("span");
        dot.className = "dot";
        b.prepend(dot);
      }
    }

    const runningHourlyWrap = document.getElementById("runningHourlyWrap");
    const runningHourlyText = document.getElementById("runningHourlyText");

    const selectedHourlyWrap = document.getElementById("selectedHourlyWrap");
    const selectedHourlyText = document.getElementById("selectedHourlyText");

    // ---- New badge containers (Selected GPUs/FLOPS + Last Rent GPUs/FLOPS)
    function ensureBadge(idWrap, idText, title, cls) {
      let wrap = document.getElementById(idWrap);
      let text = document.getElementById(idText);
      if (wrap && text) return { wrap, text };

      // Insert after Selected (or Running) badges
      const anchor =
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

    function setSS(key, val) {
      try { sessionStorage.setItem(key, String(val)); } catch (e) { }
    }

    function getSSFloat(key) {
      try {
        const v = sessionStorage.getItem(key);
        const n = parseFloat(v || "");
        return isNaN(n) ? 0 : n;
      } catch (e) { return 0; }
    }

    function getSSInt(key) {
      try {
        const v = sessionStorage.getItem(key);
        const n = parseInt(v || "", 10);
        return isNaN(n) ? 0 : n;
      } catch (e) { return 0; }
    }

    function ensureLastRentHourlyBadge() {
      return ensureBadge(
        "lastRentHourlyWrap",
        "lastRentHourlyText",
        "Last rent $/hr (persisted for this session)",
        "is-info"
      );
    }

    function ensureLastRentGpusBadge() {
      return ensureBadge(
        "lastRentGpusWrap",
        "lastRentGpusText",
        "Last rent GPUs (persisted for this session)",
        "is-info"
      );
    }

    function ensureLastRentFlopsBadge() {
      return ensureBadge(
        "lastRentFlopsWrap",
        "lastRentFlopsText",
        "Last rent total FLOPS (persisted for this session)",
        "is-info"
      );
    }

    function renderLastRentBadges() {
      // Hourly
      {
        const els = ensureLastRentHourlyBadge();
        const v = getSSFloat(SS_KEY_LAST_RENT_HOURLY);
        if (v > 0) {
          els.wrap.classList.remove("d-none");
          els.text.textContent = "Last rent: $" + money(v) + "/hr";
        } else {
          els.wrap.classList.add("d-none");
          els.text.textContent = "Last rent: $0.00/hr";
        }
      }

      // GPUs
      {
        const els = ensureLastRentGpusBadge();
        const g = getSSInt(SS_KEY_LAST_RENT_GPUS);
        if (g > 0) {
          els.wrap.classList.remove("d-none");
          els.text.textContent = "Last rent: " + intFmt(g) + " GPU" + (g === 1 ? "" : "s");
        } else {
          els.wrap.classList.add("d-none");
          els.text.textContent = "Last rent: 0 GPUs";
        }
      }

      // FLOPS
      {
        const els = ensureLastRentFlopsBadge();
        const f = getSSFloat(SS_KEY_LAST_RENT_FLOPS);
        if (f > 0) {
          els.wrap.classList.remove("d-none");
          els.text.textContent = "Last rent: " + flopsFmt(f) + " FLOPS";
        } else {
          els.wrap.classList.add("d-none");
          els.text.textContent = "Last rent: 0.00 FLOPS";
        }
      }
    }

    function updateRunningHourlyBadge() {
      if (!runningHourlyWrap || !runningHourlyText) return;

      const rows = document.querySelectorAll("#instancesTable tbody tr.instanceRow");
      let total = 0;
      let runningCount = 0;

      for (const r of rows) {
        const st = statusTextFromRow(r);
        if (!isRunningStatus(st)) continue;

        const cell = r.querySelector(".instanceCost");
        total += parseMoneyText(cell ? cell.textContent : "");
        runningCount++;
      }

      if (runningCount > 0 && total > 0) {
        runningHourlyWrap.classList.remove("d-none");
        runningHourlyText.textContent = "Running: $" + money(total) + "/hr";
      } else {
        runningHourlyWrap.classList.add("d-none");
        runningHourlyText.textContent = "Running: $0.00/hr";
      }
    }

    function ensureSelectedGpusBadge() {
      return ensureBadge(
        "selectedGpusWrap",
        "selectedGpusText",
        "Total selected GPUs from offers",
        "is-good"
      );
    }

    function ensureSelectedFlopsBadge() {
      return ensureBadge(
        "selectedFlopsWrap",
        "selectedFlopsText",
        "Total selected FLOPS from offers",
        "is-good"
      );
    }

    function getRowHourlyCostFromCheckbox(cb) {
      const row = cb.closest("tr.offerRow");
      if (!row) return 0;
      const v = parseFloat(row.dataset.hour || "");
      return isNaN(v) ? 0 : v;
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
      const v = parseFloat(row.dataset.flops || "0");
      return isNaN(v) ? 0 : v;
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

    function setLastRentMetrics(hourly, gpus, flops) {
      if (hourly && hourly > 0) setSS(SS_KEY_LAST_RENT_HOURLY, hourly);
      if (gpus && gpus > 0) setSS(SS_KEY_LAST_RENT_GPUS, gpus);
      if (flops && flops > 0) setSS(SS_KEY_LAST_RENT_FLOPS, flops);
      renderLastRentBadges();
    }

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

    function num(v) {
      const n = parseFloat(v);
      return isNaN(n) ? 0 : n;
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

    if (btnPrev) {
      btnPrev.addEventListener("click", function () {
        currentPage -= 1;
        applyPagination();
      });
    }

    if (btnNext) {
      btnNext.addEventListener("click", function () {
        currentPage += 1;
        applyPagination();
      });
    }

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

    if (sortSelect) {
      sortSelect.addEventListener("change", function () {
        sortRows(sortSelect.value);
      });
    }

    document.addEventListener("change", function (e) {
      if (e.target && e.target.classList && e.target.classList.contains("offerSelect")) {
        updateSelectedCount();
      }
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
        if (checks.length === 0) {
          e.preventDefault();
          return;
        }

        let lastTotalHr = 0;
        let lastTotalGpus = 0;
        let lastTotalFlops = 0;

        for (const cb of checks) {
          lastTotalHr += getRowHourlyCostFromCheckbox(cb);
          lastTotalGpus += getRowGpuCountFromCheckbox(cb);
          lastTotalFlops += getRowFlopsFromCheckbox(cb);
        }

        setLastRentMetrics(lastTotalHr, lastTotalGpus, lastTotalFlops);

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

    const singleRentForms = document.querySelectorAll('form input[name="action"][value="vastRent"]');
    for (const actionInput of singleRentForms) {
      const form = actionInput.closest("form");
      if (!form) continue;

      form.addEventListener("submit", function () {
        const row = form.closest("tr.offerRow");
        if (!row) return;

        const hr = parseFloat(row.dataset.hour || "");
        const ng = parseInt(row.dataset.ng || "0", 10);
        const fl = parseFloat(row.dataset.flops || "");

        setLastRentMetrics(
          (!isNaN(hr) && hr > 0) ? hr : 0,
          (!isNaN(ng) && ng > 0) ? ng : 0,
          (!isNaN(fl) && fl > 0) ? fl : 0
        );
      });
    }

    if (sortSelect) sortRows(sortSelect.value);
    else applyPagination();

    updateRunningHourlyBadge();
    updateSelectedCount();
    renderLastRentBadges();
  })();