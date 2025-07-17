"use client"; // Ensure client-side execution

import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { usePathname, useRouter } from "next/navigation";
// import Cookies from "js-cookie";

interface LoadingContextProps {
    loading: boolean;
}

const LoadingContext = createContext<LoadingContextProps>({ loading: false });

export function LoadingProvider({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const pathname = usePathname(); // Tracks page changes

    // Ensure loading is displayed for at least 500ms
    const showLoading = () => setLoading(true);
    const hideLoading = () => setTimeout(() => setLoading(false), 500);

    // 📌 Track API Calls (Using Axios Interceptors)
    useEffect(() => {
        const requestInterceptor = axios.interceptors.request.use((config) => {
            const skipGlobalLoading = config.headers?.['X-Skip-Global-Loading'];
            if (!skipGlobalLoading) {
                showLoading();
            }
            return config;
        });

        const responseInterceptor = axios.interceptors.response.use(
            (response) => {
                const skipGlobalLoading = response.config.headers?.['X-Skip-Global-Loading'];
                if (!skipGlobalLoading) {
                    hideLoading();
                }
                return response;
            },
            (error) => {
                const skipGlobalLoading = error.config?.headers?.['X-Skip-Global-Loading'];
                if (!skipGlobalLoading) {
                    hideLoading();
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.request.eject(requestInterceptor);
            axios.interceptors.response.eject(responseInterceptor);
        };
    }, []);

    // 📌 Detect Page Navigation
    useEffect(() => {
        // clearAllCookies();
        showLoading(); // Start loading when pathname changes
        hideLoading(); // Hide loading after navigation completes
    }, [pathname]);

    return (
        <LoadingContext.Provider value={{ loading }}>
            {children}
        </LoadingContext.Provider>
    );
}

export function useLoading() {
    return useContext(LoadingContext);
}
