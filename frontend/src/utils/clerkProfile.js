/** Maps Clerk user object → backend sync payload */
export function toSyncProfile(clerkUser) {
  if (!clerkUser) return null;
  return {
    email: clerkUser.primaryEmailAddress?.emailAddress,
    fullName:
      clerkUser.fullName ||
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      "User",
    profilePic: clerkUser.imageUrl || "",
  };
}
