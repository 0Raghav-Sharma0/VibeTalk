import { z } from "zod";

const objectIdLike = z.union([
  z.string().min(1),
  z.object({}).passthrough(),
]);

export const sendMessageSchema = z.object({
  senderId: objectIdLike,
  receiverId: objectIdLike,
  text: z.string().max(10000).optional(),
  image: z.string().max(2048).optional(),
  video: z.string().max(2048).optional(),
  file: z.string().max(2048).optional(),
  clientMessageId: z.string().max(128).optional(),
});

export function parseSendMessage(data) {
  return sendMessageSchema.safeParse(data ?? {});
}
