/** BullMQ queue names — single source of truth */
export const QUEUE_NAMES = {
  MESSAGE_DELIVERY: "vibetalk-message-delivery",
  GROUP_MESSAGE_DELIVERY: "vibetalk-group-message-delivery",
  DELIVERY_RECEIPT: "vibetalk-delivery-receipt",
};

export const USER_ROOM_PREFIX = "user:";

export function userRoom(userId) {
  return `${USER_ROOM_PREFIX}${userId}`;
}
