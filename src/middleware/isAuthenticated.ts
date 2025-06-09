import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload, Secret, TokenExpiredError } from "jsonwebtoken";
import { DecodedToken } from "../app";
import { prisma } from "../utils/prisma";
import dotEnv from "dotenv";
dotEnv.config();

export const isAuthenticated = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> => {
    try {
      const token = req.headers.authorization?.split(" ")[1] || req.cookies.token;
  
      if (!token) {
        return res.status(401).json({ message: "Authentication failed. No token provided." });
      }
  
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET_ACCESSTOKEN!
      ) as DecodedToken;
  
      console.log("Decoded JWT:", decoded);
  
      if (!decoded || !decoded.email) {
        return res.status(401).json({ message: "Invalid or malformed token." });
      }
  
      const getuser = await prisma.user.findUnique({
        where: {
          email: decoded.email,
        },
        include: {
          orders: true,
          Tickets: true,
          reviews: true,
        },
      });
  
      if (!getuser) {
        return res.status(401).json({ message: "User not found" });
      }
  
      (req as any).user = getuser;
  
      next();
    } catch (error) {
      console.error("Auth error:", error);
  
      if (error instanceof TokenExpiredError) {
        return res.status(401).json({ message: "Token has expired" });
      }
  
      return res.status(401).json({ message: "Authentication failed" });
    }
  };