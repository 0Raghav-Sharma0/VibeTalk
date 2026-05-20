import { Server } from "socket.io";
import { socketCorsOptions } from "../../config/cors.js";
import { scaleConfig } from "../../config/scale.config.js";
import { authenticateSocket } from "../../lib/socketAuth.js";
import { getIO } from "../../lib/ioHolder.js";
import { attachConnectionHandler } from "./connection.handler.js";

export { getIO };

export function createSocketServer(server) {
  const { socket } = scaleConfig;
  const transports = socket.websocketOnly
    ? ["websocket"]
    : ["websocket", "polling"];

  const io = new Server(server, {
    cors: socketCorsOptions,
    transports,
    pingTimeout: socket.pingTimeout,
    pingInterval: socket.pingInterval,
    connectTimeout: socket.connectTimeout,
    perMessageDeflate: socket.perMessageDeflate,
    maxHttpBufferSize: socket.maxHttpBufferSize,
    ...(socket.connectionStateRecovery
      ? {
          connectionStateRecovery: {
            maxDisconnectionDuration: 2 * 60 * 1000,
            skipMiddlewares: true,
          },
        }
      : {}),
  });

  console.log(
    `🔥 Socket.IO ready (transports=${transports.join(",")}, deflate=${socket.perMessageDeflate})`
  );

  io.use(authenticateSocket);
  attachConnectionHandler(io);

  return io;
}
