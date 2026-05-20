/** Shared ID normalization — single place for string comparison rules */
export const toIdString = (id) =>
  id != null && typeof id === "object" && id._id != null
    ? String(id._id)
    : String(id ?? "");

export const escapeRegex = (value) =>
  value.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
