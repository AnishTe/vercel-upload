"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLocalStorage } from "@/utils/localStorage";

const RedirectToPrint = () => {
    const router = useRouter();

    useEffect(() => {
        // Retrieve calculatedAmount from local storage
        const storedAmount = getLocalStorage("calculatedAmount");
        // const storedAmount = localStorage.getItem("calculatedAmount");
        const calculatedAmount = storedAmount ? parseFloat(storedAmount) : 0;

        // Determine the URL based on the amount
        const url = calculatedAmount > 500000 ? "/printBackend.html" : "/print_form.html";

        // Open in a new tab
        window.open(url, "_blank");

        // Optional: Navigate back to the previous page or another page
        router.back(); // This takes the user back after opening the new tab
    }, [router]);

    return <p>Redirecting...</p>;
};

export default RedirectToPrint;
