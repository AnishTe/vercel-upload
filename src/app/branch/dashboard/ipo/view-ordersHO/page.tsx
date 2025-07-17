import { Suspense } from "react";
import ViewOrders from "./viewHistoryHO";

export const metadata = {
    title: "View Orders",
}

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ViewOrders />
        </Suspense>
    );
}
