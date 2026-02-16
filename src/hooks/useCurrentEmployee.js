// src/hooks/useCurrentEmployee.js
import { useState, useEffect } from "react";
import { getCurrentEmployeeAction } from "@/app/login/actions";
import { signOut } from "@/lib/auth-client"; // Import SignOut
import { useRouter } from "next/navigation";

export function useCurrentEmployee() {
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        let isMounted = true;

        async function fetchEmployee() {
            try {
                const data = await getCurrentEmployeeAction();

                // --- THE BOUNCER LOGIC ---
                // If user is logged in (data exists) BUT they are a guest (not in employees table)
                if (data && data.isGuest) {
                    console.warn("Guest detected. Access denied.");

                    // 1. Kill the BetterAuth session
                    await signOut();

                    // 2. Redirect to login with error flag
                    router.push("/login?error=unauthorized");
                    return;
                }

                if (isMounted) setEmployee(data);
            } catch (err) {
                console.error(err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchEmployee();

        return () => { isMounted = false; };
    }, [router]);

    return {
        employee,
        loading,
        isAdmin: employee?.accessLevel === 1,
        isManager: employee?.accessLevel <= 2,
        isAuthenticated: !!employee && !employee.isGuest
    };
}