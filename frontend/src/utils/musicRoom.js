/** Socket room id for shared music playback */
export function getMusicRoomId(authUser, selectedUser, selectedGroup) {
  const uid = authUser?._id?.toString?.() || authUser?._id;
  if (!uid) return null;

  if (selectedUser?._id) {
    const other = selectedUser._id?.toString?.() || selectedUser._id;
    return [uid, other].sort().join("_");
  }

  if (selectedGroup?._id) {
    return `group-${selectedGroup._id}`;
  }

  return `music-${uid}`;
}
