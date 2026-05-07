/* ============================================================
   HKU ITS — AI Use Case Intake Form — script.js
   ============================================================ */

const WEBHOOK_URL = "https://n8n-its-dev.hku.hk/webhook/ai-intake";

// ── Quill editor ─────────────────────────────────────────────
const businessCaseQuill = new Quill("#businessCaseEditor", {
    theme: "snow",
    placeholder: "Describe the AI use case, the business problem it solves, and the expected outcomes…",
    modules: {
        toolbar: [
            [{ header: [2, 3, false] }],
            ["bold", "italic", "underline"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["clean"],
        ],
    },
});

// ── Dynamic required/optional for Connection, Vendor, Model ─────────
const deploymentSelect = document.getElementById("deploymentType");

function updateFieldRequirements() {
    const val = deploymentSelect.value;
    // Connection: optional when Inhouse or Hybrid
    const connectionOptional = val === "Inhouse" || val === "Hybrid";
    // Vendor + Model: optional when SaaS or Hybrid
    const saasOptional = val === "SaaS" || val === "Hybrid";

    setFieldRequired("connection", !connectionOptional);
    setFieldRequired("vendor",     !saasOptional);
    setFieldRequired("model",      !saasOptional);
}

function setFieldRequired(id, required) {
    const input = document.getElementById(id);
    const reqMark = document.getElementById("req-" + id);
    const optNote = document.getElementById("opt-" + id);
    input.required = required;
    reqMark.style.display  = required ? "" : "none";
    optNote.style.display  = required ? "none" : "";
}

deploymentSelect.addEventListener("change", updateFieldRequirements);
updateFieldRequirements();

// ── Validation ───────────────────────────────────────────────
function validate() {
    const v = (id) => document.getElementById(id)?.value.trim() ?? "";
    const businessCaseText = businessCaseQuill.getText().trim();

    if (!v("faculty"))       return "Please enter the Faculty / Department.";
    if (!v("pic"))           return "Please enter the Person in Charge.";
    if (!v("email"))         return "Please enter your email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("email")))
                             return "Please enter a valid email address.";
    if (!v("projectName"))   return "Please enter a Project Name.";
    if (!businessCaseText)   return "Please enter the AI Use Case / Business Case Description.";
    if (!v("purpose"))       return "Please select a Purpose.";
    if (!v("targetAudience")) return "Please enter the Target Audience.";
    if (!v("projectDuration")) return "Please enter the Project Duration.";
    if (!v("dateOfLog"))     return "Please select a Date of Log.";
    if (!v("aiTools"))       return "Please enter the AI Tools used.";
    if (!v("aiPlatform"))    return "Please enter the AI Platform.";
    if (!v("deploymentType")) return "Please select Inhouse / SaaS.";
    if (!v("archServer"))    return "Please enter the Architecture — Server details.";

    const deploy = v("deploymentType");
    const connectionOptional = deploy === "Inhouse" || deploy === "Hybrid";
    const saasOptional       = deploy === "SaaS"    || deploy === "Hybrid";
    if (!connectionOptional && !v("connection")) return "Please enter the Connection details.";
    if (!saasOptional       && !v("vendor"))     return "Please enter the Vendor.";
    if (!saasOptional       && !v("model"))      return "Please enter the Model.";

    if (!v("pii"))           return "Please indicate whether PII is involved.";
    if (!v("typesOfData"))   return "Please describe the Types of Data.";

    return null;
}

// ── Show / hide error banner ──────────────────────────────────
function setError(msg) {
    const el = document.getElementById("formError");
    el.textContent = msg || "";
    el.style.display = msg ? "block" : "none";
    if (msg) el.scrollIntoView({ behavior: "smooth", block: "center" });
}

// ── Build payload ─────────────────────────────────────────────
function buildPayload() {
    const v = (id) => document.getElementById(id)?.value.trim() ?? "";

    return {
        Faculty:            v("faculty"),
        PIC:                v("pic"),
        Email:              v("email"),
        ProjectName:        v("projectName"),
        BusinessCase:       businessCaseQuill.root.innerHTML,
        Purpose:            v("purpose"),
        TargetAudience:     v("targetAudience"),
        ProjectDuration:    v("projectDuration"),
        DateOfLog:          v("dateOfLog") ? v("dateOfLog") + "T00:00:00Z" : null,
        AITools:            v("aiTools"),
        AIPlatform:         v("aiPlatform"),
        AISubscriptionPlan: v("aiSubscriptionPlan"),
        DeploymentType:     v("deploymentType"),
        Cost:               Number(v("cost")) || 0,
        ArchServer:         v("archServer"),
        Connection:         v("connection"),
        Vendor:             v("vendor"),
        Model:              v("model"),
        HardwareOwner:      v("hardwareOwner"),
        HPCType:            v("hpcType"),
        PII:                v("pii"),
        TypesOfData:        v("typesOfData"),
    };
}

// ── Submit handler ────────────────────────────────────────────
document.getElementById("intakeForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    setError(null);

    // Sync hidden field for Quill
    document.getElementById("businessCase").value =
        businessCaseQuill.root.innerHTML;

    const errorMsg = validate();
    if (errorMsg) { setError(errorMsg); return; }

    const btn = document.getElementById("submitBtn");
    btn.disabled = true;
    btn.classList.add("loading");

    try {
        const res = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(buildPayload()),
        });

        if (!res.ok) throw new Error(`Server returned ${res.status}`);

        // Show success overlay
        document.getElementById("successOverlay").hidden = false;

    } catch (err) {
        console.error(err);
        setError("Submission failed. Please try again or contact ITS if the problem persists.");
    } finally {
        btn.disabled = false;
        btn.classList.remove("loading");
    }
});

// ── Reset / Submit another ────────────────────────────────────
document.getElementById("resetBtn").addEventListener("click", () => {
    document.getElementById("successOverlay").hidden = true;
    document.getElementById("intakeForm").reset();
    businessCaseQuill.setContents([]);
    setError(null);
    updateFieldRequirements();
    window.scrollTo({ top: 0, behavior: "smooth" });
});

// ── Pre-fill today's date ─────────────────────────────────────
(function prefillDate() {
    const today = new Date().toISOString().slice(0, 10);
    const dateField = document.getElementById("dateOfLog");
    if (dateField && !dateField.value) dateField.value = today;
})();
