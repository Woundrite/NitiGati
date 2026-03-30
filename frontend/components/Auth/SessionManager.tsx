"use client";
import { useState } from "react";
import { useCookies } from "next-client-cookies";

type SessionManager = {
    isLoggedIn: boolean;
    authToken: string | null;
    getToken: () => string | null;
    setToken: (token: string) => void;
    getDetails: () => {
        name: string;
        roles: string[];
        last_active_role: string;
    } | null;
    clearToken: () => void;
    isAuthorized: (_resource: string) => boolean;
};

export function useSessionManager(): SessionManager {
    const cookie = useCookies();
    const [authToken, setAuthToken] = useState<string | null>(
        cookie.get("authToken") || null,
    );
    const [userDetails, setUserDetails] = useState<{
        name: string;
        roles: string[];
        last_active_role: string;
    } | null>(null);

    const isLoggedIn = authToken !== null;
    // implement a authToken state callback for the main script
    // mainly for the logout page as the reroute is being triggered by the session
    // manager itself, so the state change is not being detected by the useEffect in
    // the logout page

    const getToken = (): string | null => {
        return authToken || cookie.get("authToken") || null;
    };

    const fetchUserDetails = async (token: string) => {
        try {
            const res = await fetch("/api/auth/getRoles", {
                method: "GET",
                headers: {
                    Authorization: `Token ${token}`,
                },
            });
            if (res.ok) {
                const data = await res.json();
                setUserDetails({
                    name: data.name,
                    roles: data.roles,
                    last_active_role: data.last_active_role,
                });
            }
        } catch (error) {
            console.error("Error fetching user roles:", error);
        }
    };

    const getDetails = () => userDetails;

    const setToken = (token: string) => {
        cookie.set("authToken", token, {
            path: "/",
            expires: 7,
        });
        setAuthToken(token);
        fetchUserDetails(token);
    };

    const clearToken = () => {
        cookie.remove("authToken", {
            path: "/",
        });
        setAuthToken(null);
        setUserDetails(null);
    };

    // Auto-fetch if token exists but details don't
    if (authToken && !userDetails) {
        fetchUserDetails(authToken);
    }

    const isAuthorized = (_resource: string): boolean => {
        return getToken() !== null;
    };

    return {
        isLoggedIn,
        authToken,
        getToken,
        getDetails,
        setToken,
        clearToken,
        isAuthorized,
    };
}
