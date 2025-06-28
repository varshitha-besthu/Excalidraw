import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
const {JWT_SECRET } = require("@repo/be-common/src/index");
interface JwtPayload {
  userId: string;
  // Add more fields if your token includes them
}

export function middleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers["authorization"] ?? "";

    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded) {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        req.userId = decoded.userId;
        next();
    } else {
        res.status(403).json({
            message: "Unauthorized"
        })
    }
}