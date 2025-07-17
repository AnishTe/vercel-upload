import { Suspense } from "react";
import MTFDashboard from "./mtf-dashboard";

export const metadata = {
    title: "MTF Dashboard",
}

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <MTFDashboard />
        </Suspense>
    );
}
