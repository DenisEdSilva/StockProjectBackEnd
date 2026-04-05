import { Response } from "express";

export function setAuthCookie(res: Response, token: string, maxAgeMs?: number) {
    res.cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: maxAgeMs || 8 * 3600 * 1000,
        path: "/",
    });
}