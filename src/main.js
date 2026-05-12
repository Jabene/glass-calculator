import { planGlassGrind } from "./optimize.js";

/** @type {{ cumulativeXpToReachLevel: number[] } | null} */
let xpTable = null;

const GLASS_XP = {
  furnace: 20,
  superglass: 10,
};

const PRODUCTS = [
  { id: "beer_glass", label: "Beer glass", xp: 17.5 },
  { id: "empty_candle_lantern", label: "Empty candle lantern", xp: 19 },
  { id: "empty_oil_lamp", label: "Empty oil lamp", xp: 25 },
  { id: "vial", label: "Vial", xp: 35 },
  { id: "empty_fishbowl", label: "Empty fishbowl", xp: 42.5 },
  { id: "unpowered_orb", label: "Unpowered orb", xp: 52.5 },
  { id: "lantern_lens", label: "Lantern lens", xp: 55 },
  { id: "empty_light_orb", label: "Empty light orb", xp: 70 },
];

function $(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el;
}

function formatNum(n) {
  if (Number.isInteger(n)) return String(n);
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

async function loadXpTable() {
  const status = $("xp-table-status");
  status.textContent = "Loading experience table…";
  status.className = "status";

  try {
    const xpCandidates = [
      new URL("../xp-table.json", import.meta.url).href,
      new URL("../public/xp-table.json", import.meta.url).href,
    ];
    let res = null;
    let lastStatus = 0;
    for (const href of xpCandidates) {
      const r = await fetch(href, { cache: "no-store" });
      if (r.ok) {
        res = r;
        break;
      }
      lastStatus = r.status;
    }
    if (!res) throw new Error(`HTTP ${lastStatus}`);
    const data = await res.json();
    const levels = data.cumulativeXpToReachLevel;
    if (!Array.isArray(levels) || levels.length !== 99) {
      throw new Error(
        "cumulativeXpToReachLevel must be 99 numbers: total lifetime XP to be on each level 1–99 (not XP-per-level deltas).",
      );
    }
    for (let i = 0; i < levels.length; i++) {
      const v = levels[i];
      if (typeof v !== "number" || !Number.isFinite(v) || v < 0) {
        throw new Error(`Invalid XP at index ${i} (level ${i + 1}).`);
      }
      if (i > 0 && levels[i] < levels[i - 1]) {
        throw new Error(`XP must not decrease between level ${i} and ${i + 1}.`);
      }
    }
    xpTable = { cumulativeXpToReachLevel: levels };
    status.textContent = "Experience table loaded (99 levels).";
    status.classList.add("status--ok");
  } catch (e) {
    xpTable = null;
    status.textContent = `Could not load xp-table.json: ${e instanceof Error ? e.message : String(e)}`;
    status.classList.add("status--err");
  }
}

function xpToReachLevel(level) {
  if (!xpTable) return null;
  const idx = level - 1;
  if (idx < 0 || idx >= 99) return null;
  return xpTable.cumulativeXpToReachLevel[idx];
}

function fillTargetLevelSelect() {
  const sel = $("target-level");
  sel.innerHTML = "";
  for (let lv = 2; lv <= 99; lv++) {
    const opt = document.createElement("option");
    opt.value = String(lv);
    opt.textContent = `Level ${lv}`;
    sel.appendChild(opt);
  }
  sel.value = "99";
}

function fillProductSelect() {
  const sel = $("product");
  sel.innerHTML = "";
  for (const p of PRODUCTS) {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.label} (${p.xp} XP each)`;
    sel.appendChild(opt);
  }
}

function initForm() {
  fillTargetLevelSelect();
  fillProductSelect();

  $("calc-form").addEventListener("submit", (ev) => {
    ev.preventDefault();
    if (!xpTable) {
      alert("Fix xp-table.json and reload before calculating.");
      return;
    }

    const currentXp = Number($("current-xp").value);
    const targetLevel = Number($("target-level").value);
    const glassMethod = /** @type {"furnace" | "superglass"} */ (
      document.querySelector('input[name="glassMethod"]:checked')?.value || "furnace"
    );
    const productId = $("product").value;
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) return;

    const targetXp = xpToReachLevel(targetLevel);
    if (targetXp == null) {
      alert("Invalid target level.");
      return;
    }

    if (!Number.isFinite(currentXp) || currentXp < 0) {
      alert("Enter a valid current experience total.");
      return;
    }

    const T = targetXp - currentXp;
    const g = GLASS_XP[glassMethod];
    const p = product.xp;

    const panel = $("result-panel");
    const content = $("result-content");

    if (T <= 0) {
      panel.hidden = false;
      content.innerHTML = `<p class="result-note">You already have at least the experience needed for level <strong>${targetLevel}</strong> (need ${formatNum(T)} more).</p>`;
      return;
    }

    const plan = planGlassGrind(T, g, p);

    const glassLabel = glassMethod === "superglass" ? "Superglass Make (10 XP per molten glass)" : "Furnace / other (20 XP per molten glass)";

    content.innerHTML = `
      <dl class="result-grid">
        <dt>Experience to gain</dt><dd>${formatNum(T)}</dd>
        <dt>Molten glass to make</dt><dd><strong>${formatNum(plan.moltenGlass)}</strong></dd>
        <dt>${product.label} to craft</dt><dd><strong>${formatNum(plan.endProduct)}</strong></dd>
        <dt>Molten glass left unused by this plan</dt><dd>${formatNum(plan.leftoverMolten)}</dd>
        <dt>Total crafting actions</dt><dd>${formatNum(plan.totalActions)} <span class="muted">(molten + product)</span></dd>
        <dt>Experience after plan</dt><dd>${formatNum(currentXp + plan.totalXp)} <span class="muted">(overshoot +${formatNum(plan.overshootXp)})</span></dd>
      </dl>
      <p class="result-note">
        Method: <strong>${glassLabel}</strong>. Each product uses one molten glass. The planner minimizes spare molten glass, then extra XP past the goal, then total actions—so you should not finish the goal with hundreds of molten glass you no longer need for the chosen product.
      </p>
    `;
    panel.hidden = false;
  });
}

loadXpTable().then(() => initForm());
