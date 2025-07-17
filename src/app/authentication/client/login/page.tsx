import { Suspense } from "react";
import LoginFallback from "../../login-fallback";
import LoginPage from "./LoginPage";

export default function Login() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPage />
    </Suspense>
  );
}
