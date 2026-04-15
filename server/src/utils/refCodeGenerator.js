// ─────────────────────────────────────────────────────────────
//  Reference code generator
//  Produces short, user-friendly booking codes like "APT-7K3X"
//  Format: APT- + 4 random uppercase alphanumeric characters
// ─────────────────────────────────────────────────────────────

/**
 * Generate a unique-ish reference code for appointments
 * Collision probability is low enough for this assignment scope
 * (~1.6M possible codes)
 *
 * @returns {string} e.g. "APT-7K3X"
 */
export function generateRefCode() {
  return 'APT-' + Math.random().toString(36).slice(2, 6).toUpperCase();
}
