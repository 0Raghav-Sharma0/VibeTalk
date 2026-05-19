import multer from "multer";

/** Temporary disk storage for chat file uploads */
export const upload = multer({ dest: "uploads/" });
