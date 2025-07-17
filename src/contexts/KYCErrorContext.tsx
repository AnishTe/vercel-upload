// KYCErrorContext.tsx

"use client"

import React, { createContext, useContext, useRef, useState } from "react";

type ErrorItem = { path: string; message: string };

interface KYCErrorContextType {
    errors: ErrorItem[];
    setErrors: (errors: ErrorItem[]) => void;
    registerFieldRef: (fieldPath: string) => (el: HTMLElement | null) => void;
    scrollToField: (fieldPath: string | (string | number)[]) => void;
}

const KYCErrorContext = createContext<KYCErrorContextType | undefined>(undefined);

export const useKYCError = () => {
    const ctx = useContext(KYCErrorContext);
    if (!ctx) throw new Error("useKYCError must be used within KYCErrorProvider");
    return ctx;
};

export const KYCErrorProvider = ({ children }: { children: React.ReactNode }) => {
    const [errors, setErrors] = useState<ErrorItem[]>([]);

    const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

    const registerFieldRef = (fieldPath: string) => (element: HTMLElement | null) => {
        if (element) {
            fieldRefs.current[fieldPath] = element;
        }
    };

    const scrollToField = (fieldPath: string | (string | number)[]) => {
        console.log(fieldPath);
        const key = Array.isArray(fieldPath) ? fieldPath.join(".") : fieldPath;
        const element = fieldRefs.current[key];
        console.log(element);

        if (element) {
            const offsetTop = element.getBoundingClientRect().top + window.scrollY - 170;
            window.scrollTo({ top: offsetTop, behavior: "smooth" });

            element.classList.add("field-error-highlight");
            setTimeout(() => {
                element.classList.remove("field-error-highlight");
            }, 2000);
        }
    };


    return (
        <KYCErrorContext.Provider value={{ errors, setErrors, registerFieldRef, scrollToField }}>
            {children}
        </KYCErrorContext.Provider>
    );
};
