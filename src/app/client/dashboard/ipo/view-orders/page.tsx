import { Suspense } from "react";
import ViewOrders from "./viewOrders";

export const metadata = {
    title: "View IPO Orders",
}

export default function Login() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ViewOrders />
        </Suspense>
    );
}
