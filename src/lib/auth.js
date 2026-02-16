// src/lib/auth.js
import { betterAuth } from "better-auth";
import { createPool } from "mysql2/promise";

export const auth = betterAuth({
    database: createPool({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 1,
        queueLimit: 0
    }),
    emailAndPassword: {
        enabled: true
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
    },
    // IMPORTANT: BetterAuth needs to know where it lives
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: ["http://localhost", "192.168.2.136"],

    // Enable debug to see the REAL error (like "Table 'user' doesn't exist")
    debug: true,
});

export async function GET(request) {
    return auth.handler(request);
}

export async function POST(request) {
    return auth.handler(request);
}