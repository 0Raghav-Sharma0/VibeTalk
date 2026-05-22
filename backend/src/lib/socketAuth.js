import { verifyBearerToken } from "../lib/clerk.js";
import { userRepository } from "../repositories/user.repository.js";

export async function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth?.token;
    const { clerkId } = await verifyBearerToken(token);
    const user = await userRepository.findByClerkIdLean(clerkId);

    if (!user) {
      return next(new Error("Unauthorized: user not synced"));
    }

    socket.userId = user._id.toString();
    socket.clerkId = clerkId;
    socket.username = user.fullName || "User";
    next();
  } catch (error) {
    console.warn("Socket auth failed:", error.message);
    next(new Error("Unauthorized: invalid token"));
  }
}
