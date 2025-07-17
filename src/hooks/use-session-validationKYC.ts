"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useKYC } from "@/contexts/kyc-context";
import { toast } from "@/hooks/use-toast";

export function useSessionValidation(currentStep: string) {
  const { setSessionId, getSessionId } = useKYC();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Skip validation for signin step
    if (currentStep === "signin") {
      return;
    }

    const sessionIdFromUrl = searchParams.get("session_id");
    const currentSessionId = getSessionId();

    // If no session_id in URL and no session_id in sessionStorage, redirect to signin
    if (!sessionIdFromUrl && !currentSessionId) {
      console.log(
        `No session_id found on ${currentStep} page, redirecting to signin`
      );
      //   toast({
      //     title: "Session Invalid",
      //     description: "Your session has expired. Please sign in again.",
      //     variant: "destructive",
      //   });
      //   router.replace("/kyc/signin");
      return;
    }

    // If we have session_id in URL but not in sessionStorage, set it
    if (sessionIdFromUrl && sessionIdFromUrl !== currentSessionId) {
      console.log(
        `Setting session_id from URL on ${currentStep} page:`,
        sessionIdFromUrl
      );
      setSessionId(sessionIdFromUrl);
    }

    // If we have session_id in sessionStorage but not in URL, add it to URL
    // if (currentSessionId && !sessionIdFromUrl) {
    //   console.log(
    //     `Adding session_id to URL on ${currentStep} page:`,
    //     currentSessionId
    //   );
    //   const newUrl = new URL(window.location.href);
    //   newUrl.searchParams.set("session_id", currentSessionId);
    //   router.replace(newUrl.pathname + newUrl.search);
    // }
  }, [currentStep, searchParams, setSessionId, getSessionId, router]);

  // Return whether the session is valid
  const sessionIdFromUrl = searchParams.get("session_id");
  const currentSessionId = getSessionId();
  return !!(sessionIdFromUrl || currentSessionId);
}
