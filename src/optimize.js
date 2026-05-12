/**
 * Molten glass: M crafts. End product: E crafts, each uses one molten glass.
 * Constraints: M >= E >= 0, total XP = M*g + E*p >= T.
 * Prefer fewer "spare" molten glass (M - E), then less XP past the goal, then fewer total actions (M + E).
 *
 * @param {number} T - experience still needed (positive)
 * @param {number} g - XP per molten glass
 * @param {number} p - XP per end product
 * @returns {{ moltenGlass: number, endProduct: number, leftoverMolten: number, totalXp: number, overshootXp: number, totalActions: number }}
 */
export function planGlassGrind(T, g, p) {
  if (T <= 0) {
    return {
      moltenGlass: 0,
      endProduct: 0,
      leftoverMolten: 0,
      totalXp: 0,
      overshootXp: 0,
      totalActions: 0,
    };
  }

  const maxL = Math.ceil(T / g) + 2;
  let best = null;

  for (let L = 0; L <= maxL; L++) {
    const fromMoltenOnly = L * g;
    let E;
    if (fromMoltenOnly >= T) {
      E = 0;
    } else {
      const remainder = T - fromMoltenOnly;
      E = Math.ceil(remainder / (g + p));
    }

    const M = E + L;
    const totalXp = M * g + E * p;
    const overshootXp = totalXp - T;
    const totalActions = M + E;
    const cand = { moltenGlass: M, endProduct: E, leftoverMolten: L, totalXp, overshootXp, totalActions };

    if (!best) {
      best = cand;
      continue;
    }

    if (cand.leftoverMolten < best.leftoverMolten) {
      best = cand;
    } else if (cand.leftoverMolten === best.leftoverMolten) {
      if (cand.overshootXp < best.overshootXp) {
        best = cand;
      } else if (cand.overshootXp === best.overshootXp && cand.totalActions < best.totalActions) {
        best = cand;
      }
    }
  }

  return best;
}
