// *******************************************************************************************************
// export function getCompatibleUrl(
//   path: string,
//   removeQueryParams = false
// ): string {
//   const isProduction = process.env.NODE_ENV === "production";

//   if (typeof window !== "undefined") {
//     const clientId = sessionStorage.getItem("clientId");
//     const branchClientCheck = sessionStorage.getItem("branchClientCheck");

//     let queryParams = "";
//     const excludedRoutes = ["/authentication/branch/login"];

//     const shouldAttachQueryParams =
//       clientId &&
//       branchClientCheck &&
//       !excludedRoutes.some(
//         (route) => path.startsWith(route) || path.startsWith("branch")
//       );

//     if (shouldAttachQueryParams && !removeQueryParams) {
//       queryParams = `?clientId=${clientId}&branchClientCheck=true`;
//     }

//     const formattedPath = isProduction ? `${path}.html` : path;
//     return removeQueryParams ? formattedPath : `${formattedPath}${queryParams}`;
//   }

//   return path;
// }

// --------------------------------------------------------------
// for branchclient and family check ******************************************

// export function getCompatibleUrl(
//   path: string,
//   removeQueryParams = false
// ): string {
//   const isProduction = process.env.NODE_ENV === "production";

//   if (typeof window !== "undefined") {
//     const clientId = sessionStorage.getItem("clientId");
//     const branchClientCheck = sessionStorage.getItem("branchClientCheck");

//     const excludedRoutes = ["/authentication/branch/login"];

//     const shouldAttachQueryParams =
//       clientId &&
//       branchClientCheck &&
//       !excludedRoutes.some(
//         (route) => path.startsWith(route) || path.startsWith("branch")
//       );

//     const url = new URL(path, window.location.origin); // this parses existing params

//     if (removeQueryParams) {
//       url.search = "";
//     } else if (shouldAttachQueryParams) {
//       url.searchParams.set("clientId", clientId);
//       url.searchParams.set("branchClientCheck", "true");
//     }

//     const pathname = isProduction ? `${url.pathname}.html` : url.pathname;

//     return `${pathname}${url.search}`;
//   }

//   return path;
// }

export function getCompatibleUrl(
  path: string,
  removeQueryParams = false
): string {
  const isProduction = process.env.NODE_ENV === "production";

  if (typeof window !== "undefined") {
    const clientId = sessionStorage.getItem("clientId");
    const isBranchCheck =
      sessionStorage.getItem("branchClientCheck") === "true";
    const isfamilyClientCheck =
      sessionStorage.getItem("familyClientCheck") === "true";

    const excludedRoutes = ["/authentication/branch/login"];

    const shouldAttachQueryParams =
      clientId &&
      (isBranchCheck || isfamilyClientCheck) &&
      !excludedRoutes.some(
        (route) => path.startsWith(route) || path.startsWith("branch")
      );

    const url = new URL(path, window.location.origin);

    if (removeQueryParams) {
      url.search = "";
    } else if (shouldAttachQueryParams) {
      url.searchParams.set("clientId", clientId);
      if (isBranchCheck) {
        url.searchParams.set("branchClientCheck", "true");
      } else if (isfamilyClientCheck) {
        url.searchParams.set("familyClientCheck", "true");
      }
    }

    // const pathname = isProduction ? `${url.pathname}.html` : url.pathname;

    const pathname = isProduction
      ? url.pathname.endsWith(".html")
        ? url.pathname
        : `${url.pathname}.html`
      : url.pathname;

    return `${pathname}${url.search}`;
  }

  return path;
}

// --------------------------------------------------------------
// export function getCompatibleUrl(
//   path: string,
//   removeQueryParams = false
// ): string {
//   const isProduction = process.env.NODE_ENV === "production";
//   const basePath = "/capital2"; // hardcoded or make it configurable if needed

//   if (typeof window !== "undefined") {
//     const clientId = sessionStorage.getItem("clientId");
//     const branchClientCheck = sessionStorage.getItem("branchClientCheck");

//     const excludedRoutes = ["/authentication/branch/login"];

//     const shouldAttachQueryParams =
//       clientId &&
//       branchClientCheck &&
//       !excludedRoutes.some(
//         (route) => path.startsWith(route) || path.startsWith("branch")
//       );

//     // Ensure path starts with slash
//     const fullPath = path.startsWith("/")
//       ? `${basePath}${path}`
//       : `${basePath}/${path}`;
//     const url = new URL(fullPath, window.location.origin);

//     if (removeQueryParams) {
//       url.search = "";
//     } else if (shouldAttachQueryParams) {
//       url.searchParams.set("clientId", clientId);
//       url.searchParams.set("branchClientCheck", "true");
//     }

//     const pathname = isProduction ? `${url.pathname}.html` : url.pathname;

//     return `${pathname}${url.search}`;
//   }

//   return path;
// }

export function addHtmlExtension(path: string): string {
  const isProduction = process.env.NODE_ENV === "production";

  if (
    typeof window !== "undefined" &&
    isProduction &&
    !path.endsWith(".html")
  ) {
    return `${path}.html`;
  }

  return path;
}
