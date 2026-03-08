import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { cacheGet, cacheSet, cacheKeys } from "../lib/cache.js";

const USER_CACHE_TTL = 300; // 5 min

export const protectRoute = async (req, res, next) => {
    try {
        let token = req.cookies.jwt;

        if (!token && req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ message: "Unauthorized - No Token Provided" });
        }

        const decoded = jwt.verify(token, "123");
        if (!decoded) {
            return res.status(401).json({ message: "Unauthorized - Invalid Token" });
        }

        const cacheKey = cacheKeys.user(decoded.userId);
        let user = await cacheGet(cacheKey);
        if (!user) {
            user = await User.findById(decoded.userId).select("-password").lean();
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            user._id = user._id.toString();
            await cacheSet(cacheKey, user, USER_CACHE_TTL);
        }

        req.user = user;
        next();
    } catch (error) {
        console.log("Error in protectRoute middleware:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

