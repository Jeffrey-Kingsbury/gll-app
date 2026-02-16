import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies"; // Optional helper if you want strict checking, but manual cookie check is faster

export async function middleware(request) {
    const path = request.nextUrl.pathname;

    // 1. EXCLUDE ASSETS & API
    // If we don't exclude these, the browser requests for "logo.svg" or "auth/callback"
    // will get redirected to the login HTML page, breaking your app.
    if (
        path.startsWith("/_next") ||
        path.startsWith("/api") ||      // Important: Allow Auth API calls
        path.startsWith("/static") ||
        path.includes(".")              // Files (images, css, etc)
    ) {
        return NextResponse.next();
    }

    // 2. CHECK SESSION
    // BetterAuth stores a cookie named "better-auth.session_token"
    // We check for its existence to decide if the user is logged in.
    const sessionCookie = request.cookies.get("better-auth.session_token");

    // 3. LOGIC: PROTECT DASHBOARD
    // If trying to access dashboard (/) and NO session -> Redirect to Login
    if (path === "/" && !sessionCookie) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // 4. LOGIC: REDIRECT IF ALREADY LOGGED IN
    // If trying to access Login (/login) and HAS session -> Redirect to Dashboard
    if (path === "/login" && sessionCookie) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}
export const config = {
    // This regex says: Match everything EXCEPT paths starting with 'api', '_next', etc.
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};