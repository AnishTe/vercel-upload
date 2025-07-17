import { Suspense } from "react";
import ApplyIPODetails from "./applyIPODetails";

export const metadata = {
    title: "Apply IPO",
}

export default function Login() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ApplyIPODetails />
        </Suspense>
    );
}
