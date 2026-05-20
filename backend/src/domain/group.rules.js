import { toIdString } from "./ids.js";

export const groupRules = {
  isMember(group, userId) {
    return group.members.some((m) => toIdString(m.userId) === toIdString(userId));
  },

  isAdmin(group, userId) {
    return group.members.some(
      (m) => toIdString(m.userId) === toIdString(userId) && m.role === "admin"
    );
  },
};
