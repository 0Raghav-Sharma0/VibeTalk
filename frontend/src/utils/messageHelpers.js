/** Normalize MongoDB / string IDs for reliable comparisons */
export const normId = (id) =>
  id != null && typeof id === "object" && id._id != null
    ? String(id._id)
    : String(id ?? "");

/** WhatsApp-style merge: upsert by _id or clientMessageId, keep chronological order */
export function upsertMessage(messages, incoming) {
  const id = normId(incoming._id);
  const clientId = incoming.clientMessageId;

  const next = messages.filter((m) => {
    if (clientId && m.clientMessageId === clientId) return false;
    if (normId(m._id) === id) return false;
    return true;
  });

  next.push(incoming);
  return next.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}
