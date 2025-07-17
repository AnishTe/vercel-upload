import { Suspense } from "react";
import SummarizedPL from "./summarized_pl";

export const metadata = {
    title: "Summarized PL Equity",
}

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SummarizedPL />
        </Suspense>
    );
}
