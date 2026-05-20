/**
 * Public user shape returned to clients (no sensitive fields).
 */
export function toUserDTO(user) {
  const doc = user?.toObject ? user.toObject() : user;
  if (!doc?._id) return null;

  return {
    _id: String(doc._id),
    clerkId: doc.clerkId,
    email: doc.email,
    fullName: doc.fullName,
    profilePic: doc.profilePic || "",
    about: doc.about || "",
    createdAt: doc.createdAt,
  };
}

export function profileFromClerkPayload(clerkPayload, body = {}) {
  const email =
    body.email ||
    clerkPayload.email ||
    clerkPayload.primary_email_address;
  const fullName =
    body.fullName ||
    clerkPayload.name ||
    clerkPayload.full_name ||
    email?.split("@")[0] ||
    "User";
  const profilePic =
    body.profilePic ||
    clerkPayload.picture ||
    clerkPayload.image_url ||
    "";

  return { email, fullName, profilePic };
}
