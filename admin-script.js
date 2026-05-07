/* ============================================================
   HKU ITS - AI Use Case Intake - Admin Script
   ============================================================ */

const ALL_DATA_URL = "https://n8n-its-dev.hku.hk/webhook/get-all-ai-intakes";

let dataCache = null;
const chartInstances = new Map();
const IS_DEMO = new URLSearchParams(window.location.search).get("demo") === "1";

// ── Fetch all data ────────────────────────────────────────────
async function fetchAll() {
    if (IS_DEMO) {
        return typeof DEMO_DATA !== "undefined" ? DEMO_DATA : [];
    }
    try {
        const res = await fetch(ALL_DATA_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();
        const wrapper = Array.isArray(raw) ? raw[0] : raw;
        return wrapper?.value ?? wrapper?.d?.results ?? [];
    } catch (err) {
        console.error("fetchAll error:", err);
        return null;
    }
}

// ── Filter helpers ────────────────────────────────────────────
function getFilter(id) {
    const v = document.getElementById(id)?.value ?? "__all__";
    return v === "__all__" ? null : v;
}

function applyFilters(items) {
    const purpose    = getFilter("filterPurpose");
    const deployment = getFilter("filterDeployment");
    const pii        = getFilter("filterPII");
    const faculty    = getFilter("filterFaculty");

    return items.filter(item => {
        if (purpose    && item.Purpose       !== purpose)    return false;
        if (deployment && item.DeploymentType !== deployment) return false;
        if (pii        && item.InvolvesPII    !== pii)        return false;
        if (faculty    && item.Faculty_x002f_Department !== faculty) return false;
        return true;
    });
}

// ── Populate faculty filter ───────────────────────────────────
function populateFacultyFilter(items) {
    const sel = document.getElementById("filterFaculty");
    const current = sel.value;
    // Remove old options except first
    while (sel.options.length > 1) sel.remove(1);

    const faculties = [...new Set(
        items.map(i => i.Faculty_x002f_Department).filter(Boolean).sort()
    )];
    faculties.forEach(f => {
        const opt = document.createElement("option");
        opt.value = f;
        opt.textContent = f;
        sel.appendChild(opt);
    });
    if (current) sel.value = current;
}

// ── Stat cards ────────────────────────────────────────────────
function renderStats(items) {
    const total    = items.length;
    const tl       = items.filter(i => i.Purpose === "Teaching & Learning").length;
    const research = items.filter(i => i.Purpose === "Research").length;
    const admin    = items.filter(i => i.Purpose === "Admin").length;
    const cost     = items.reduce((s, i) => s + (Number(i.EstimatedCost_x0028_HKD_x0029_) || 0), 0);
    const pii      = items.filter(i => i.InvolvesPII === "Yes").length;

    document.getElementById("stat-total").textContent    = total;
    document.getElementById("stat-tl").textContent       = tl;
    document.getElementById("stat-research").textContent = research;
    document.getElementById("stat-admin").textContent    = admin;
    document.getElementById("stat-cost").textContent     = "HK$ " + cost.toLocaleString();
    document.getElementById("stat-pii").textContent      = pii;
}

// ── Chart helpers ─────────────────────────────────────────────
function renderChart(canvasId, type, labels, data, colors, onClickLabel) {
    if (chartInstances.has(canvasId)) {
        chartInstances.get(canvasId).destroy();
    }
    const ctx = document.getElementById(canvasId)?.getContext("2d");
    if (!ctx) return;

    const chart = new Chart(ctx, {
        type,
        data: {
            labels,
            datasets: [{ data, backgroundColor: colors, borderWidth: type === "bar" ? 0 : 2, borderColor: "#fff" }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: type === "doughnut" ? "right" : "none", labels: { font: { size: 11 }, padding: 10 } },
                tooltip: { callbacks: { label: ctx => ` ${ctx.parsed}` } }
            },
            scales: type === "bar" ? {
                x: { ticks: { font: { size: 10 } } },
                y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } } }
            } : undefined,
            onClick: onClickLabel ? (evt, elements) => {
                if (!elements.length) return;
                const label = labels[elements[0].index];
                onClickLabel(label);
            } : undefined
        }
    });
    chartInstances.set(canvasId, chart);
}

function countBy(items, key) {
    const map = {};
    items.forEach(i => {
        const v = (i[key] || "Unknown").trim();
        map[v] = (map[v] || 0) + 1;
    });
    return map;
}

function topN(map, n) {
    return Object.entries(map)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n);
}

// ── Charts ────────────────────────────────────────────────────
function renderCharts(items) {
    // Purpose doughnut
    const purposeMap = countBy(items, "Purpose");
    renderChart("purposeChart", "doughnut",
        Object.keys(purposeMap), Object.values(purposeMap),
        ["#c9a013", "#004b2c", "#1a5a8a"],
        lbl => setFilterAndRefresh("filterPurpose", lbl)
    );

    // Deployment doughnut
    const deployMap = countBy(items, "DeploymentType");
    renderChart("deploymentChart", "doughnut",
        Object.keys(deployMap), Object.values(deployMap),
        ["#003d2b", "#1a5a8a", "#8a5a1a"],
        lbl => setFilterAndRefresh("filterDeployment", lbl)
    );

    // PII doughnut
    const piiMap = countBy(items, "InvolvesPII");
    renderChart("piiChart", "doughnut",
        Object.keys(piiMap), Object.values(piiMap),
        ["#c0392b", "#27ae60"],
        lbl => setFilterAndRefresh("filterPII", lbl)
    );

    // Top AI Platforms bar
    const platformEntries = topN(countBy(items, "AIPlatform"), 8);
    renderChart("platformChart", "bar",
        platformEntries.map(e => e[0]), platformEntries.map(e => e[1]),
        "#004b2c"
    );

    // Top AI Tools bar
    const toolEntries = topN(countBy(items, "AITools"), 8);
    renderChart("toolsChart", "bar",
        toolEntries.map(e => e[0]), toolEntries.map(e => e[1]),
        "#c9a013"
    );

    // Faculty bar
    const facultyEntries = topN(countBy(items, "Faculty_x002f_Department"), 10);
    renderChart("facultyChart", "bar",
        facultyEntries.map(e => e[0]), facultyEntries.map(e => e[1]),
        "#1a5a8a"
    );
}

// ── Table ─────────────────────────────────────────────────────
function renderTable(items) {
    const body = document.getElementById("tableBody");
    body.innerHTML = "";

    document.getElementById("tableCount").textContent =
        `${items.length} record${items.length !== 1 ? "s" : ""} shown` +
        (IS_DEMO ? " (demo data)" : "");

    if (!items.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 9;
        td.className = "admin-table-msg";
        td.textContent = "No records match the current filters.";
        tr.appendChild(td);
        body.appendChild(tr);
        return;
    }

    items.forEach(item => {
        const tr = document.createElement("tr");
        const date = item.Created ? new Date(item.Created).toLocaleDateString() : "-";
        const cost = Number(item.EstimatedCost_x0028_HKD_x0029_) || 0;
        const piiVal = item.InvolvesPII || "-";

        [
            date,
            item.Title || "(Untitled)",
            item.Faculty_x002f_Department || "-",
            item.PersoninCharge_x0028_PIC_x0029_ || "-",
            item.Purpose || "-",
            item.DeploymentType || "-",
            item.AIPlatform || "-",
        ].forEach((text, idx) => {
            const td = document.createElement("td");
            td.textContent = text;
            if (idx === 7) td.className = "col-numeric";
            tr.appendChild(td);
        });

        // Cost
        const tdCost = document.createElement("td");
        tdCost.className = "col-numeric";
        tdCost.textContent = `HK$ ${cost.toLocaleString()}`;
        tr.appendChild(tdCost);

        // PII
        const tdPii = document.createElement("td");
        tdPii.textContent = piiVal;
        tdPii.className = piiVal === "Yes" ? "pii-yes" : piiVal === "No" ? "pii-no" : "";
        tr.appendChild(tdPii);

        body.appendChild(tr);
    });
}

// ── Filter → refresh ─────────────────────────────────────────
function setFilterAndRefresh(filterId, value) {
    const el = document.getElementById(filterId);
    if (el) el.value = value;
    document.getElementById("clearFiltersBtn").style.display = "inline-block";
    renderDashboard();
}

function renderDashboard() {
    if (!dataCache) return;
    const filtered = applyFilters(dataCache);
    renderStats(filtered);
    renderCharts(filtered);
    renderTable(filtered);

    // Show clear button if any filter is active
    const anyActive = ["filterPurpose","filterDeployment","filterPII","filterFaculty"]
        .some(id => getFilter(id) !== null);
    document.getElementById("clearFiltersBtn").style.display = anyActive ? "inline-block" : "none";
}

// ── Init ──────────────────────────────────────────────────────
async function init() {
    // Set loading state
    document.getElementById("tableBody").innerHTML =
        `<tr><td colspan="9" class="admin-table-msg">Loading data…</td></tr>`;

    dataCache = await fetchAll();

    if (!dataCache) {
        document.getElementById("tableBody").innerHTML =
            `<tr><td colspan="9" class="admin-table-msg is-error">Failed to load data. Check the n8n workflow.</td></tr>`;
        return;
    }

    populateFacultyFilter(dataCache);
    renderDashboard();
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("refreshBtn").addEventListener("click", async () => {
        dataCache = null;
        await init();
    });

    document.getElementById("clearFiltersBtn").addEventListener("click", () => {
        ["filterPurpose","filterDeployment","filterPII","filterFaculty"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = "__all__";
        });
        document.getElementById("clearFiltersBtn").style.display = "none";
        renderDashboard();
    });

    ["filterPurpose","filterDeployment","filterPII","filterFaculty"].forEach(id => {
        document.getElementById(id)?.addEventListener("change", renderDashboard);
    });

    init();
});
