import { getLocalStorage } from "@/utils/localStorage";
import axios from "axios";
import Cookies from "js-cookie";

const PESB_URL = process.env.NEXT_PUBLIC_PESB_API_URL;

const baseUrlPledge = PESB_URL + "/pledge/client";
const baseUrlIPO = PESB_URL + "/ipo1";
const baseUrlBuyback = PESB_URL + "/buyback1/client";
const baseUrlPledgeHO = PESB_URL + "/pledge/branch/headoffice";
//BRANCH
const baseUrlPledgeBranch = PESB_URL + "/pledge/branch";
const baseUrlBuybackBranch = PESB_URL + "/buyback1/branch";
const baseUrlBackofficeBranch = PESB_URL + "/backoffice/branch";

//HO
const baseUrlBuybackHO = PESB_URL + "/buyback1/branch/headoffice";
// Include common request body
const getCommonRequestBody = (userType) => {
  const activeUserId =
    userType === "client"
      ? getLocalStorage("currentClientId")
      : getLocalStorage("currentBranchId");
  const activeUserToken = getLocalStorage(`userToken_${activeUserId}`);

  return {
    clientId: activeUserId,
    token: activeUserToken,
  };
};

const getCommonHeaders = (
  userType,
  clientId,
  branchClientCheck,
  familyClientCheck
) => {
  let activeUserId;

  if (clientId && (branchClientCheck || familyClientCheck)) {
    activeUserId = getLocalStorage(
      branchClientCheck ? "currentBranchId" : "currentClientId"
    );
  } else if (userType.toLowerCase() === "kyc") {
    activeUserId = getLocalStorage("kyc_pan");
  } else {
    activeUserId =
      userType.toLowerCase() === "client"
        ? getLocalStorage("currentClientId")
        : getLocalStorage("currentBranchId");
  }

  const activeUserToken = getLocalStorage(`userToken_${activeUserId}`);

  const headers = {
    username: activeUserId || "",
    token: activeUserToken || "",
  };

  if (familyClientCheck) {
    headers.familyClientCheck = familyClientCheck || false;
  }

  if (
    branchClientCheck ||
    userType.toLowerCase() === "branch" ||
    userType.toLowerCase() === "employee"
  ) {
    headers.branchClientCheck = branchClientCheck || false;
  }

  return headers;
};

// const getCommonHeaders = (userType, clientId, branchClientCheck) => {
//   let activeUserId;

//   if (clientId && branchClientCheck) {
//     activeUserId = getLocalStorage("currentBranchId");
//   } else if (userType.toLowerCase() === "kyc") {
//     activeUserId = getLocalStorage("kyc_pan");
//   } else {
//     activeUserId =
//       userType.toLowerCase() === "client"
//         ? getLocalStorage("currentClientId")
//         : getLocalStorage("currentBranchId");
//   }

//   // Ensure userToken is fetched correctly
//   const activeUserToken = getLocalStorage(`userToken_${activeUserId}`);

//   const headers = {
//     username: activeUserId || "", // Ensure it's not undefined
//     token: activeUserToken || "", // Ensure it's not undefined
//   };

//   if (
//     branchClientCheck ||
//     userType.toLowerCase() === "branch" ||
//     userType.toLowerCase() === "employee"
//   ) {
//     headers.branchClientCheck = true;
//   }

//   return headers;
// };

// Helper function for API calls without caching
// const apiCall = async (
//   url,
//   data = {},
//   includeCommonData = false,
//   userType = "client"
// ) => {
//   let requestBody = { ...data };

//   // âœ… Extract query parameters from URL
//   const urlObj = new URL(url, window.location.origin); // Ensure correct parsing
//   const searchParams = new URLSearchParams(window.location.search);

//   // âœ… Get `clientId` and `branchClientCheck`
//   const clientId = searchParams.get("clientId");
//   const branchClientCheck = searchParams.get("branchClientCheck") === "true";

//   // âœ… If conditions are met, modify requestBody
//   if (clientId && branchClientCheck) {
//     requestBody = { ...requestBody, clientId };
//   } else if (includeCommonData) {
//     const commonData = getCommonRequestBody(userType);
//     requestBody = { ...commonData, ...requestBody };
//   }

//   let commonHeaders = {};
//   if (userType !== "guest") {
//     commonHeaders = getCommonHeaders(userType, clientId, branchClientCheck);
//   }

//   return axios.post(url, requestBody, {
//     headers: {
//       "Content-Type": "application/json",
//       Accept: "*/*",
//       ...commonHeaders,
//     },
//   });
// };

const apiCall = async (
  url,
  data = {},
  includeCommonData = false,
  userType = "client"
) => {
  let requestBody = { ...data };

  const urlObj = new URL(url, window.location.origin);
  const searchParams = new URLSearchParams(window.location.search);

  const clientId = searchParams.get("clientId");
  const branchClientCheck = searchParams.get("branchClientCheck") === "true";
  const familyClientCheck = searchParams.get("familyClientCheck") === "true";

  if (clientId && (branchClientCheck || familyClientCheck)) {
    requestBody = { ...requestBody, clientId };
  } else if (includeCommonData) {
    const commonData = getCommonRequestBody(userType);
    requestBody = { ...commonData, ...requestBody };
  }

  let commonHeaders = {};
  if (userType !== "guest") {
    commonHeaders = getCommonHeaders(
      userType,
      clientId,
      branchClientCheck,
      familyClientCheck
    );
  }

  return axios.post(url, requestBody, {
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
      ...commonHeaders,
    },
  });
};

// Export all the API functions here (unchanged)
export const register = (data) => axios.post(`${PESB_URL}/register`, data);
export const login = (clientId, password) => {
  return axios.post(`${PESB_URL}/auth/login`, { clientId, password });
};
export const branchLogin = (username, password) => {
  return axios.post(`${PESB_URL}/auth/partner/login`, { username, password });
};

export const resetBranchPassword = (data) =>
  axios.post(`${PESB_URL}/auth/branch/reset-password`, data);

export const forgotBranchPassword = (data) =>
  axios.post(`${PESB_URL}/auth/branch/forgot-password`, data);

export const odinLogin = (clientId, sessionId) => {
  return axios.post(`${PESB_URL}/auth/odinSSOLogin`, { clientId, sessionId });
};

export const sendOtp = (data) =>
  axios.post(`${PESB_URL}/auth/getloginotp`, data);
export const loginWithOtp = (data) =>
  axios.post(`${PESB_URL}/auth/loginWithOtp`, data);

export const forgotPassword = (data) =>
  axios.post(`${PESB_URL}/auth/forgot-password`, data);
export const resetPassword = (data) =>
  axios.post(`${PESB_URL}/auth/reset-password`, data);

export const getActiveSessions = () => {
  return apiCall(`${PESB_URL}/auth/getActiveSessions`, {}, true, "client");
};
export const logout = (data) => {
  return apiCall(`${PESB_URL}/auth/logout`, data, true, "client");
};

//Limit Transfer
export const getDailyClientLimit = () => {
  return apiCall(
    `${PESB_URL}/limit/client/getDailyClientLimit`,
    {},
    true,
    "client"
  );
};
export const getUtradeLimit = () => {
  return apiCall(`${PESB_URL}/limit/client/getUtradeLimit`, {}, true, "client");
};
export const setUtradeLimit = (data) => {
  return apiCall(
    `${PESB_URL}/limit/client/setUtradeLimit`,
    data,
    true,
    "client"
  );
};

// Margin Pledge
export const marginPledge = (data) => {
  return apiCall(`${baseUrlPledge}/getstockdetails`, data, true, "client");
};
export const applyMarginPledge = (data) => {
  return apiCall(`${baseUrlPledge}/applyforpledge`, data, true, "client");
};
export const getcdslpledge = (data) => {
  return apiCall(`${PESB_URL}/cdslpledge/response`, data, true, "client");
};
export const openCDSL = (url, data) => {
  axios.post(url, data, {
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
    },
  });
};

//HO : Margin Pledge

export const marginPledgeHO = (data) => {
  return apiCall(`${baseUrlPledgeHO}/getstockdetails`, data, false, "branch");
};

export const applyMarginPledgeHO = (data) => {
  return apiCall(`${baseUrlPledgeHO}/applyforpledge`, data, false, "branch");
};

//HO : MTF Pledge

export const mtfPledgeHO = (data) => {
  return apiCall(
    `${baseUrlPledgeHO}/getstockdetailsformtf`,
    data,
    false,
    "branch"
  );
};

export const applyMtfPledgeHO = (data) => {
  return apiCall(`${baseUrlPledgeHO}/applyformtfpledge`, data, false, "branch");
};

export const repledge = (data) => {
  return apiCall(`${baseUrlPledgeHO}/getrepledgedata`, data, false, "branch");
};

//Cancel Pledge Order
export const cancelPledgeOrder = (data) => {
  return apiCall(`${baseUrlPledgeHO}/cancelPledgeOrder`, data, false, "branch");
};

//Generate Pledge File
export const generateRepledgeFile = (data) => {
  return apiCall(
    `${baseUrlPledgeHO}/generaterepledgefile`,
    data,
    false,
    "branch"
  );
};

//BRANCH : Margin Pledge

export const marginPledgeBranch = (data) => {
  return apiCall(
    `${baseUrlPledgeBranch}/getstockdetails`,
    data,
    false,
    "branch"
  );
};
export const applyMarginPledgeBranch = (data) => {
  return apiCall(
    `${baseUrlPledgeBranch}/applyforpledge`,
    data,
    false,
    "branch"
  );
};

// MTF Pledge
export const mtfPledge = (data) => {
  return apiCall(
    `${baseUrlPledge}/getstockdetailsformtf`,
    data,
    true,
    "client"
  );
};
export const applyMtfPledge = (data) => {
  return apiCall(`${baseUrlPledge}/applyformtfpledge`, data, true, "client");
};

//BRANCH : MTF Pledge

export const mtfPledgeBranch = (data) => {
  return apiCall(
    `${baseUrlPledgeBranch}/getstockdetailsformtf`,
    data,
    false,
    "branch"
  );
};
export const applyMtfPledgeBranch = (data) => {
  return apiCall(
    `${baseUrlPledgeBranch}/applyforMtfPledge`,
    data,
    false,
    "branch"
  );
};

//Client buyback

export const buyback = (data) => {
  return apiCall(`${baseUrlBuyback}/getBuybackData`, data, true, "client");
};

export const applyforBuyback = (data) => {
  return apiCall(`${baseUrlBuyback}/applyforbuyback`, data, true, "client");
};

export const viewClientOrders = (data) => {
  return apiCall(
    `${baseUrlBuyback}/getbuybackorderdetails`,
    data,
    true,
    "client"
  );
};

export const deleteOrders = (data) => {
  return apiCall(`${baseUrlBuyback}/deleteorder`, data, true, "client");
};

//Branch buyback

export const ongoingBuyback = (data) => {
  return apiCall(
    `${baseUrlBuybackBranch}/ongoingbuybacks`,
    data,
    false,
    "branch"
  );
};

export const ongoingBuybacksConfig = (data) => {
  return apiCall(
    `${baseUrlBuybackBranch}/ongoingbuybacksconfig`,
    data,
    false,
    "branch"
  );
};

export const buybackBranch = (data) => {
  return apiCall(
    `${baseUrlBuybackBranch}/getclientlist`,
    data,
    false,
    "branch"
  );
};

export const applyforBuybackBranch = (data) => {
  return apiCall(
    `${baseUrlBuybackBranch}/applyforbuyback`,
    data,
    false,
    "branch"
  );
};

//HO Buyback
//Add Buyback
export const addBuyback = (data) => {
  return apiCall(`${baseUrlBuybackHO}/addbuybackconfig`, data, false, "branch");
};

//Edit Buyback
export const editBuyback = (data) => {
  return apiCall(
    `${baseUrlBuybackHO}/editbuybackconfig`,
    data,
    false,
    "branch"
  );
};

//getclientlist HO

export const BuybackHO = (data) => {
  return apiCall(`${baseUrlBuybackHO}/getclientlist`, data, false, "branch");
};

//applyforBuyback HO

export const applyforBuybackHO = (data) => {
  return apiCall(`${baseUrlBuybackHO}/applyforbuyback`, data, false, "branch");
};

// getBuybackorders HO

export const getallbuybackorderdetailsHO = (data) => {
  return apiCall(
    `${baseUrlBuybackHO}/getallbuybackdetails`,
    data,
    false,
    "branch"
  );
};

export const deleteBuybackOrder = (data) => {
  return apiCall(`${baseUrlBuybackHO}/deleteorder`, data, false, "branch");
};

export const generateBuybackFile = (data) => {
  return apiCall(`${baseUrlBuybackHO}/generatefiles`, data, false, "branch");
};

//NSDL BUYBACK HO
//getNSDLBuybackOrders
export const getNSDLBuybackOrders = (data) => {
  return apiCall(
    `${baseUrlBuybackHO}/NSDL/getBuybackOrders`,
    data,
    false,
    "branch"
  );
};

//applyNSDLBuybackHO
export const applyforNSDLBuybackHO = (data) => {
  return apiCall(
    `${baseUrlBuybackHO}/NSDL/applyforbuyback`,
    data,
    false,
    "branch"
  );
};

//deleteNSDLBuybackOrders
export const deleteNSDLBuybackOrdersHO = (data) => {
  return apiCall(`${baseUrlBuybackHO}/NSDL/deleteorder`, data, false, "branch");
};

//generateNSDLBuybackFile
export const generateNSDLBuybackFile = (data) => {
  return apiCall(
    `${baseUrlBuybackHO}/NSDL/generatefiles`,
    data,
    false,
    "branch"
  );
};

//getOrderbookDetailsHO
export const getOrderbookDetailsHO = (data) => {
  return apiCall(
    `${baseUrlBuybackHO}/getOrderbookDetails`,
    data,
    false,
    "branch"
  );
};

//orderbookUpload
export const orderbookUpload = (data) => {
  const commonHeaders = getCommonHeaders("branch");
  return axios.post(`${baseUrlBuybackHO}/orderbookUpload`, data, {
    headers: {
      "Content-Type": "multipart/form-data", // Important to handle form submissions
      Accept: "*/*",
      ...commonHeaders,
    },
  });
};

//buybackOrderbookMismatch
export const buybackOrderbookMismatch = (data) => {
  return apiCall(
    `${baseUrlBuybackHO}/getOrderBookMismatch`,
    data,
    false,
    "branch"
  );
};

//AllBuybackorderBRANCH
export const getBuybackOrderDetailsBranch = (data) => {
  return apiCall(
    `${baseUrlBuybackBranch}/getbuybackdetails`,
    data,
    false,
    "branch"
  );
};

//deleteBuybackOrderBranch
export const deleteBuybackOrderBranch = (data) => {
  return apiCall(`${baseUrlBuybackBranch}/deleteorder`, data, false, "branch");
};

//NSDL BUYBACK BRANCH
//getNSDLBuybackOrdersBranch
export const getNSDLBuybackOrdersBranch = (data) => {
  return apiCall(
    `${baseUrlBuybackBranch}/NSDL/getBuybackOrders`,
    data,
    false,
    "branch"
  );
};

//applyNSDLBuybackBranch
export const applyforNSDLBuybackBranch = (data) => {
  return apiCall(
    `${baseUrlBuybackBranch}/NSDL/applyforbuyback`,
    data,
    false,
    "branch"
  );
};

//deleteNSDLBuybackOrdersBranch
export const deleteNSDLBuybackOrdersBranch = (data) => {
  return apiCall(
    `${baseUrlBuybackBranch}/NSDL/deleteorder`,
    data,
    false,
    "branch"
  );
};

//getOrderbookDetailsBranch
export const getOrderbookDetailsBranch = (data) => {
  return apiCall(
    `${baseUrlBuybackBranch}/getOrderbookDetails`,
    data,
    false,
    "branch"
  );
};

//CDSL OTHER || NON-POA  -- HO

//getCDSLOtherBuybackOrders
export const getCDSLOtherBuybackOrders = (data) => {
  return apiCall(
    `${baseUrlBuybackHO}/CDSL/OTHER/getBuybackOrders`,
    data,
    false,
    "branch"
  );
};

//applyCDSLOtherBuybackHO
export const applyforCDSLOtherBuybackHO = (data) => {
  return apiCall(
    `${baseUrlBuybackHO}/CDSL/OTHER/applyforbuyback`,
    data,
    false,
    "branch"
  );
};

//deleteCDSLOtherBuybackOrders
export const deleteCDSLOtherBuybackOrdersHO = (data) => {
  return apiCall(
    `${baseUrlBuybackHO}/CDSL/OTHER/deleteorder`,
    data,
    false,
    "branch"
  );
};

//CDSL OTHER || NON-POA  -- BRANCH

//getCDSLOtherBuybackOrders
export const getCDSLOtherBuybackOrdersBranch = (data) => {
  return apiCall(
    `${baseUrlBuybackBranch}/CDSL/OTHER/getBuybackOrders`,
    data,
    false,
    "branch"
  );
};

//applyCDSLOtherBuybackHO
export const applyforCDSLOtherBuybackBranch = (data) => {
  return apiCall(
    `${baseUrlBuybackBranch}/CDSL/OTHER/applyforbuyback`,
    data,
    false,
    "branch"
  );
};

//deleteCDSLOtherBuybackOrders
export const deleteCDSLOtherBuybackOrdersBranch = (data) => {
  return apiCall(
    `${baseUrlBuybackBranch}/CDSL/OTHER/deleteorder`,
    data,
    false,
    "branch"
  );
};

//generateCDSLOtherBuybackFile
export const generateCDSLOtherBuybackFile = (data) => {
  return apiCall(
    `${baseUrlBuybackHO}/CDSL/OTHER/generatefiles`,
    data,
    false,
    "branch"
  );
};

// RightsIssue HO
//ongoing RightsIssue
export const ongoingRightsIssue = (data) => {
  return apiCall(
    `${baseUrlBuybackHO}/ongoingrightsissue`,
    data,
    false,
    "branch"
  );
};

//ongoing RightsIssue Config
export const ongoingRightsIssueConfig = (data) => {
  return apiCall(
    `${baseUrlBuybackHO}/ongoingrightsissue/config`,
    data,
    false,
    "branch"
  );
};

// Add RightsIssue
export const addRightsIssue = (data) => {
  return apiCall(`${baseUrlBuybackHO}/addrightsissue`, data, false, "branch");
};

// Edit RightsIssue

export const editRightsIssue = (data) => {
  return apiCall(`${baseUrlBuybackHO}/editrightsissue`, data, false, "branch");
};

//rightsissueUpload

export const rightsissueUpload = (data) => {
  const commonHeaders = getCommonHeaders("branch");
  return axios.post(`${baseUrlBuybackHO}/rightsissueUpload`, data, {
    headers: {
      "Content-Type": "multipart/form-data", // Important to handle form submissions
      Accept: "*/*",
      ...commonHeaders,
    },
  });
};

//RightsIssueLogs

export const rightsIssueLog = (data) => {
  return apiCall(
    `${baseUrlBuybackHO}/getRightsIssueLogs`,
    data,
    false,
    "branch"
  );
};

// Ledger
export const getLedger = () => {
  return apiCall(
    `${PESB_URL}/report/client/client_fa_summary`,
    {},
    true,
    "client"
  );
};

// stt_certificate
export const stt_certificate = (data) => {
  return apiCall(
    `${PESB_URL}/report/client/stt_certificate`,
    data,
    true,
    "client"
  );
};

// Ledger Book
export const ledgerBook = (data) => {
  return apiCall(`${PESB_URL}/report/client/ledger`, data, true, "client");
};
export const crSauda = (data) => {
  return apiCall(`${PESB_URL}/report/client/cr_sauda`, data, true, "client");
};

// Global Report
export const globalReport = (data) => {
  return apiCall(`${PESB_URL}/report/client/global`, data, true, "client");
};

// Annual PL
export const annualPL = (data) => {
  return apiCall(`${PESB_URL}/report/client/annual_p_l`, data, true, "client");
};
export const annualPLFNO = (data) => {
  return apiCall(
    `${PESB_URL}/report/client/multi_date_os_position`,
    data,
    true,
    "client"
  );
};
export const annualPLMCX = (data) => {
  return apiCall(
    `${PESB_URL}/report/client/multi_date_os_position_mcx`,
    data,
    true,
    "client"
  );
};
export const annualPLSummary = (data) => {
  return apiCall(
    `${PESB_URL}/report/client/annual_p_l_summary`,
    data,
    true,
    "client"
  );
};

//Trade Report
export const getTradeDetails = (data) => {
  return apiCall(
    `${PESB_URL}/report/client/getTradeDetails`,
    data,
    true,
    "client"
  );
};

//Position
export const position = (data) => {
  return apiCall(`${PESB_URL}/report/client/position`, data, true, "client");
};

//Global PortFolio
export const getGlobalPortFolio = (data) => {
  return apiCall(
    `${PESB_URL}/report/client/getGlobalPortFolio`,
    data,
    true,
    "client"
  );
};

export const getMtfFundedScripDetails = (data) => {
  return apiCall(
    `${PESB_URL}/report/client/getMtfFundedScripDetails`,
    data,
    true,
    "client"
  );
};
export const mtfCollateralScripDetails = (data) => {
  return apiCall(
    `${PESB_URL}/report/client/mtfCollateralScripDetails`,
    data,
    true,
    "client"
  );
};
export const getMtfMarginSummary = (data) => {
  return apiCall(
    `${PESB_URL}/report/client/getMtfMarginSummary`,
    data,
    true,
    "client"
  );
};

//Holding Mismatch
export const getHoldingMismatch = (data) => {
  return apiCall(
    `${PESB_URL}/report/client/getHoldingMismatch`,
    data,
    true,
    "client"
  );
};

//Add Portfolio
export const addPortfolio = (data) => {
  return apiCall(
    `${PESB_URL}/report/client/addPortfolio`,
    data,
    true,
    "client"
  );
};

//Add Birthday Stock
export const birthdayRecentStock = (params) => {
  const commonHeaders = getCommonHeaders("branch");
  return axios.get(`${PESB_URL}/whatsapp/branch/birthday/getRecentStock`, {
    params, // Use params for query parameters in GET requests
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
      ...commonHeaders,
    },
  });
};

export const birthdayAddStock = (data) => {
  return apiCall(
    `${PESB_URL}/whatsapp/branch/birthday/addstock`,
    data,
    false,
    "branch"
  );
};

//Email Template
export const emailTemplate = (data) => {
  return apiCall(
    `${PESB_URL}/email/branch/getTemplateList`,
    data,
    false,
    "branch"
  );
};
export const emailTemplateHistory = (data) => {
  return apiCall(
    `${PESB_URL}/email/branch/HO/viewHistory`,
    data,
    false,
    "branch"
  );
};

export const emailComplianceRecords = (data) => {
  const commonHeaders = getCommonHeaders("branch");
  return axios.post(`${PESB_URL}/email/branch/COMPLIANCE_RECORDS`, data, {
    headers: {
      "Content-Type": "multipart/form-data", // Important to handle form submissions
      Accept: "*/*",
      ...commonHeaders,
    },
  });
};

export const createEmailTemplate = (data) => {
  return apiCall(
    `${PESB_URL}/email/branch/CREATE_EMAIL_TEMPLATE`,
    data,
    false,
    "branch"
  );
};
export const getSendgridApiKey = (data) => {
  return apiCall(
    `${PESB_URL}/email/branch/getSendgridApiKey`,
    data,
    false,
    "branch"
  );
};

export const downloadAttachment = (data) => {
  return apiCall(
    `${PESB_URL}/email/branch/HO/downloadAttachment`,
    data,
    false,
    "branch"
  );
};

export const sendEmailTemplate = (data) => {
  const commonHeaders = getCommonHeaders("branch");
  return axios.post(`${PESB_URL}/email/branch/sendEmail`, data, {
    headers: {
      "Content-Type": "multipart/form-data", // Important to handle form submissions
      Accept: "*/*",
      ...commonHeaders,
    },
  });
};

export const emailBounce = (data) => {
  const commonHeaders = getCommonHeaders("branch");
  return axios.post(`${PESB_URL}/whatsapp/branch/emailBounce/infrom`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
      Accept: "*/*",
      ...commonHeaders,
    },
  });
};

export const mailBounceLog = (data) => {
  const commonHeaders = getCommonHeaders("branch");
  return apiCall(
    `${PESB_URL}/whatsapp/branch/emailBounce/getSentLog`,
    data,
    false,
    "branch"
  );
};

export const mailBounceCount = (data) => {
  const commonHeaders = getCommonHeaders("branch");
  return apiCall(
    `${PESB_URL}/whatsapp/branch/emailBounce/getSentCount`,
    data,
    false,
    "branch"
  );
};

// mergeCollateralFiles
export const getCuspaLedgerMessageLog = (data) => {
  return apiCall(
    `${PESB_URL}/whatsapp/branch/getCuspaLedgerMessageLog`,
    data,
    false,
    "branch"
  );
};
export const marginUtilizationAlertForSpecificScripts = (data) => {
  return apiCall(
    `${PESB_URL}/whatsapp/branch/marginUtilizationAlertForSpecificScripts`,
    data,
    false,
    "branch"
  );
};
export const runClientMarginUtilizationAlertTest = (data) => {
  return apiCall(
    `${PESB_URL}/whatsapp/branch/runClientMarginUtilizationAlert/test`,
    data,
    false,
    "branch"
  );
};
export const cuspaLedgerMessage = (data) => {
  return apiCall(
    `${PESB_URL}/whatsapp/branch/cuspaLedgerMessage`,
    data,
    false,
    "branch"
  );
};
export const runClientMarginUtilizationAlert = (data) => {
  return apiCall(
    `${PESB_URL}/whatsapp/branch/runClientMarginUtilizationAlert`,
    data,
    false,
    "branch"
  );
};
export const epiAdhockLimitFileGenereration = (data) => {
  return apiCall(
    `${PESB_URL}/files/branch/epiAdhockLimitFileGenereration`,
    data,
    false,
    "branch"
  );
};
export const mergeCollateralFiles = (data) => {
  return apiCall(
    `${PESB_URL}/files/branch/mergeCollateralFiles`,
    data,
    false,
    "branch"
  );
};

// eodAllocationFileGeneration
export const eodAllocationFileGeneration = (data) => {
  return apiCall(
    `${PESB_URL}/files/branch/eodAllocationFileGeneration`,
    data,
    true,
    "branch"
  );
};

// sendeodLedgerMessages
export const sendeodLedgerMessages = (data) => {
  return apiCall(
    `${PESB_URL}/whatsapp/branch/sendeodLedgerMessages`,
    data,
    true,
    "branch"
  );
};

// epnprocessedrecords
export const epnprocessedrecords = (data) => {
  return apiCall(
    `${baseUrlBackofficeBranch}/epnprocessedrecords`,
    data,
    false,
    "branch"
  );
};

// epnstatus
export const epnstatus = (data) => {
  return apiCall(`${baseUrlBackofficeBranch}/epnstatus`, data, false, "branch");
};

// branchHolding
export const branchHolding = (data) => {
  return apiCall(`${baseUrlBackofficeBranch}/holding`, data, false, "branch");
};

// isindetails
export const isindetails = (data) => {
  return apiCall(
    `${baseUrlBackofficeBranch}/isindetails`,
    data,
    false,
    "branch"
  );
};

// clientBODetails
export const clientBODetails = (data) => {
  return apiCall(
    `${baseUrlBackofficeBranch}/clientBoDetails`,
    data,
    false,
    "branch"
  );
};

//Employee Mangement
export const empDetails = (data) => {
  return apiCall(
    `${baseUrlBackofficeBranch}/getEmployeeList`,
    data,
    false,
    "branch"
  );
};
//Add Employee
export const addEmployee = (data) => {
  return apiCall(
    `${baseUrlBackofficeBranch}/addemployee`,
    data,
    false,
    "branch"
  );
};

//Edit Employee
export const editEmployee = (data) => {
  return apiCall(
    `${baseUrlBackofficeBranch}/editemployee`,
    data,
    false,
    "branch"
  );
};

//Change Password
export const changeEmployeePassword = (data) => {
  return apiCall(
    `${baseUrlBackofficeBranch}/updateemployeepassword`,
    data,
    false,
    "branch"
  );
};

// IPO
export const ipoDetails = (data) => {
  return apiCall(`${baseUrlIPO}/ipodetails`, data, false, "client");
};

// IPO Client
export const getClientData = (data) => {
  return apiCall(`${baseUrlIPO}/client/getclientdata`, data, true, "client");
};
export const applyIPOClient = (data) => {
  return apiCall(`${baseUrlIPO}/client/applyipo`, data, true, "client");
};
export const viewAppliedIPOClient = (data) => {
  return apiCall(`${baseUrlIPO}/client/viewAppliedIpo`, data, true, "client");
};
export const deleteOrderIPOClient = (data) => {
  return apiCall(`${baseUrlIPO}/client/deleteOrder`, data, true, "client");
};

// IPO Branch
export const getboidforclientBranch = (data) => {
  return apiCall(`${baseUrlIPO}/branch/getclientdata`, data, false, "branch");
};
export const applyIPOBranch = (data) => {
  return apiCall(`${baseUrlIPO}/branch/applyipo`, data, false, "branch");
};
export const viewAppliedIPOBranch = (data) => {
  return apiCall(`${baseUrlIPO}/branch/getIpoOrders`, data, false, "branch");
};
export const deleteOrderIPOBranch = (data) => {
  return apiCall(`${baseUrlIPO}/branch/deleteOrder`, data, false, "branch");
};
export const getclientdataBranch = (data) => {
  return apiCall(`${baseUrlIPO}/branch/getclientdata`, data, false, "branch");
};

// IPO HO
export const updateIpoMasterDetails = (data) => {
  return apiCall(
    `${baseUrlIPO}/branch/HO/updateIpoMasterDetails`,
    data,
    false,
    "branch"
  );
};
export const applyIPOHO = (data) => {
  return apiCall(`${baseUrlIPO}/branch/HO/applyipo`, data, false, "branch");
};
export const getclientdataHO = (data) => {
  return apiCall(
    `${baseUrlIPO}/branch/HO/getclientdata`,
    data,
    false,
    "branch"
  );
};
export const viewAppliedIPOHO = (data) => {
  return apiCall(`${baseUrlIPO}/branch/HO/getorders`, data, false, "branch");
};
export const deleteOrderIPOHO = (data) => {
  return apiCall(`${baseUrlIPO}/branch/HO/deleteOrder`, data, false, "branch");
};

// Sync cron IPO
export const syncCronIPO = (data) => {
  return apiCall(
    `${baseUrlIPO}/branch/HO/IpoMasterCron`,
    data,
    false,
    "branch"
  );
};

// IPO Guest
export const getIPOGuest = (data) => {
  return apiCall(`${baseUrlIPO}/guest/applyipo`, data, false, "guest");
};

export const fetchSOH = () => {
  return apiCall(`${PESB_URL}/report/client/soh`, {}, true, "client");
};
export const fetchHoldings = (data) => {
  return apiCall(`${PESB_URL}/report/client/holding_new`, data, true, "client");
};

//viewClientDetails
export const viewClientDetails = (data) => {
  return apiCall(
    `${PESB_URL}/backoffice/branch/clientProfile`,
    data,
    false,
    "branch"
  );
};

// UCC
export const uccDetails = (data) => {
  return apiCall(
    `${PESB_URL}/kyc/branch/uccUpload/getClients`,
    data,
    false,
    "branch"
  );
};

export const uploadToNSE = (data) => {
  return apiCall(
    `${PESB_URL}/kyc/branch/uccUpload/uploadToNSE`,
    data,
    false,
    "branch"
  );
};

export const uploadToBSE = (data) => {
  return apiCall(
    `${PESB_URL}/kyc/branch/uccUpload/uploadToBSE`,
    data,
    false,
    "branch"
  );
};

export const syncDataForClient = (data) => {
  return apiCall(
    `${PESB_URL}/backoffice/branch/syncDataForClient`,
    data,
    false,
    "branch"
  );
};

export const syncDataForAllClients = (data) => {
  return apiCall(
    `${PESB_URL}/backoffice/branch/syncDataForAllClients`,
    data,
    false,
    "branch"
  );
};

export const pancheck = (data) => {
  return apiCall(`${PESB_URL}/kyc/branch/pancheck`, data, false, "branch");
};

export const getUccStatus = (data) => {
  return apiCall(
    `${PESB_URL}/kyc/branch/uccUpload/getUccStatus`,
    data,
    false,
    "branch"
  );
};

// FO Interest Rate
export const getFoInterestRate = (data) => {
  return apiCall(
    `${baseUrlBackofficeBranch}/foInterestRateView`,
    data,
    false,
    "branch"
  );
};
//Add foInterestRate
export const addFoInterestRate = (data) => {
  return apiCall(
    `${baseUrlBackofficeBranch}/addFoInterestRate`,
    data,
    false,
    "branch"
  );
};

//Edit foInterestRate
export const editFoInterestRate = (data) => {
  return apiCall(
    `${baseUrlBackofficeBranch}/editFoInterestRate`,
    data,
    false,
    "branch"
  );
};

// Limit Config
export const getLimitConfig = (data) => {
  return apiCall(
    `${baseUrlBackofficeBranch}/limitConfigView`,
    data,
    false,
    "branch"
  );
};
//Add Limit Config
export const addLimitConfig = (data) => {
  return apiCall(
    `${baseUrlBackofficeBranch}/addLimitConfig`,
    data,
    false,
    "branch"
  );
};

//Edit Limit Config
export const editLimitConfig = (data) => {
  return apiCall(
    `${baseUrlBackofficeBranch}/editLimitConfig`,
    data,
    false,
    "branch"
  );
};

// ApplicableISINForMarginPledge Config
export const getApplIsinMarginPledgeView = (data) => {
  return apiCall(
    `${baseUrlBackofficeBranch}/applIsinMarginPledgeView`,
    data,
    false,
    "branch"
  );
};
//Add ApplicableISINForMarginPledge Config
export const addAddApplIsinMarginPledge = (data) => {
  return apiCall(
    `${baseUrlBackofficeBranch}/addApplIsinMarginPledge`,
    data,
    false,
    "branch"
  );
};

//Edit ApplicableISINForMarginPledge Config
export const EditApplIsinMarginPledge = (data) => {
  return apiCall(
    `${baseUrlBackofficeBranch}/editApplIsinMarginPledge`,
    data,
    false,
    "branch"
  );
};

// ApplicableISINForMTFPledge Config
export const getApplIsinMTFPledgeView = (data) => {
  return apiCall(
    `${baseUrlBackofficeBranch}/applIsinMTFPledgeView`,
    data,
    false,
    "branch"
  );
};
//Add ApplicableISINForMarginPledge Config
export const addAddApplIsinMTFPledge = (data) => {
  return apiCall(
    `${baseUrlBackofficeBranch}/addApplIsinMTFPledge`,
    data,
    false,
    "branch"
  );
};

//Edit ApplicableISINForMarginPledge Config
export const editApplIsinMTFPledge = (data) => {
  return apiCall(
    `${baseUrlBackofficeBranch}/editApplIsinMTFPledge`,
    data,
    false,
    "branch"
  );
};

// auth.js
export const isAuthenticated = () => {
  const token = getLocalStorageItem("token");
  return !!token; // Returns true if the token exists
};

// Family List
export const getActiveFamilyMembers = (data) => {
  return apiCall(
    `${PESB_URL}/backoffice/client/getActiveFamilyMembers`,
    data,
    false,
    "client"
  );
};
export const getClientsHavingMeAsFamilyMember = (data) => {
  return apiCall(
    `${PESB_URL}/backoffice/client/getClientsHavingMeAsFamilyMember`,
    data,
    false,
    "client"
  );
};
export const removeFamilyMember = (data) => {
  return apiCall(
    `${PESB_URL}/backoffice/client/removeFamilyMember`,
    data,
    false,
    "client"
  );
};
export const removeMyselfAsFamilyMember = (data) => {
  return apiCall(
    `${PESB_URL}/backoffice/client/removeMyselfAsFamilyMember`,
    data,
    false,
    "client"
  );
};
export const addFamilyMemberGetOtp = (data) => {
  return apiCall(
    `${PESB_URL}/backoffice/client/addFamilyMemberGetOtp`,
    data,
    false,
    "client"
  );
};
export const addFamilyMemberVerifyOtp = (data) => {
  return apiCall(
    `${PESB_URL}/backoffice/client/addFamilyMemberVerifyOtp`,
    data,
    false,
    "client"
  );
};

// KYC

export const GenerateOtpKYC = (data) => {
  return axios.post(`${PESB_URL}/kyc/GenerateOtp`, data);
};
export const VerifyOtpKYC = (data) => {
  return axios.post(`${PESB_URL}/kyc/VerifyOtp`, data);
};
export const SignInUpKYC = (data) => {
  return axios.post(`${PESB_URL}/kyc/Login`, data);
};

export const panCheckKYC = (data) => {
  // return apiCall(`${PESB_URL}/kyc/panCheck`, data);
  return axios.post(`${PESB_URL}/kyc/panCheck`, data, {
    headers: {
      "X-Skip-Global-Loading": "true",
    },
  });
};
export const generateKIDKYC = (data) => {
  return apiCall(`${PESB_URL}/kyc/member/generateKID`, data, false, "kyc");
};

export const getProfileDetailsKYC = (data) => {
  const commonHeaders = getCommonHeaders("kyc");
  return axios.post(`${PESB_URL}/kyc/member/getProfileDetails`, data, {
    headers: {
      "X-Skip-Global-Loading": "true",
      ...commonHeaders,
    },
  });
};
export const getKIDResponseKYC = (data) => {
  const commonHeaders = getCommonHeaders("kyc");
  return axios.post(`${PESB_URL}/kyc/member/getKIDResponse`, data, {
    headers: {
      "X-Skip-Global-Loading": "true",
      ...commonHeaders,
    },
  });
};

export const updateProfileTradingDataKYC = (data) => {
  return apiCall(
    `${PESB_URL}/kyc/member/updateProfileTradingData`,
    data,
    false,
    "kyc"
  );
};
export const addBoDetailsKYC = (data) => {
  return apiCall(
    `${PESB_URL}/depository/member/addBoDetails`,
    data,
    false,
    "kyc"
  );
};
export const addNomineeDetailsKYC = (data) => {
  return apiCall(
    `${PESB_URL}/depository/member/addNomineeDetails`,
    data,
    false,
    "kyc"
  );
};
export const addPOADetailsKYC = (data) => {
  return apiCall(
    `${PESB_URL}/depository/member/addPOADetails`,
    data,
    false,
    "kyc"
  );
};
export const addHolderDetailsKYC = (data) => {
  return apiCall(
    `${PESB_URL}/depository/member/addHolderDetails`,
    data,
    false,
    "kyc"
  );
};
export const fetchBoDetailsKYC = (data) => {
  const commonHeaders = getCommonHeaders("kyc");
  return axios.post(`${PESB_URL}/depository/member/fetchBoDetails`, data, {
    headers: {
      "X-Skip-Global-Loading": "true",
      ...commonHeaders,
    },
  });
};

export const fetchNomineeDetailsKYC = (data) => {
  const commonHeaders = getCommonHeaders("kyc");
  return axios.post(`${PESB_URL}/depository/member/fetchNomineeDetails`, data, {
    headers: {
      "X-Skip-Global-Loading": "true",
      ...commonHeaders,
    },
  });
};
export const fetchHolderDetailsKYC = (data) => {
  const commonHeaders = getCommonHeaders("kyc");
  return axios.post(`${PESB_URL}/depository/member/fetchHolderDetails`, data, {
    headers: {
      "X-Skip-Global-Loading": "true",
      ...commonHeaders,
    },
  });
};
export const fetchPOADetailsKYC = (data) => {
  const commonHeaders = getCommonHeaders("kyc");
  return axios.post(`${PESB_URL}/depository/member/fetchPOADetails`, data, {
    headers: {
      "X-Skip-Global-Loading": "true",
      ...commonHeaders,
    },
  });
};
export const getBankDataKYC = (data) => {
  const commonHeaders = getCommonHeaders("kyc");
  return axios.post(`${PESB_URL}/kyc/member/getBankData`, data, {
    headers: {
      "X-Skip-Global-Loading": "true",
      ...commonHeaders,
    },
  });
};
export const addClientBankDetailsKYC = (data) => {
  return apiCall(
    `${PESB_URL}/depository/member/addClientBankDetails`,
    data,
    false,
    "kyc"
  );
};
export const updateSegmentsKYC = (data) => {
  return apiCall(`${PESB_URL}/kyc/member/updateSegments`, data, false, "kyc");
};
export const pennyDropKYC = (data) => {
  return apiCall(
    `${PESB_URL}/kyc/member/bankVerify/pennyDrop`,
    data,
    false,
    "kyc"
  );
};

export const E_SignKYC = (data) => {
  return apiCall(`${PESB_URL}/kyc/member/E_Sign`, data, false, "kyc");
};

export const createEsignKYC = (data) => {
  const commonHeaders = getCommonHeaders("branch");
  const DIGIO_USERNAME = "AIRZ9JD4M46VKVO6J4CGIW2M9CUOYFIX";
  const DIGIO_PASSWORD = "JSKQHZT3UC1O5JXIZJ6E27KINMIV76HR";
  const authHeader = "Basic " + btoa(`${DIGIO_USERNAME}:${DIGIO_PASSWORD}`);

  return axios.post(`${PESB_URL}/kyc/createEsign`, data, {
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
      ...commonHeaders,
    },
  });
};
