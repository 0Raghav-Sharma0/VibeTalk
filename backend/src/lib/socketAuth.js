import { authService } from "../services/auth.service.js";
import { userRepository } from "../repositories/user.repository.js";

export async function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Unauthorized: missing token"));
    }

    const payload = await authService.verifySession(token);
    const user = await userRepository.findByClerkIdLean(payload.sub);

    if (!user) {
      return next(new Error("Unauthorized: user not synced"));
    }

    socket.userId = user._id.toString();
    socket.clerkId = payload.sub;
    socket.username = user.fullName || "User";
    next();
  } catch (error) {
    console.warn("Socket auth failed:", error.message);
    next(new Error("Unauthorized: invalid token"));
  }
}
