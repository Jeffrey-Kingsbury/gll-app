// src/app/api/auth/[...all]/route.js
import { auth } from "@/lib/auth"; // Check this import path!
import { toNextJsHandler } from "better-auth/next-js";

// Make sure 'auth' is not undefined here
if (!auth) {
    console.error("⚠️ Auth object is missing in API route!");
}

const handlers = toNextJsHandler(auth);

export const GET = async (req) => {
    const url = new URL(req.url);
    if (url.pathname.endsWith('/') && url.pathname.length > 1) {
        url.pathname = url.pathname.slice(0, -1);
        const newReq = new Request(url.toString(), req);
        return handlers.GET(newReq);
    }
    return handlers.GET(req);
};

export const POST = async (req) => {
    const url = new URL(req.url);
    if (url.pathname.endsWith('/') && url.pathname.length > 1) {
        url.pathname = url.pathname.slice(0, -1);
        const newReq = new Request(url.toString(), req);
        return handlers.POST(newReq);
    }
    return handlers.POST(req);
};