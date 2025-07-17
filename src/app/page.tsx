import LoginPage from "./authentication/client/login/page";
import { Suspense } from "react";
import LoginFallback from "./authentication/login-fallback";
import Login from "./authentication/client/login/page";

export default function Home() {
  return (

    // <div className="flex items-center justify-center bg-background ">
    <div className="bg-[url('/images/loginClient.jpg')] bg-cover bg-center bg-no-repeat flex items-center justify-center shadow-md h-screen">
      <div className="w-full max-w-md ">
        {/* <Suspense fallback={<LoginFallback />}> */}
        <Login />
        {/* </Suspense> */}
      </div>
    </div>
    // </div>

  )
}
