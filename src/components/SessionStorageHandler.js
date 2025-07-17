import { useEffect } from "react";
import Cookies from "js-cookie";

// const SessionStorageHandler = () => {
//   useEffect(() => {
//     const searchParams = new URLSearchParams(window.location.search);
//     const clientId = searchParams.get("clientId");
//     const branchClientCheck = searchParams.get("branchClientCheck") === "true";

//     // Store values if they exist in URL
//     if (clientId && branchClientCheck) {
//       sessionStorage.setItem("clientId", clientId);
//       sessionStorage.setItem(`branchClientCheck`, "true");
//     }

//     // Preserve session storage on refresh
//     const handleBeforeUnload = (event) => {
//       if (!event.persisted) {
//         // Check if it's a real unload, not a reload
//         // sessionStorage.removeItem("clientId");
//         // sessionStorage.removeItem(`branchClientCheck`);
//         // sessionStorage.removeItem(`branchClientCheck_${clientId}`);
//         // sessionStorage.clear();
//       }
//     };

//     // window.addEventListener("beforeunload", handleBeforeUnload);

//     return () => {
//       // window.removeEventListener("beforeunload", handleBeforeUnload);
//     };
//   }, []);

//   return null;
// };

const SessionStorageHandler = () => {
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const clientId = searchParams.get("clientId");
    const branchClientCheck = searchParams.get("branchClientCheck") === "true";
    const familyClientCheck = searchParams.get("familyClientCheck") === "true";

    if (clientId) {
      // Store clientId as base reference
      sessionStorage.setItem("clientId", clientId);

      // Store based on which check is present
      if (branchClientCheck) {
        sessionStorage.setItem("branchClientCheck", "true");
        // sessionStorage.setItem(
        //   `branchClientCheck_${clientId}`,
        //   JSON.stringify({ from: "branch" })
        // );
      } else if (familyClientCheck) {
        sessionStorage.setItem("familyClientCheck", "true");
        // sessionStorage.setItem(
        //   `familyClientCheck_${clientId}`,
        //   JSON.stringify({ from: "family" })
        // );
      }
    }

    // Optional cleanup — only needed if you want to clear on tab close, not reload
    const handleBeforeUnload = (event) => {
      if (!event.persisted) {
        // Example of clearing only check-related keys
        // sessionStorage.removeItem("clientId");
        // sessionStorage.removeItem("branchClientCheck");
        // sessionStorage.removeItem("familyClientCheck");
        // sessionStorage.removeItem(`branchClientCheck_${clientId}`);
        // sessionStorage.removeItem(`familyClientCheck_${clientId}`);
        // Or to clear everything:
        // sessionStorage.clear();
      }
    };

    // Uncomment if you want to attach unload logic
    // window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      // window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return null;
};

export default SessionStorageHandler;
