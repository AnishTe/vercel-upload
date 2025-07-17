"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import Script from "next/script"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import * as z from "zod"
import {
    MapPin,
    User,
    FileSignature,
    CreditCard,
    Briefcase,
    Check,
    Loader2,
    CheckCircle,
    FileText,
    ChevronDown,
    ChevronRight,
    Info,
    AlertTriangle,
    Ban,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import { useKYC } from "@/contexts/kyc-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { format } from "date-fns"
import { Progress } from "@/components/ui/progress"
import { addBoDetailsKYC, fetchBoDetailsKYC, generateKIDKYC, getKIDResponseKYC, getProfileDetailsKYC, updateProfileTradingDataKYC } from "@/lib/auth"

import kycData from "@/data/kyc.json";
import { Switch } from "../ui/switch"
import { SearchableSelect } from "../Dashboard/UI_Components/searchableSelect"
import { DatePickerField } from "../Dashboard/UI_Components/datePicker"
import { motion } from "framer-motion";
import Image from "next/image"
import { getLocalStorage } from "@/utils/localStorage"
import { useKYCError } from "@/contexts/KYCErrorContext"

const { incomeOptions, occupationOptions, boCategoryOptions, boStatusOptions, boSubStatusOptions, nationalityCodes, boStatementCycleCode, stateCodes, countryCodes, beneficiaryTaxDed } = kycData;

// Add TypeScript declaration for Digio
declare global {
    interface Window {
        Digio: any
    }
}

const boDetailsSchema = z.object({
    accOpeningDate: z.date({
        required_error: "Account opening date is required",
    }),

    documentReceiveDate: z.date({
        required_error: "Document receive date is required",
    }),

    boStatus: z.string()
        .refine(val => boStatusOptions.map(o => o.value).includes(val), {
            message: "Please select a valid BO Status.",
        })
        .or(z.literal("").refine(() => false, {
            message: "BO Status is required.",
        })),

    boSubStatus: z.string()
        .refine(val => boSubStatusOptions.map(o => o.value).includes(val), {
            message: "Please select a valid BO Substatus.",
        })
        .or(z.literal("").refine(() => false, {
            message: "BO Substatus is required.",
        })),

    boAccountCategory: z.string()
        .refine(val => boCategoryOptions.map(o => o.value).includes(val), {
            message: "Please select a valid BO Category.",
        })
        .or(z.literal("").refine(() => false, {
            message: "BO Category is required.",
        })),
    boStatementCycleCode: z.string()
        .refine(val => boStatementCycleCode.includes(val), {
            message: "Please select a valid BO Category.",
        }),

    smsFacility: z.string()
        .refine(val => [
            "Smart Registration / SMS Facility",
            "No Smart Registration / No SMS Facility",
        ].includes(val), {
            message: "SMS Facility selection is required",
        }),

    accountOpeningSrc: z.string()
        .refine(val => ["Online Account opening by the BO", "Account Opening based on submission of Physical form", "Default"].includes(val), {
            message: "Account opening source is required",
        }),
    communicationsToBeSentTo: z.string()
        .refine(val => ["First Holder",
            "Second Holder",
            "Third Holder",
            "All Holders"].includes(val), {
            message: "Communications Preference is required",
        }),
    beneficiaryTaxDed: z.string().optional(),
    // .refine(val => beneficiaryTaxDed.map(o => o.value).includes(val), {
    //     message: "Beneficiary Tax Ded is required",
    // }),
    branch: z.string().optional(),
    fixChargeModule: z.string().optional(),
    // .refine(val => ["100POA_KRA",
    //     "200POA_KRA",
    //     "KRA",
    //     "KRA_POA_NE"].includes(val), {
    //     message: "Fix Charge Module is required",
    // }),
    modeOfOperation: z.string().min(1, "Mode of operation is required"),
    standingInstructionIndicator: z.boolean().default(false),
    boSettlementPlanningFlag: z.boolean().default(true),
    prefDepositoryFlag: z.enum(["CDSL", "NSDL"]).optional(),
    mentalDisability: z.boolean().default(false),
    autoPledgeIndicator: z.boolean().default(false),
    annualReportFlag: z.boolean().default(false),
    electronicConfirmation: z.boolean().default(false).optional(),
    geographicalCode: z.string().optional(),
    clientEStatementFlag: z.string().optional(),
}).refine(
    (data) =>
        !!data.communicationsToBeSentTo,
    {
        message: "Communications preference is required for non-individual clients",
        path: ["communicationsToBeSentTo"],
    }
)

const normalizeGender = (val: string) => {
    const lower = val.toLowerCase()
    if (lower === "m" || lower === "male") return "male"
    if (lower === "f" || lower === "female") return "female"
    if (lower === "ts" || lower === "transgender") return "transgender"
    return ""
}

function normalizeYesNo(value: any): "yes" | "no" | undefined {
    if (value === 1 || value === "yes" || value === "1") return "yes";
    if (value === 0 || value === "no" || value === "0") return "no";
    return undefined;
}

const personalDetailsFormSchema = z.object({
    // Permanent Address
    permanentAddressLine1: z.string().min(5, "Permanent Address line 1 must be at least 5 characters."),
    permanentCity: z.string().min(2, "Permanent Address City must be at least 2 characters."),
    permanentPincode: z.string().regex(/^\d{6}$/, "Permanent Address Pincode must be 6 digits."),
    permanentState: z.string()
        .refine(val => stateCodes.map(o => o.value).includes(val), {
            message: "Please select a valid Permanent Address State.",
        })
        .or(z.literal("").refine(() => false, {
            message: "Valid Permanent Address State is required.",
        })),
    permanentCountry: z.string()
        .refine(val => countryCodes.map(o => o.value).includes(val), {
            message: "Please select a valid Permanent Address Country.",
        })
        .or(z.literal("").refine(() => false, {
            message: "Valid Permanent Address Country is required.",
        })),

    // Correspondence Address
    sameAsPermanent: z.boolean().default(false),
    correspondenceAddressLine1: z.string().optional(),
    correspondenceCity: z.string().optional(),
    correspondenceState: z.string()
        .refine(val => stateCodes.map(o => o.value).includes(val), {
            message: "Please select a valid Correspondence Address State.",
        })
        .or(z.literal("").refine(() => false, {
            message: "Valid Correspondence Address State is required.",
        })),
    correspondencePincode: z.string().optional(),
    correspondenceCountry: z.string()
        .refine(val => countryCodes.map(o => o.value).includes(val), {
            message: "Please select a valid Correspondence Address Country.",
        })
        .or(z.literal("").refine(() => false, {
            message: "Valid Correspondence Address Country is required.",
        })),

    // Personal Info
    firstName: z.string().min(3, "First name must be at least 3 characters."),
    middleName: z.string().min(3, "Middle name must be at least 3 characters."),
    lastName: z.string().min(3, "Last name must be at least 3 characters."),
    mobile: z
        .string({
            required_error: "Mobile number is required",
            invalid_type_error: "Mobile must be a string",
        })
        .regex(/^\d{10}$/, "Mobile must be a 10-digit number"),

    email: z
        .string({
            required_error: "Email is required",
            invalid_type_error: "Email must be a string",
        })
        .email("Invalid email format"),
    nationality: z.string()
        .refine(val => nationalityCodes.map(o => o.value).includes(val), {
            message: "Please select a valid nationality.",
        })
        .or(z.literal("").refine(() => false, {
            message: "Valid Nationality is required.",
        })),
    aadharSchema: z
        .string({
            required_error: "Aadhar is required",
            invalid_type_error: "Aadhar must be a string",
        })
        .min(1, "Aadhar is required")
        .refine(
            (val) => /^\d{12}$/.test(val) || /^(\*{8}|x{8})\d{4}$/.test(val),
            {
                message: "Aadhar must be a 12-digit number or a valid masked format.",
            }
        ),
    pan: z.string()
        .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/i, "Invalid PAN format")
        .transform(val => val.toUpperCase()),

    proofType: z.preprocess(
        (val) => val === "" ? undefined : val,
        z.enum(["passport", "driving_license", "voter_id"], {
            required_error: "Please select your proof type.",
            invalid_type_error: "Invalid proof type selected.",
        })
    ),
    proofNumber: z
        .string({
            required_error: "Proof number is required",
        })
        .min(3, "Proof number is required "),

    dobSchema: z.string().refine((val) => {
        const date = new Date(val);
        return !isNaN(date.getTime()) && date <= new Date();
    }, {
        message: "Date of birth must be a valid past date",
    }),

    genderSchema: z.string()
        .refine(val => ["male", "female", "transgender", "Other"].includes(val), {
            message: "Please select gender",
        }),

    maritalStatus: z.preprocess(
        (val) => val === "" ? undefined : val,
        z.enum(["single", "married", "divorced", "widowed"], {
            required_error: "Please select your marital status.",
            invalid_type_error: "Invalid marital status selected.",
        })
    ),

    tradingExperience: z.string()
        .refine(val => ["none", "beginner", "intermediate", "advanced"].includes(val), {
            message: "Please select your trading experience.",
        })
        .or(z.literal("").refine(() => false, {
            message: "Trading Experience is required.",
        })),

    occupationType: z.string()
        .refine(val => occupationOptions.flatMap(group =>
            group.options.map(opt => opt.value)
        ).includes(val), {
            message: "Please select a valid occupation type.",
        })
        .or(z.literal("").refine(() => false, {
            message: "Occupation type is required.",
        })),
    annualIncome: z.string()
        .refine(val => incomeOptions.map(o => o.value).includes(val), {
            message: "Please select a valid annual income range.",
        })
        .or(z.literal("").refine(() => false, {
            message: "Valid Annual Income is required.",
        })),

    residentialStatus: z.preprocess(
        (val) => val === "" ? undefined : val,
        z.enum(["ResidentIndividual", "NonResident", "ForeignNational", "PersonOfIndianOrigin"], {
            required_error: "Residential Status Required!",
            invalid_type_error: "Residential Status Required!",
        })
    ),
    application_type: z.preprocess(
        (val) => val === "" ? undefined : val,
        z.enum(["Individual", "HUF", "NonIndividual", "NRI", "ForeignNational"], {
            required_error: "Application Type is Required!",
            invalid_type_error: "Application Type is Required!",
        })
    ),

    // Father/Spouse
    fatherSpouseTitle: z.preprocess(
        (val) => val === "" ? undefined : val,
        z.enum(["mr", "mrs", "ms", "dr"], {
            required_error: "Title is Required!",
            invalid_type_error: "Title is Required!",
        })
    ),
    fatherSpouseName: z.string().min(3, "Name must be at least 3 characters."),

    // Mother
    motherFirstName: z.string().min(1, "First name is required."),
    motherMiddleName: z.string().optional(),
    motherLastName: z.string().min(1, "Last name is required."),

    // Account Options
    openFreshAccount: z.enum(["yes", "no"], {
        required_error: "Please select an option.",
    }),
    bsdaOption: z.preprocess(
        (val) => val === "" ? undefined : val,
        z.enum(["YES", "NO", "OPTED OUT"], {
            required_error: "Please select a BSDA option.",
            invalid_type_error: "Please select a BSDA option.",
        })
    ),

    // Misc
    politicallyExposed: z.enum(["yes", "no"], {
        required_error: "Please select whether you are politically exposed.",
    }),
    accountSettlement: z.preprocess(
        (val) => val === "" ? undefined : val,
        z.enum(["monthly", "quarterly"], {
            required_error: "Please select an account settlement frequency.",
            invalid_type_error: "Please select an account settlement frequency.",
        })
    ),

    // Nested Schema
    boDetails: boDetailsSchema,

    // Uploads
    panCardUpload: z.union([z.instanceof(File), z.null()]).optional(),
    signatureUpload: z.union([z.instanceof(File), z.null()]).optional(),
})
    .refine((data) => {
        if (data.sameAsPermanent) return true;
        return (
            !!data.correspondenceAddressLine1 &&
            !!data.correspondenceCity &&
            !!data.correspondenceState &&
            !!data.correspondencePincode &&
            /^\d{6}$/.test(data.correspondencePincode)
        );
    }, {
        message: "Please fill all required correspondence address fields",
        path: ["correspondenceAddressLine1"],
    })

const getTextByValue = (codeArray, value) => {
    return codeArray.find(item => item.value === value)?.text || '';
};

type PersonalDetailsFormValues = z.infer<typeof personalDetailsFormSchema>

export default function PersonalDetailsForm() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [panPreview, setPanPreview] = useState<string | null>(null)
    const [signaturePreview, setSignaturePreview] = useState<string | null>(null)
    const [formInitialized, setFormInitialized] = useState(false)
    const [formProgress, setFormProgress] = useState({
        personal: 0,
        address: 0,
        additional: 0,
        overall: 0,
    })
    const [activeSection, setActiveSection] = useState<string | null>(null)
    const [isLoadingProfileData, setIsLoadingProfileData] = useState(false)
    const [expandedSections, setExpandedSections] = useState({
        personal: true,
        address: false,
        additional: false,
    });
    const [isKRAFetched, setIsKRAFetched] = useState(false);
    const [isFormEditable, setIsFormEditable] = useState(false);
    const [kraPrefilledFields, setKraPrefilledFields] = useState<Set<string>>(new Set());
    const isFieldDisabled = (fieldName: string) =>
        isKRAFetched && !isFormEditable && kraPrefilledFields.has(fieldName);
    const [kraMismatchWarning, setKraMismatchWarning] = useState<string | null>(null);
    const [isDigioLocked, setIsDigioLocked] = useState(false);
    const [showRetryButton, setShowRetryButton] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);

    const { updateStepStatus, setKycId, handleStepCompletion, checkTokenValidity } = useKYC()
    const { toast } = useToast()
    const { registerFieldRef, setErrors } = useKYCError();

    // Digio related refs
    const personalSectionRef = useRef<HTMLDivElement>(null)
    const addressSectionRef = useRef<HTMLDivElement>(null)
    const additionalSectionRef = useRef<HTMLDivElement>(null)
    const digioInstanceRef = useRef<any>(null)

    const signInDetails = getLocalStorage("kyc_signin_form")
    let parsedsigninDetails
    if (signInDetails) {
        parsedsigninDetails = JSON.parse(signInDetails);
    }

    // Update default values to include new holder fields
    const defaultValues = useMemo<Partial<PersonalDetailsFormValues>>(
        () => ({
            // Address defaults
            permanentAddressLine1: "",
            permanentCity: "",
            permanentState: "",
            permanentPincode: "",
            permanentCountry: "IN",
            sameAsPermanent: false,
            correspondenceAddressLine1: "",
            correspondenceCity: "",
            correspondenceState: "",
            correspondenceCountry: "IN",
            correspondencePincode: "",

            // Profile defaults
            firstName: "",
            lastName: "",
            middleName: "",
            email: "",
            nationality: "IN",
            mobile: "",
            aadharSchema: "",
            pan: parsedsigninDetails?.panNumber || "",
            dobSchema: "",
            proofType: undefined,
            proofNumber: "",
            genderSchema: "male",
            maritalStatus: "single",
            tradingExperience: "",
            occupationType: "salaried",
            annualIncome: "below_5l",
            residentialStatus: undefined,
            application_type: undefined,
            fatherSpouseTitle: undefined,
            fatherSpouseName: "",
            motherFirstName: "",
            motherMiddleName: "",
            motherLastName: "",
            openFreshAccount: "yes",
            bsdaOption: "YES",
            politicallyExposed: "no",
            accountSettlement: "quarterly",
            panCardUpload: null,
            signatureUpload: null,

            boDetails: {
                accOpeningDate: new Date(),
                documentReceiveDate: new Date(),
                boStatus: "ACTIVE",
                boSubStatus: "REGULAR",
                smsFacility: "Smart Registration / SMS Facility",
                branch: "",
                modeOfOperation: "Sole Holder",
                standingInstructionIndicator: false,
                boSettlementPlanningFlag: true,
                mentalDisability: false,
                prefDepositoryFlag: "CDSL",
                autoPledgeIndicator: false,
                annualReportFlag: false,
                boStatementCycleCode: "MONTHLY",
                electronicConfirmation: false,
                geographicalCode: "",
                boAccountCategory: "INDIVIDUAL",
                accountOpeningSrc: "ONLINE",
                clientEStatementFlag: "",
                beneficiaryTaxDed: "",
                fixChargeModule: "",
                communicationsToBeSentTo: "",
                bsdaFlag: "YES"
            },
        }),
        [parsedsigninDetails?.panNumber],
    )

    const form = useForm<PersonalDetailsFormValues>({
        resolver: zodResolver(personalDetailsFormSchema),
        defaultValues: defaultValues as PersonalDetailsFormValues,
        mode: "onChange",
    })

    function mergeProfileAndKRA(profile: any, kra: any): any {
        const parseJSON = (str: string | null) => {
            try {
                return str ? JSON.parse(str) : {};
            } catch {
                return {};
            }
        };

        const permanent_address = parseJSON(kra?.permanent_address || null);
        const correspondence_address = parseJSON(kra?.correspondence_address || null);

        return {
            ...profile,
            ...kra,
            pan: profile?.pan || {},
            aadhaar: profile?.aadhaar || {},
            permanent_address,
            correspondence_address,
            mobile_number: kra?.mobile_number,
            dob: kra?.dob,
            full_name: kra?.full_name,
            gender: kra?.gender,
        };
    }

    function formatDate(date: string): string {
        // Handle formats like "20/04/2003" or "2003-04-20"
        if (!date) return "";
        if (date.includes("/")) {
            const [dd, mm, yyyy] = date.split("/");
            return `${yyyy}-${mm}-${dd}`;
        }
        return date;
    }

    const normalizeMobile = (mobile: string) => {
        // Remove all non-digit characters (like +, -, spaces), then take the last 10 digits
        return mobile?.replace(/\D/g, "").slice(-10);
    };

    const mergeAllAddressLines = (addressObj?: Record<string, string | undefined>) => {
        if (!addressObj) return "";

        return Object.entries(addressObj)
            .filter(([key, value]) => key.startsWith("address_line") && value?.trim())
            .sort(([a], [b]) => {
                // Sort like address_line1, address_line2, etc.
                const numA = parseInt(a?.replace("address_line", ""), 10);
                const numB = parseInt(b?.replace("address_line", ""), 10);
                return numA - numB;
            })
            .map(([_, value]) => value!.trim())
            .join(", ");
    };

    const initializeDigio = () => {
        if (typeof window === "undefined" || !window.Digio || digioInstanceRef.current) return

        try {
            const options = {
                environment: "sandbox",
                callback: (response: any) => {
                    sessionStorage.setItem("digio_response", JSON.stringify(response))
                    localStorage.setItem("digio_response", JSON.stringify(response))
                    console.log("Response is: ", response)

                    if (response.hasOwnProperty("error_code")) {
                        toast({
                            title: "Verification failed",
                            description: "There was an error during the verification process.",
                            variant: "destructive",
                        })
                    } else {
                        console.log("Signing completed successfully")
                        // completeSignIn()
                    }
                },
                logo: "https://pesb.co.in/imgs/logo.png",
                is_redirection_approach: true,
                redirect_url: `https://capital.pesb.co.in:5500/kyc/personal-details.html`,
                // redirect_url: `http://localhost:3000/kyc/personal-details`,
                is_iframe: false,
                theme: {
                    primaryColor: "#1F002A",
                    secondaryColor: "#444444",
                },
                event_listener: (event: any) => {
                    localStorage.setItem("Received event", event.event)
                    sessionStorage.setItem("Received event", event.event)
                    console.log("Received event: " + event.event)
                },
            }

            digioInstanceRef.current = new window.Digio(options)
            console.log("Digio instance created successfully")
        } catch (error) {
            console.error("Error initializing Digio:", error)
            toast({
                title: "Error",
                description: "Failed to initialize verification service. Please try again.",
                variant: "destructive",
            })
        }
    }

    // If script is already present (e.g. navigation back), trigger init
    useEffect(() => {
        if (typeof window !== "undefined" && window.Digio && !digioInstanceRef.current) {
            initializeDigio()
        }
    }, [])

    const fetchBODetails = useCallback(async () => {
        try {
            setIsLoadingProfileData(true);

            const tradingID = sessionStorage.getItem("TradingId")
            if (!tradingID) {
                toast({
                    title: "Error",
                    description: "Can't fetch the BO details, missing Trading ID.",
                    variant: "destructive",
                });
                return
            }

            const boResponse = await fetchBoDetailsKYC({ tradingId: tradingID })
            if (!checkTokenValidity(boResponse?.data?.tokenValidity)) return;
            console.log(boResponse);

            if (boResponse.status === 200) {
                const boData = boResponse.data.data[0]
                if (boData) {
                    console.log(boData.accOpeningDate);
                    const mappedBoData = {
                        // accOpeningDate: boData.accOpeningDate ? new Date(boData.accOpeningDate) : undefined,
                        // documentReceiveDate: boData.documentReceiveDate ? new Date(boData.documentReceiveDate) : undefined,

                        boStatus: boData.boStatus?.trim() || "",
                        boSubStatus: boData.boSubStatus?.trim() || "",
                        boAccountCategory: boData.boAccountCategory?.trim() || "",
                        boStatementCycleCode: boData.boStatementCycleCode?.trim() || "",

                        smsFacility: boData.smsFacility?.trim() || "",
                        accountOpeningSrc: boData.accountOpeningSrc?.trim() || "",
                        beneficiaryTaxDed: boData.beneficiaryTaxDed?.trim() || "",
                        communicationsToBeSentTo: boData.communicationsToBeSentTo?.trim() || "",
                        fixChargeModule: boData.fixChargeModule?.trim() || "",

                        modeOfOperation: boData.modeOfOperation?.trim() || "",
                        branch: boData.branch?.trim() || "",

                        standingInstructionIndicator: normalizeBool(boData.standingInstructionIndicator),
                        boSettlementPlanningFlag: normalizeBool(boData.boSettlementPlanningFlag),
                        mentalDisability: normalizeBool(boData.mentalDisability),
                        prefDepositoryFlag: boData.prefDepositoryFlag,
                        autoPledgeIndicator: normalizeBool(boData.autoPledgeIndicator),
                        annualReportFlag: normalizeBool(boData.annualReportFlag),

                        electronicConfirmation: boData.electronicConfirmation?.trim() || false,
                        geographicalCode: boData.geographicalCode?.trim() || "",
                        clientEStatementFlag: boData.clientEStatementFlag?.trim() || "",

                        bsdaFlag: boData.bsdaFlag?.trim() || "NO", // default or from response
                    };

                    // ✅ Prefilled fields
                    const prefilled = new Set<string>();
                    Object.entries(mappedBoData).forEach(([key, value]) => {
                        if (value !== undefined && value !== null && value !== "") {
                            prefilled.add(key);
                        }
                    });

                    console.log(mappedBoData);
                    // ✅ Update form
                    form.reset({ ...form.getValues(), boDetails: mappedBoData });

                }
            } else {
                console.error("An error occured while API call.");
                toast({
                    title: "Error",
                    description: "An error occured while API call.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error fetching profile details:", error);
            toast({
                title: "Error",
                description: "Failed to fetch BO details.",
                variant: "destructive",
            });
        } finally {
            setIsLoadingProfileData(false);
        }
    }, [checkTokenValidity, form, toast])

    const fetchProfileDetails = useCallback(async (retryForce = false) => {
        // ✅ Always start loading
        setIsLoadingProfileData(true);

        // ✅ Get values from session
        const docsFetched = sessionStorage.getItem("docs_fetched");
        const selfieFetched = sessionStorage.getItem("selfie_fetched");
        const digioStatus = sessionStorage.getItem("digioStatus");
        const kid = sessionStorage.getItem("digioKID");
        const retryRequired = sessionStorage.getItem("digioRetryRequired") === "1";

        let panNumber = "";
        let mobileNumber = "";

        if (parsedsigninDetails) {
            panNumber = parsedsigninDetails.panNumber || "";
            mobileNumber = parsedsigninDetails.mobileNumber || "";
        }

        // ✅ Condition 1: Trigger Digio journey
        const shouldTriggerDigio =
            (docsFetched !== "1" || selfieFetched !== "1") &&
            panNumber && mobileNumber &&
            (!retryRequired || retryForce);

        // ✅ Condition 2: Returning from Digio
        const isReturningFromDigio = digioStatus === "success" && kid;

        // ✅ Condition 3: Docs already fetched
        const isDocsAlreadyFetched = docsFetched === "1" && selfieFetched === "1";

        // ✅ Condition 4: Digio failed or canceled
        const isDigioFailed = digioStatus === "failed" || digioStatus === "cancel";

        try {
            // 1️⃣ Digio Failed or Cancelled
            if (isDigioFailed) {
                const attempts = parseInt(sessionStorage.getItem("digioAttempts") || "0", 10);
                if (attempts >= 2) {
                    setIsDigioLocked(true);
                    toast({
                        title: "Too many attempts",
                        description: "You've exceeded the maximum number of attempts.",
                        variant: "destructive",
                    });
                } else {
                    toast({
                        title: "Verification Incomplete",
                        description: "You exited or failed the Digio journey. Please retry.",
                        variant: "destructive",
                    });
                    setShowRetryButton(true);
                }

                sessionStorage.setItem("digioRetryRequired", "1");
                sessionStorage.removeItem("digioStatus");
                sessionStorage.removeItem("digioKID");
                return;
            }

            // 2️⃣ Returning from successful Digio
            if (isReturningFromDigio) {
                console.log("✅ Returning from Digio → fetch profile");

                // Optional: fetch and log kid response
                const kidRes = await getKIDResponseKYC({ k_id: kid }).catch(console.error);
                if (!checkTokenValidity(kidRes?.data?.tokenValidity)) return;

                sessionStorage.setItem("docs_fetched", "1");
                sessionStorage.setItem("selfie_fetched", "1");
                sessionStorage.removeItem("digioAttempts");
                sessionStorage.removeItem("digioRetryRequired");

                setShowRetryButton(false);
                setIsDigioLocked(false);
            }

            // 3️⃣ If Digio not yet triggered, and no docs fetched → trigger Digio
            if (!isReturningFromDigio && shouldTriggerDigio) {
                if ((showRetryButton || isDigioLocked) && !retryForce) {
                    return;
                }

                const attempts = parseInt(sessionStorage.getItem("digioAttempts") || "0", 10);
                if (attempts >= 2) {
                    toast({
                        title: "Too many attempts",
                        description: "Digio verification failed multiple times. Please try again later or contact support.",
                        variant: "destructive",
                    });
                    return;
                }

                const genResponse = await generateKIDKYC({
                    customer_identifier: mobileNumber,
                    template_name: "FETCH_DOCS",
                    pan: panNumber,
                    notify_customer: true,
                });

                if (!checkTokenValidity(genResponse?.data?.tokenValidity)) return;
                if (genResponse.status !== 200) throw new Error("Failed to generate KID");

                const kidData = genResponse.data?.data?.data;
                if (kidData && genResponse.data?.data?.status === "success") {
                    const { id: newKid, access_token, customer_identifier } = kidData;
                    sessionStorage.setItem("digioKID", newKid);
                    sessionStorage.setItem("digioStatus", "initiated");
                    sessionStorage.setItem("digioAttempts", (attempts + 1).toString());
                    setKycId(newKid);

                    if (digioInstanceRef.current) {
                        updateStepStatus("signin", "completed");
                        digioInstanceRef.current.init();
                        digioInstanceRef.current.submit(newKid, customer_identifier, access_token);
                    } else {
                        throw new Error("Digio instance not initialized");
                    }

                    return; // exit for redirect
                }
            }

            // ✅ In both return-from-digio and already-fetched → fetch profile
            if (isReturningFromDigio || isDocsAlreadyFetched) {
                if (!panNumber) throw new Error("PAN missing, can't fetch profile");

                const profileResp = await getProfileDetailsKYC({ PAN: panNumber });
                if (!checkTokenValidity(profileResp?.data?.tokenValidity)) return;

                let profileData = profileResp?.data?.data?.data?.profileData?.digilocker;
                const kraData = profileResp?.data?.data?.data?.kraData;

                if (kraData) {
                    setIsKRAFetched(true);
                    setIsFormEditable(false);
                }

                if (profileData || kraData) {
                    profileData = mergeProfileAndKRA(profileData, kraData);
                }

                fetchBODetails();

                // 🟢 Continue to normalize + prefill
                if (!profileData) return;

                // 🔄 Normalize and map profileData (as you’ve already written)
                console.log(profileData);

                const sessionDOB = sessionStorage.getItem("currentDOB") || "";
                const sessionPAN = sessionStorage.getItem("currentPAN") || "";
                const sessionEmail = sessionStorage.getItem("currentEmail") || "";
                const sessionMobile = normalizeMobile(sessionStorage.getItem("currentMobile") || "");

                // 🔄 Normalize gender
                const allowedGenders = ["male", "female", "transgender", "Other"] as const;
                let normalizedGender = normalizeGender(profileData.aadhaar?.gender || profileData.pan?.gender || profileData.gender || "");
                if (!allowedGenders.includes(normalizedGender as any)) normalizedGender = "Other";

                // 🧩 Parse full name
                const fullName = profileData.pan?.name || profileData.full_name || "";
                const [firstName = "", middleName = "", lastName = ""] = fullName.split(" ");

                const permanentCountryCode =
                    profileData.aadhaar?.permanent_address_details?.district_or_country ||
                    profileData.permanent_address?.country ||
                    profileData.AdditionalProfileData?.permanent_country_name ||
                    ""
                const permanentStateCode =
                    profileData.aadhaar?.permanent_address_details?.state ||
                    profileData.permanent_address?.state ||
                    ""
                const correspondenceStateCode =
                    profileData.aadhaar?.permanent_address_details?.state ||
                    profileData.permanent_address?.state ||
                    ""
                const correspondenceCountryCode =
                    profileData.aadhaar?.current_address_details?.district_or_country ||
                    profileData.correspondence_address?.country ||
                    profileData.AdditionalProfileData?.correspondence_country_name ||
                    ""

                // 🎯 Build final mapped data
                const mappedData = {
                    firstName,
                    middleName,
                    lastName,
                    aadharSchema: profileData.aadhaar?.id_number || "",
                    pan: profileData.pan?.id_number || profileData.pan_number,
                    dobSchema: formatDate(profileData.pan?.dob || profileData.dob || ""), // Format to YYYY-MM-DD if needed
                    genderSchema: normalizedGender as "male" | "female" | "transgender" | "Other",
                    mobile: normalizeMobile(parsedsigninDetails?.mobileNumber || profileData.aadhaar?.mobile || profileData.mobile_number),

                    email: profileData.email_id || profileData.AdditionalProfileData?.email || parsedsigninDetails?.email,
                    fatherSpouseName: profileData.father_spouse_name || profileData.AdditionalProfileData?.father_spouse_name || "",
                    maritalStatus: profileData?.AdditionalProfileData?.marital_status?.toLowerCase() || "",
                    tradingExperience: profileData?.AdditionalProfileData?.trading_experience || "",
                    occupationType: profileData?.AdditionalProfileData?.occupationsubtype || "",
                    annualIncome: profileData?.AdditionalProfileData?.annual_income || "",
                    residentialStatus: profileData?.AdditionalProfileData?.residentialstatus || "",
                    application_type: profileData?.AdditionalProfileData?.application_type || "",
                    fatherSpouseTitle: profileData?.AdditionalProfileData?.father_spouse_title || "",
                    motherFirstName: profileData?.AdditionalProfileData?.mother_first_name || "",
                    motherMiddleName: profileData?.AdditionalProfileData?.mother_middle_name || "",
                    motherLastName: profileData?.AdditionalProfileData?.mother_last_name || "",
                    openFreshAccount: normalizeYesNo(profileData?.AdditionalProfileData?.open_fresh_account),
                    politicallyExposed: normalizeYesNo(profileData?.AdditionalProfileData?.politically_exposed),
                    bsdaOption: profileData?.AdditionalProfileData?.bsda || "",
                    accountSettlement: profileData?.AdditionalProfileData?.account_settlement || "",
                    proofType: profileData?.AdditionalProfileData?.proof_type || "",
                    proofNumber: profileData?.AdditionalProfileData?.proof_number || "",

                    permanentAddressLine1:
                        profileData.aadhaar?.permanent_address_details?.address ||
                        mergeAllAddressLines(profileData.permanent_address) ||
                        "",
                    permanentCountry:
                        countryCodes.find((c) => c.text === permanentCountryCode)?.value || "",
                    permanentState:
                        stateCodes.find((c) => c.text === permanentStateCode)?.value || "",
                    permanentCity: profileData.aadhaar?.permanent_address_details?.district_or_city || profileData.permanent_address?.city || "",
                    permanentPincode: profileData.aadhaar?.permanent_address_details?.pincode || profileData.permanent_address?.pin_code || "",

                    correspondenceAddressLine1:
                        profileData.aadhaar?.current_address_details?.address ||
                        mergeAllAddressLines(profileData.correspondence_address) ||
                        "",
                    correspondenceCountry:
                        countryCodes.find((c) => c.text === correspondenceCountryCode)?.value || "",
                    correspondenceCity: profileData.aadhaar?.current_address_details?.district_or_city || profileData.correspondence_address?.city || "",
                    correspondenceState:
                        stateCodes.find((c) => c.text === correspondenceStateCode)?.value || "",
                    correspondencePincode: profileData.aadhaar?.current_address_details?.pincode || profileData.correspondence_address?.pin_code || "",
                };

                // 🟡 Compare and show mismatches
                const fetchedDOB = mappedData.dobSchema;
                const fetchedPAN = mappedData.pan;
                const fetchedEmail = profileData.aadhaar?.email || "";
                const fetchedMobile = normalizeMobile(profileData.aadhaar?.mobile || profileData.mobile_number || "");

                const mismatches: string[] = [];
                if (sessionDOB && fetchedDOB && sessionDOB !== fetchedDOB) {
                    mismatches.push(`Date of Birth doesn't match (You: ${sessionDOB}, Fetched: ${fetchedDOB})`);
                }
                if (sessionPAN && fetchedPAN && sessionPAN.toUpperCase() !== fetchedPAN.toUpperCase()) {
                    mismatches.push(`PAN doesn't match`);
                }
                if (sessionEmail && fetchedEmail && sessionEmail.toLowerCase() !== fetchedEmail.toLowerCase()) {
                    mismatches.push(`Email doesn't match`);
                }
                if (sessionMobile && fetchedMobile && sessionMobile !== fetchedMobile) {
                    mismatches.push(`Mobile number doesn't match`);
                }

                if (mismatches.length > 0) {
                    setKraMismatchWarning(
                        `⚠️ Differences found between your input and KRA:\n• ${mismatches.join("\n• ")}`
                    );
                }

                // ✅ Prefilled fields
                const prefilled = new Set<string>();
                Object.entries(mappedData).forEach(([key, value]) => {
                    if (value && value !== "") prefilled.add(key);
                });
                setKraPrefilledFields(prefilled);

                form.reset({ ...form.getValues(), ...mappedData } as PersonalDetailsFormValues);

                if (profileData.PanCardUrl) setPanPreview(profileData.PanCardUrl);
                if (profileData.SignatureUrl) setSignaturePreview(profileData.SignatureUrl);
            }
        } catch (err) {
            console.error("Error fetching profile details:", err);
            toast({
                title: "Error",
                description: "Failed to fetch profile details. Please fill manually.",
                variant: "destructive",
            });
        } finally {
            sessionStorage.removeItem("digioStatus");
            sessionStorage.removeItem("digioKID");
            setIsLoadingProfileData(false);
        }

    }, [parsedsigninDetails, form, checkTokenValidity, fetchBODetails, toast, showRetryButton, isDigioLocked, setKycId, updateStepStatus]);

    const normalizeBool = (val: string | boolean) => {
        if (typeof val === "boolean") return val;
        return val?.trim().toLowerCase() === "yes";
    };

    // Watch for "Same as Permanent" checkbox
    const sameAsPermanent = form.watch("sameAsPermanent")

    // Handle "Same as Permanent" checkbox
    useEffect(() => {
        if (sameAsPermanent) {
            form.setValue("correspondenceAddressLine1", form.getValues("permanentAddressLine1"))
            form.setValue("correspondenceCity", form.getValues("permanentCity"))
            form.setValue("correspondenceState", form.getValues("permanentState"))
            form.setValue("correspondencePincode", form.getValues("permanentPincode"))
            form.setValue("correspondenceCountry", form.getValues("permanentCountry"))
        }
    }, [sameAsPermanent, form])

    // Define the fields for each section
    const personalFieldsList = useMemo(() => [
        "firstName", "middleName", "lastName", "email", "nationality", "mobile", "aadharSchema", "pan", "dobSchema", "genderSchema", "proofType", "proofNumber",
        "maritalStatus", "tradingExperience", "occupationType", "annualIncome", "residentialStatus", "application_type",
        "fatherSpouseTitle", "fatherSpouseName", "motherFirstName", "motherLastName",
    ], []);

    const addressFieldsList = useMemo(() => [
        "permanentAddressLine1", "permanentCity", "permanentState", "permanentPincode", "permanentCountry",
        "correspondenceAddressLine1", "correspondenceCity", "correspondenceState", "correspondencePincode", "correspondenceCountry"
    ], []);

    const additionalOptionsFieldsList = useMemo(() => ["openFreshAccount", "bsdaOption", "boDetails.accOpeningDate", "boDetails.documentReceiveDate", "boDetails.boStatus",
        "boDetails.boSubStatus", "boDetails.smsFacility",
        "boDetails.modeOfOperation",
        "boDetails.boAccountCategory",
        "boDetails.accountOpeningSrc", "boDetails.communicationsToBeSentTo"], []);

    const calculateFormProgress = useCallback(() => {
        const isValidValue = (value: any) => {
            if (value === undefined || value === null) return false;
            if (typeof value === "string" && value.trim() === "") return false;
            if (value instanceof Date && isNaN(value.getTime())) return false;
            return true;
        };

        const values = form.getValues();
        const getNestedValue = (obj: any, path: string): any => {
            return path.split(".").reduce((acc, key) => acc?.[key], obj);
        };

        const countValidFields = (fields: string[]) => {
            return fields.reduce((count, field) => {
                const val = getNestedValue(values, field);
                return isValidValue(val) ? count + 1 : count;
            }, 0);
        };

        const personalCompleted = countValidFields(personalFieldsList);
        const personalFieldsTotal = personalFieldsList.length;
        const personalPercentage = Math.round((personalCompleted / personalFieldsTotal) * 100);

        const addressCompleted = (() => {
            const permanentFields = addressFieldsList.slice(0, 5);
            const correspondenceFields = addressFieldsList.slice(5);

            let completed = countValidFields(permanentFields);

            if (sameAsPermanent) {
                completed += correspondenceFields.length;
            } else {
                completed += countValidFields(correspondenceFields);
            }

            return completed;
        })();
        const addressPercentage = Math.round((addressCompleted / addressFieldsList.length) * 100);

        const additionalCompleted = countValidFields(additionalOptionsFieldsList);
        const additionalPercentage = Math.round((additionalCompleted / additionalOptionsFieldsList.length) * 100);

        const totalCompletedFields = personalCompleted + addressCompleted + additionalCompleted;
        const totalPossibleFields = personalFieldsList.length + addressFieldsList.length + additionalOptionsFieldsList.length;
        const overallPercentage = Math.round((totalCompletedFields / totalPossibleFields) * 100);

        setFormProgress({
            personal: isNaN(personalPercentage) ? 0 : personalPercentage,
            address: isNaN(addressPercentage) ? 0 : addressPercentage,
            additional: isNaN(additionalPercentage) ? 0 : additionalPercentage,
            overall: isNaN(overallPercentage) ? 0 : overallPercentage,
        });
        // Auto-collapse sections that reach 100%
        // setExpandedSections(prev => ({
        //     personal: personalPercentage < 100, // ❗Collapse automatically once 100% complete
        //     address:
        //         personalPercentage === 100
        //             ? addressPercentage < 100
        //             : prev.address,
        //     additional:
        //         personalPercentage === 100 && addressPercentage === 100
        //             ? additionalPercentage < 100
        //             : prev.additional,
        // }));
    }, [form, personalFieldsList, addressFieldsList, additionalOptionsFieldsList, sameAsPermanent]);


    useEffect(() => {
        const subscription = form.watch(() => {
            // update progress state here
            calculateFormProgress();
        });

        return () => subscription.unsubscribe(); // Clean up to avoid memory leak
    }, [calculateFormProgress, form]);


    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    // Handle file uploads
    const handlePanUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setPanPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
            toast({
                title: "PAN Card uploaded",
                description: "Your PAN card has been uploaded successfully.",
                variant: "default",
            })
            form.setValue("panCardUpload", file, { shouldValidate: true });
        } else {
            form.setValue("panCardUpload", null);
        }
    }

    const handleSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setSignaturePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
            toast({
                title: "Signature uploaded",
                description: "Your signature has been uploaded successfully.",
                variant: "default",
            })
        }
    }

    // Scroll to section
    const scrollToSection = (section: keyof typeof expandedSections) => {
        setActiveSection(section)

        // Add a small delay to ensure DOM is updated
        setTimeout(() => {
            const stickyHeaderHeight = 120 // Approximate height of the sticky header

            let targetElement: HTMLElement | null = null

            switch (section) {
                case "personal":
                    targetElement = personalSectionRef.current
                    break
                case "address":
                    targetElement = addressSectionRef.current
                    break
                case "additional":
                    targetElement = additionalSectionRef.current
                    break
            }

            if (targetElement) {
                // Get the element's position relative to the viewport
                const elementPosition = targetElement.getBoundingClientRect().top
                // Get the current scroll position
                const offsetPosition = elementPosition + window.pageYOffset - stickyHeaderHeight

                // Scroll to the adjusted position
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth",
                })
                toggleSection(section)
            }
        }, 100)
    }

    useEffect(() => {
        if (!formInitialized && !showRetryButton && !isDigioLocked) {
            setTimeout(() => {
                fetchProfileDetails();
            }, 1000)
        }
        setFormInitialized(true);
    }, [fetchProfileDetails, formInitialized, showRetryButton, isDigioLocked]);

    useEffect(() => {
        const attempts = parseInt(sessionStorage.getItem("digioAttempts") || "0", 10);
        const retryRequired = sessionStorage.getItem("digioRetryRequired") === "1";

        if (retryRequired) {
            setShowRetryButton(true);
        }

        if (attempts >= 2) {
            setIsDigioLocked(true);
        }
    }, []);

    const mapOccupationType = (occupationValue: string, occupationOptions: any[]) => {
        for (const group of occupationOptions) {
            const found = group.options.find((opt: any) => opt.value === occupationValue);
            if (found) {
                return {
                    occupationType: group.label,     // e.g., "Service"
                    occupationSubType: occupationValue, // e.g., "PrivateSector"
                };
            }
        }

        // Default fallback if value not found
        return {
            occupationType: "Not Categorized",
            occupationSubType: occupationValue,
        };
    };

    async function onSubmit(data: PersonalDetailsFormValues) {

        // handleStepCompletion("personal-details", data)
        // const { boDetails, ...filteredData } = data;
        // const userOccupation = mapOccupationType(data.occupationType, occupationOptions);

        // const profileDataPayload = {
        //     ...filteredData,
        //     // kycCustomerId: CustomerId,
        //     // kycTradingId: TradingId,
        //     occupationType: userOccupation.occupationType,
        //     OccupationSubType: userOccupation.occupationSubType,
        //     // Add corresponding text values
        //     correspondenceCountry: getTextByValue(countryCodes, data?.correspondenceCountry),
        //     correspondenceState: getTextByValue(stateCodes, data?.correspondenceState),
        //     permanentCountry: getTextByValue(countryCodes, data?.permanentCountry),
        //     permanentState: getTextByValue(stateCodes, data?.permanentState),
        //     nationality: getTextByValue(nationalityCodes, data?.nationality),
        // };
        // console.log(profileDataPayload);

        setIsSubmitting(true)
        try {
            const { boDetails, ...filteredData } = data;
            const CustomerId = sessionStorage.getItem("CustomerId") || "";
            const TradingId = sessionStorage.getItem("TradingId") || "";
            const client_id = sessionStorage.getItem("client_id") || "";

            const accOpeningDate = boDetails.accOpeningDate
                ? format(boDetails.accOpeningDate, "yyyy-MM-dd")
                : "";
            const documentReceiveDate = boDetails.documentReceiveDate
                ? format(boDetails.documentReceiveDate, "yyyy-MM-dd")
                : "";

            console.log(filteredData);

            const userOccupation = mapOccupationType(data.occupationType, occupationOptions);
            const profileDataPayload = {
                ...filteredData,
                kycCustomerId: CustomerId,
                kycTradingId: TradingId,
                occupationType: userOccupation.occupationType,
                occupationSubType: userOccupation.occupationSubType,

                // Add corresponding text values
                correspondenceCountry: getTextByValue(countryCodes, data?.correspondenceCountry),
                correspondenceState: getTextByValue(stateCodes, data?.correspondenceState),
                permanentCountry: getTextByValue(countryCodes, data?.permanentCountry),
                permanentState: getTextByValue(stateCodes, data?.permanentState),
                nationality: getTextByValue(nationalityCodes, data?.nationality),
            };
            console.log(profileDataPayload);

            const boDetailsPayload = {
                data:
                    [
                        {
                            ...boDetails,
                            accOpeningDate,
                            documentReceiveDate,
                            bsdaFlag: filteredData.bsdaOption,
                            standingInstructionIndicator: boDetails.standingInstructionIndicator ? "YES" : "NO",
                            boSettlementPlanningFlag: boDetails.boSettlementPlanningFlag ? "Yes" : "No",
                            mentalDisability: boDetails.mentalDisability ? "YES" : "NO",
                            prefDepositoryFlag: boDetails.prefDepositoryFlag,
                            annualReportFlag: boDetails.annualReportFlag ? "YES" : "NO",
                            autoPledgeIndicator: boDetails.autoPledgeIndicator ? "Yes" : "No",
                            kycCustomerId: CustomerId,
                            electronicConfirmation: "",
                            clientId: client_id,
                            kycTradingId: TradingId,
                            name: `${data.firstName} ${data.middleName} ${data.lastName}`
                        }
                    ],
            };
            console.log(boDetailsPayload);


            // Run both calls in parallel
            const [profileTradingDataResponse, boResponse] = await Promise.all([
                updateProfileTradingDataKYC(profileDataPayload),
                addBoDetailsKYC(boDetailsPayload),
            ]);

            // ✅ Check both tokenValidity responses before proceeding
            if (
                !checkTokenValidity(profileTradingDataResponse?.data?.tokenValidity)
                || !checkTokenValidity(boResponse?.data?.tokenValidity)
            ) {
                return; // Early exit if any token is invalid (dialog + redirect handled)
            }

            // Handle profileTradingDataResponse
            const parsedProfileTradingDataData =
                typeof profileTradingDataResponse.data.data === "string"
                    ? JSON.parse(profileTradingDataResponse.data.data)
                    : profileTradingDataResponse.data.data;

            // Handle boResponse
            const parsedBoData =
                typeof boResponse.data.data === "string"
                    ? JSON.parse(boResponse.data.data)
                    : boResponse.data.data;

            const boInfo = Array.isArray(parsedBoData) ? parsedBoData[0] : parsedBoData;
            const dematId = boInfo?.generatedId || boInfo?.id || boInfo?.dematId;
            const boId = boInfo?.boId || "";

            if (!dematId) {
                throw new Error("Failed to get dematId from BO Details response");
            }

            sessionStorage.setItem("dematId", dematId);
            sessionStorage.setItem("boId", boId);
            console.log("BO Details created successfully, dematId:", dematId);

            if (dematId && parsedProfileTradingDataData.updateOperation) {
                // if (parsedProfileTradingDataData.updateOperation) {

                handleStepCompletion("personal-details", data)
            } else {
                toast({
                    title: "Error submitting personal-details",
                    description: "There was an error processing your personal information. Please try again.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error submitting personal-details form:", error);
            toast({
                title: "Error verifying personal-details",
                description: "There was an error processing your personal information. Please try again.",
                variant: "destructive",
            });
            setIsSubmitting(false);
        }

    }

    const flattenErrors = useCallback((errors: any, parentPath: (string | number)[] = []): { path: string; message: string }[] => {
        if (!errors) return [];

        if (errors.message && typeof errors.message === "string") {
            return [{ path: parentPath.join("."), message: errors.message }];
        }

        if (typeof errors !== "object") return [];

        return Object.entries(errors).flatMap(([key, val]) =>
            flattenErrors(val, [...parentPath, key])
        );
    }, []);
    const watchedValues = useWatch({ control: form.control });

    useEffect(() => {
        if (!hasSubmitted) return;

        const timeout = setTimeout(async () => {
            await form.trigger();

            setTimeout(() => {
                const freshErrors = flattenErrors(form.formState.errors);
                setErrors(freshErrors);
            }, 10);
        }, 300);

        return () => clearTimeout(timeout);
    }, [watchedValues, hasSubmitted, form, flattenErrors, setErrors]);

    return (
        <>
            <Script
                src="https://app.digio.in/sdk/v11/digio.js"
                strategy="afterInteractive"
                onLoad={() => {
                    console.log("Digio SDK loaded via Next.js Script")
                    initializeDigio()
                }}
            />

            <div className="space-y-6 p-0 m-0">

                {/* 1. Show loader if loading */}
                {isLoadingProfileData ? (
                    <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px] w-full">
                        <div className="flex flex-col items-center space-y-4 text-center">
                            <svg
                                className="w-16 h-16 text-blue-500 animate-spin"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                ></path>
                            </svg>

                            <div>
                                <h2 className="text-lg font-semibold text-blue-700">Loading your data...</h2>
                                <p className="text-sm text-blue-600">
                                    We’re fetching your profile details. Please hold on a moment.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : showRetryButton && !isDigioLocked ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="flex items-center justify-center min-h-[300px] sm:min-h-[400px] w-full"
                    >
                        <motion.div
                            className="flex flex-col items-center text-center space-y-4"
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                        >
                            <AlertTriangle className="w-16 h-16 text-yellow-500 animate-pulse" />

                            <div className="space-y-2">
                                <h2 className="text-xl font-semibold text-yellow-700">
                                    Verification Incomplete
                                </h2>
                                <p className="text-sm text-yellow-600 max-w-sm">
                                    You exited or failed the Digio journey. Please retry verification to continue.
                                </p>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    sessionStorage.setItem("digioStatus", "initiated")
                                    setShowRetryButton(false)
                                    setTimeout(() => fetchProfileDetails(true), 0)
                                }}
                                className="bg-yellow-600 text-white px-6 py-2 rounded-md hover:bg-yellow-700 transition"
                            >
                                Retry Verification
                            </motion.button>
                        </motion.div>
                    </motion.div>
                ) : isDigioLocked ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="flex items-center justify-center min-h-[300px] sm:min-h-[400px] w-full"
                    >
                        <motion.div
                            className="flex flex-col items-center text-center space-y-4 text-red-700"
                            animate={{ x: [0, -4, 4, -4, 4, 0] }}
                            transition={{ duration: 0.4 }}
                        >
                            <Ban className="w-16 h-16 text-red-500" />

                            <div className="space-y-2">
                                <h2 className="text-xl font-semibold">Verification Locked</h2>
                                <p className="text-sm max-w-sm">
                                    You’ve exceeded the maximum number of attempts. Please try again later or contact support.
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                ) : (
                    // 2. Only show form and progress if not in above states
                    <>
                        {/* Progress Bar Section - Sticky at top */}
                        <div className="sticky top-0 z-10 border-b pb-4 pt-4 px-2 shadow-lg backdrop-blur-md bg-white/30 rounded-xl mt-0">
                            <div className="max-w-6xl mx-auto">
                                <div className="flex justify-between items-center mb-2 ">
                                    <h2 className="text-xl font-bold text-gray-800">Personal Details</h2>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-600">Completion:</span>
                                        <span className="text-sm font-bold text-blue-600">{formProgress.overall}%</span>
                                    </div>
                                </div>

                                <Progress value={formProgress.overall} className="h-2 mb-4" />

                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div
                                        className={`flex flex-col items-center cursor-pointer ${activeSection === "personal" ? "text-blue-600" : "text-gray-500"}`}
                                        onClick={() => scrollToSection("personal")}
                                    >
                                        <div
                                            className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${formProgress.personal === 100 ? "bg-green-100 text-green-600" : activeSection === "personal" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}
                                        >
                                            {formProgress.personal === 100 ? <CheckCircle className="w-4 h-4" /> : <User className="w-3 h-3" />}
                                        </div>
                                        <span className="text-center">Personal ({formProgress.personal}%)</span>
                                    </div>

                                    <div
                                        className={`flex flex-col items-center cursor-pointer ${activeSection === "address" ? "text-blue-600" : "text-gray-500"}`}
                                        onClick={() => scrollToSection("address")}
                                    >
                                        <div
                                            className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${formProgress.address === 100 ? "bg-green-100 text-green-600" : activeSection === "address" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}
                                        >
                                            {formProgress.address === 100 ? <CheckCircle className="w-4 h-4" /> : <MapPin className="w-3 h-3" />}
                                        </div>
                                        <span className="text-center">Address ({formProgress.address}%)</span>
                                    </div>

                                    <div
                                        className={`flex flex-col items-center cursor-pointer ${activeSection === "additional" ? "text-blue-600" : "text-gray-500"}`}
                                        onClick={() => scrollToSection("additional")}
                                    >
                                        <div
                                            className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${formProgress.additional === 100 ? "bg-green-100 text-green-600" : activeSection === "additional" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}
                                        >
                                            {formProgress.additional === 100 ? (
                                                <CheckCircle className="w-4 h-4" />
                                            ) : (
                                                <Briefcase className="w-3 h-3" />
                                            )}
                                        </div>
                                        <span className="text-center">Additional Options ({formProgress.additional}%)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Form {...form}>
                            <form
                                onSubmit={(e) => {
                                    console.log("Native form submit event triggered")

                                    // Log the current validation state
                                    console.log("Form validation state:", {
                                        isValid: form.formState.isValid,
                                        errors: form.formState.errors,
                                        errorCount: Object.keys(form.formState.errors).length,
                                    })

                                    // Force validation before submission
                                    form.trigger().then((isValid) => {
                                        console.log("Manual validation triggered, isValid:", isValid)
                                        if (!isValid) {
                                            console.log("Validation failed, errors:", form.formState.errors)
                                        } else {
                                            console.log("Validation passed, proceeding with submission")
                                        }
                                    })

                                    // Let the react-hook-form handle the actual submission
                                    form.handleSubmit(onSubmit)(e)
                                }}
                                className="space-y-8"
                            >
                                {isKRAFetched && (
                                    <Alert className="mb-4 bg-yellow-50 border-yellow-200 text-yellow-800">
                                        <AlertTitle>Information Pre-filled from KRA</AlertTitle>
                                        <AlertDescription>
                                            We've automatically filled some of your details using information fetched from KRA (KYC Registration Agency).
                                            <br />
                                            <br />
                                            <strong>Note:</strong> These pre-filled fields are currently locked to maintain data consistency.
                                            <br />
                                            Fields with the <Info className="inline w-4 h-4 text-blue-500" /> icon are auto-filled and disabled.
                                            <br />
                                            {!isFormEditable ? (
                                                <>
                                                    <br />
                                                    If you'd like to update any of these fields, click below to unlock them.
                                                    <br />
                                                    <br />
                                                    <Button
                                                        variant="link"
                                                        onClick={() => setIsFormEditable(true)}
                                                        className="inline p-0 m-0 h-auto text-blue-600 underline font-medium"
                                                    >
                                                        Click here to enable editing for KRA fields
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-green-800 font-medium">
                                                        You can now edit all fields. Please make sure your changes are accurate.
                                                    </span>
                                                    <br />
                                                    <br />
                                                    <Button
                                                        variant="link"
                                                        onClick={() => {
                                                            setIsFormEditable(false);
                                                            form.reset({ ...form.getValues() });
                                                        }}
                                                        className="inline p-0 m-0 h-auto text-blue-600 underline font-medium"
                                                    >
                                                        Revert to KRA data and re-lock fields
                                                    </Button>
                                                </>
                                            )}
                                        </AlertDescription>

                                    </Alert>
                                )}

                                {kraMismatchWarning && (
                                    <Alert className="mb-4 bg-red-50 border-red-200 text-red-800">
                                        <AlertTitle>Potential Mismatch Detected</AlertTitle>
                                        <AlertDescription className="whitespace-pre-line">
                                            {kraMismatchWarning}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {/* 1. Personal Information Section */}
                                <div ref={personalSectionRef} className="scroll-mt-25 mt-8 transition-all duration-300 ease-in-out border-gray-200 rounded-lg overflow-hidden shadow-lg border-0 bg-white/80 backdrop-blur">
                                    <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden ">
                                        <div
                                            className={`bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200 flex justify-between items-center cursor-pointer`}
                                            onClick={() => {
                                                // if (formProgress.personal === 100) {
                                                toggleSection("personal");
                                                // }
                                            }}
                                            title={formProgress.personal === 100 ? "Toggle Personal Details" : "Complete all required fields to access"}
                                        >
                                            <h3 className="text-blue-800 flex items-center text-lg font-medium gap-3">
                                                <span className="text-xl">{expandedSections.personal ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}</span>
                                                Personal Details ({formProgress.personal}%)

                                                {/* Completed badge */}
                                                {formProgress.personal === 100 && (
                                                    <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800 border border-green-300">
                                                        ✔ Completed
                                                    </span>
                                                )}
                                            </h3>
                                        </div>

                                        <div
                                            className={`transition-[max-height,opacity] duration-500 ease-in-out overflow-hidden ${expandedSections.personal ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"
                                                }`}
                                        >
                                            {/* {expandedSections.personal && ( */}
                                            <div className="p-6 space-y-6 bg-white">
                                                <div className="grid gap-4 sm:grid-cols-3">
                                                    <FormField
                                                        control={form.control}
                                                        name="firstName"
                                                        render={({ field }) => (
                                                            <FormItem ref={registerFieldRef("firstName")} data-field="firstName">
                                                                <FormLabel>First Name <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                <FormControl>
                                                                    <div className="relative">
                                                                        <Input placeholder="As per your official documents" {...field} disabled={isFieldDisabled("firstName")} />
                                                                        {isFieldDisabled("firstName") && (
                                                                            <span
                                                                                className="absolute right-2 top-2.5"
                                                                                title="Auto-filled from KRA and locked"
                                                                            >
                                                                                <Info className="h-4 w-4 text-blue-400" />
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="middleName"
                                                        render={({ field }) => (
                                                            <FormItem ref={registerFieldRef("middleName")}>
                                                                <FormLabel>Middle Name <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                <FormControl>
                                                                    <div className="relative">
                                                                        <Input placeholder="As per your official documents" {...field} disabled={isFieldDisabled("middleName")} />
                                                                        {isFieldDisabled("middleName") && (
                                                                            <span
                                                                                className="absolute right-2 top-2.5"
                                                                                title="Auto-filled from KRA and locked"
                                                                            >
                                                                                <Info className="h-4 w-4 text-blue-400" />
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="lastName"
                                                        render={({ field }) => (
                                                            <FormItem ref={registerFieldRef("lastName")}>
                                                                <FormLabel>Last Name <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                <FormControl>
                                                                    <div className="relative">
                                                                        <Input placeholder="As per your official documents" {...field} disabled={isFieldDisabled("lastName")} />
                                                                        {isFieldDisabled("lastName") && (
                                                                            <span
                                                                                className="absolute right-2 top-2.5"
                                                                                title="Auto-filled from KRA and locked"
                                                                            >
                                                                                <Info className="h-4 w-4 text-blue-400" />
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`mobile`}
                                                        render={({ field }) => (
                                                            <FormItem ref={registerFieldRef("mobile")}>
                                                                <FormLabel>Mobile Number <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                <FormControl>
                                                                    <div className="relative">
                                                                        <Input placeholder="10-digit mobile" disabled={isFieldDisabled("mobile")} {...field} value={field.value ?? ""} />
                                                                        {isFieldDisabled("mobile") && (
                                                                            <span
                                                                                className="absolute right-2 top-2.5"
                                                                                title="Auto-filled from KRA and locked"
                                                                            >
                                                                                <Info className="h-4 w-4 text-blue-400" />
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`email`}
                                                        render={({ field }) => (
                                                            <FormItem ref={registerFieldRef("email")}>
                                                                <FormLabel>Email ID <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                <FormControl>
                                                                    <div className="relative">
                                                                        <Input placeholder="email@example.com" type="email" {...field} disabled={isFieldDisabled("email")} value={field.value ?? ""} />
                                                                        {isFieldDisabled("email") && (
                                                                            <span
                                                                                className="absolute right-2 top-2.5"
                                                                                title="Auto-filled from KRA and locked"
                                                                            >
                                                                                <Info className="h-4 w-4 text-blue-400" />
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="nationality"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-col" ref={registerFieldRef("nationality")}>
                                                                <FormLabel>Nationality <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                <SearchableSelect
                                                                    field={field}
                                                                    options={nationalityCodes}
                                                                    placeholder="Select nationality"
                                                                />
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                </div>

                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <FormField
                                                        control={form.control}
                                                        name="aadharSchema"
                                                        render={({ field }) => {
                                                            const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                                                                let value = e.target.value?.replace(/\D/g, "") // Remove non-digits
                                                                if (value.length > 12) value = value.slice(0, 12) // Limit to 12 digits

                                                                field.onChange(value)
                                                            }

                                                            const maskedValue =
                                                                field.value && field.value.length === 12
                                                                    ? "********" + field.value.slice(-4)
                                                                    : field.value

                                                            return (
                                                                <FormItem ref={registerFieldRef("aadharSchema")}>
                                                                    <FormLabel>Aadhar Number <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                    <FormControl>
                                                                        <div className="relative">
                                                                            <Input
                                                                                placeholder="As per fetched"
                                                                                value={maskedValue}
                                                                                onChange={handleChange}
                                                                                onFocus={(e) => {
                                                                                    // If the masked value is shown, reveal the actual value on focus
                                                                                    if (/^\*{8}\d{4}$/.test(e.currentTarget.value)) {
                                                                                        e.currentTarget.value = field.value || "";
                                                                                    }
                                                                                }}
                                                                                onBlur={(e) => {
                                                                                    // Re-mask on blur if valid
                                                                                    if (field.value?.length === 12) {
                                                                                        e.currentTarget.value = "********" + field.value.slice(-4)
                                                                                    }
                                                                                }}
                                                                                type="text"
                                                                                inputMode="numeric"
                                                                                maxLength={12}
                                                                                disabled={isFieldDisabled("aadharSchema")}
                                                                            />
                                                                            {isFieldDisabled("aadharSchema") && (
                                                                                <span
                                                                                    className="absolute right-2 top-2.5"
                                                                                    title="Auto-filled from KRA and locked"
                                                                                >
                                                                                    <Info className="h-4 w-4 text-blue-400" />
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )
                                                        }}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="pan"
                                                        render={({ field }) => (
                                                            <FormItem ref={registerFieldRef("pan")}>
                                                                <FormLabel>PAN Number <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                <FormControl>
                                                                    <div className="relative">
                                                                        <Input placeholder="As per your official documents" {...field} disabled={isFieldDisabled("pan")} />
                                                                        {isFieldDisabled("pan") && (
                                                                            <span
                                                                                className="absolute right-2 top-2.5"
                                                                                title="Auto-filled from KRA and locked"
                                                                            >
                                                                                <Info className="h-4 w-4 text-blue-400" />
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                <div className="grid gap-4 sm:grid-cols-3">

                                                    <FormField
                                                        control={form.control}
                                                        name="dobSchema"
                                                        render={({ field }) => (
                                                            <FormItem ref={registerFieldRef("dobSchema")}>
                                                                <FormLabel>Date of Birth <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                <FormControl>
                                                                    <div className="relative">
                                                                        <Input
                                                                            type="date"
                                                                            max={new Date().toISOString().split("T")[0]} // Prevent future dates
                                                                            {...field} disabled={isFieldDisabled("dobSchema")}
                                                                        />
                                                                        {isFieldDisabled("dobSchema") && (
                                                                            <span
                                                                                className="absolute right-2 top-2.5"
                                                                                title="Auto-filled from KRA and locked"
                                                                            >
                                                                                <Info className="h-4 w-4 text-blue-400" />
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="genderSchema"
                                                        render={({ field }) => (
                                                            <FormItem ref={registerFieldRef("genderSchema")}>
                                                                <FormLabel>Gender <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                <FormControl>
                                                                    <div className="relative">
                                                                        <select
                                                                            {...field} disabled={isFieldDisabled("genderSchema")}
                                                                            className="w-full border border-input rounded-md h-10 px-3"
                                                                        >
                                                                            <option value="">Select Gender</option>
                                                                            <option value="male">Male</option>
                                                                            <option value="female">Female</option>
                                                                            <option value="transgender">Trans Gender</option>
                                                                            <option value="Other">Other</option>
                                                                        </select>
                                                                        {isFieldDisabled("genderSchema") && (
                                                                            <span
                                                                                className="absolute right-6 top-2.5"
                                                                                title="Auto-filled from KRA and locked"
                                                                            >
                                                                                <Info className="h-4 w-4 text-blue-400" />
                                                                            </span>
                                                                        )}
                                                                    </div>


                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="maritalStatus"
                                                        render={({ field }) => (
                                                            <FormItem ref={registerFieldRef("maritalStatus")}>
                                                                <FormLabel>Marital Status <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFieldDisabled("maritalStatus")}>
                                                                    <FormControl>
                                                                        <div className="relative">
                                                                            <SelectTrigger>
                                                                                <SelectValue placeholder="Select marital status" />
                                                                            </SelectTrigger>
                                                                            {isFieldDisabled("maritalStatus") && (
                                                                                <span
                                                                                    className="absolute right-2 top-2.5"
                                                                                    title="Auto-filled from KRA and locked"
                                                                                >
                                                                                    <Info className="h-4 w-4 text-blue-400" />
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="single">Single</SelectItem>
                                                                        <SelectItem value="married">Married</SelectItem>
                                                                        <SelectItem value="divorced">Divorced</SelectItem>
                                                                        <SelectItem value="widowed">Widowed</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                <div className="grid gap-4 sm:grid-cols-3">
                                                    <FormField
                                                        control={form.control}
                                                        name="proofType"
                                                        render={({ field }) => (
                                                            <FormItem ref={registerFieldRef("proofType")}>
                                                                <FormLabel>
                                                                    Proof Type <span className="text-red-500 font-bold text-lg">*</span>
                                                                </FormLabel>
                                                                <Select
                                                                    onValueChange={(value) => {
                                                                        field.onChange(value) // update form value
                                                                        form.trigger("proofNumber") // 🔥 re-validate proofNumber
                                                                    }}
                                                                    value={field.value || undefined}
                                                                >
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select proof type" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="passport">Passport</SelectItem>
                                                                        <SelectItem value="driving_license">Driving License</SelectItem>
                                                                        <SelectItem value="voter_id">Voter ID</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`proofNumber`}
                                                        render={({ field }) => (
                                                            <FormItem ref={registerFieldRef("proofNumber")}>
                                                                <FormLabel>Proof Number <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="Proof number" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="tradingExperience"
                                                        render={({ field }) => (
                                                            <FormItem ref={registerFieldRef("tradingExperience")}>
                                                                <FormLabel>Trading Experience <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFieldDisabled("tradingExperience")}>
                                                                    <FormControl>
                                                                        <div className="relative">
                                                                            <SelectTrigger>
                                                                                <SelectValue placeholder="Select experience" />
                                                                            </SelectTrigger>
                                                                            {isFieldDisabled("tradingExperience") && (
                                                                                <span
                                                                                    className="absolute right-2 top-2.5"
                                                                                    title="Auto-filled from KRA and locked"
                                                                                >
                                                                                    <Info className="h-4 w-4 text-blue-400" />
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="none">None</SelectItem>
                                                                        <SelectItem value="beginner">Beginner (&lt; 1 year)</SelectItem>
                                                                        <SelectItem value="intermediate">Intermediate (1-3 years)</SelectItem>
                                                                        <SelectItem value="advanced">Advanced (3+ years)</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="occupationType"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-col my-auto" ref={registerFieldRef("occupationType")}>
                                                                <FormLabel>Occupation Type <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                <SearchableSelect
                                                                    field={field} disabled={isFieldDisabled("occupationType")}
                                                                    options={occupationOptions}
                                                                    placeholder="Select occupation type"
                                                                />
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="annualIncome"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-col my-auto" ref={registerFieldRef("annualIncome")}>
                                                                <FormLabel>Annual Income <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                <SearchableSelect
                                                                    field={field} disabled={isFieldDisabled("annualIncome")}
                                                                    options={incomeOptions}
                                                                    placeholder="Select annual income"
                                                                />
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="residentialStatus"
                                                        render={({ field }) => (
                                                            <FormItem ref={registerFieldRef("residentialStatus")}>
                                                                <FormLabel>Residential Status <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFieldDisabled("residentialStatus")}>
                                                                    <FormControl>
                                                                        <div className="relative">
                                                                            <SelectTrigger>
                                                                                <SelectValue placeholder="Select experience" />
                                                                            </SelectTrigger>
                                                                            {isFieldDisabled("residentialStatus") && (
                                                                                <span
                                                                                    className="absolute right-2 top-2.5"
                                                                                    title="Auto-filled from KRA and locked"
                                                                                >
                                                                                    <Info className="h-4 w-4 text-blue-400" />
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="ResidentIndividual">Resident Individual</SelectItem>
                                                                        <SelectItem value="NonResident">Non Resident</SelectItem>
                                                                        <SelectItem value="ForeignNational">Foreign National</SelectItem>
                                                                        <SelectItem value="PersonOfIndianOrigin">Person Of Indian Origin</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="application_type"
                                                        render={({ field }) => (
                                                            <FormItem ref={registerFieldRef("application_type")}>
                                                                <FormLabel>Application Type <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFieldDisabled("application_type")}>
                                                                    <FormControl>
                                                                        <div className="relative">
                                                                            <SelectTrigger>
                                                                                <SelectValue placeholder="Select experience" />
                                                                            </SelectTrigger>
                                                                            {isFieldDisabled("application_type") && (
                                                                                <span
                                                                                    className="absolute right-2 top-2.5"
                                                                                    title="Auto-filled from KRA and locked"
                                                                                >
                                                                                    <Info className="h-4 w-4 text-blue-400" />
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="Individual">Individual</SelectItem>
                                                                        <SelectItem value="HUF">HUF</SelectItem>
                                                                        <SelectItem value="NonIndividual">Non Individual</SelectItem>
                                                                        <SelectItem value="NRI">NRI</SelectItem>
                                                                        <SelectItem value="ForeignNational">ForeignNational</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                {/* Family Information */}
                                                <div className="grid gap-4 sm:grid-cols-2 mt-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="fatherSpouseTitle"
                                                        render={({ field }) => (
                                                            <FormItem ref={registerFieldRef("fatherSpouseTitle")}>
                                                                <FormLabel>Father/Spouse Name <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                <div className="flex gap-2">
                                                                    <div className="w-1/4">
                                                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFieldDisabled("fatherSpouseTitle")}>
                                                                            <FormControl>
                                                                                <div className="relative">
                                                                                    <SelectTrigger>
                                                                                        <SelectValue placeholder="Title" />
                                                                                    </SelectTrigger>
                                                                                    {isFieldDisabled("fatherSpouseTitle") && (
                                                                                        <span
                                                                                            className="absolute right-2 top-2.5"
                                                                                            title="Auto-filled from KRA and locked"
                                                                                        >
                                                                                            <Info className="h-4 w-4 text-blue-400" />
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </FormControl>
                                                                            <SelectContent>
                                                                                <SelectItem value="mr">Mr.</SelectItem>
                                                                                <SelectItem value="mrs">Mrs.</SelectItem>
                                                                                <SelectItem value="ms">Ms.</SelectItem>
                                                                                <SelectItem value="dr">Dr.</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>

                                                                    <div className="w-3/4">
                                                                        <FormField
                                                                            control={form.control}
                                                                            name="fatherSpouseName"
                                                                            render={({ field }) => (
                                                                                <FormItem className="mb-0">
                                                                                    <FormControl>
                                                                                        <div className="relative">
                                                                                            <Input placeholder="Full name" {...field} disabled={isFieldDisabled("fatherSpouseName")} />
                                                                                            {isFieldDisabled("fatherSpouseName") && (
                                                                                                <span
                                                                                                    className="absolute right-2 top-2.5"
                                                                                                    title="Auto-filled from KRA and locked"
                                                                                                >
                                                                                                    <Info className="h-4 w-4 text-blue-400" />
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    </FormControl>
                                                                                    <FormMessage />
                                                                                </FormItem>
                                                                            )}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="motherFirstName"
                                                        render={({ field }) => (
                                                            <FormItem ref={registerFieldRef("motherFirstName")}>
                                                                <FormLabel>Mother's Name <span className="text-red-500 font-bold text-lg">*</span></FormLabel>

                                                                <div className="flex gap-2">
                                                                    <div className="w-2/4">
                                                                        <FormControl>
                                                                            <div className="relative">
                                                                                <Input placeholder="First name" {...field} disabled={isFieldDisabled("motherFirstName")} />
                                                                                {isFieldDisabled("motherFirstName") && (
                                                                                    <span
                                                                                        className="absolute right-2 top-2.5"
                                                                                        title="Auto-filled from KRA and locked"
                                                                                    >
                                                                                        <Info className="h-4 w-4 text-blue-400" />
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </FormControl>
                                                                    </div>
                                                                    <div className="w-2/4">
                                                                        <FormField
                                                                            control={form.control}
                                                                            name="motherLastName"
                                                                            render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormControl>
                                                                                        <div className="relative">
                                                                                            <Input placeholder="Last name" {...field} disabled={isFieldDisabled("motherLastName")} />
                                                                                            {isFieldDisabled("motherLastName") && (
                                                                                                <span
                                                                                                    className="absolute right-2 top-2.5"
                                                                                                    title="Auto-filled from KRA and locked"
                                                                                                >
                                                                                                    <Info className="h-4 w-4 text-blue-400" />
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    </FormControl>
                                                                                    <FormMessage />
                                                                                </FormItem>
                                                                            )}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                </div>

                                                {/* Document Upload Section */}
                                                <div className="grid gap-6 sm:grid-cols-2 mt-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="panCardUpload"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Upload PAN Card</FormLabel>
                                                                <FormControl>
                                                                    <div className="relative">
                                                                        <div className="relative w-full h-32 border border-dashed border-blue-300 rounded-md flex items-center justify-center bg-blue-50 overflow-hidden hover:border-blue-500 transition-colors">
                                                                            {panPreview ? (
                                                                                <Image
                                                                                    src={panPreview || "/placeholder.svg"}
                                                                                    alt="PAN Card preview"
                                                                                    className="w-full h-full object-contain"
                                                                                    fill
                                                                                    style={{ objectFit: "contain" }}
                                                                                />
                                                                            ) : (
                                                                                <div className="flex flex-col items-center justify-center text-blue-500">
                                                                                    <CreditCard className="h-8 w-8 mb-2" />
                                                                                    <p className="font-medium text-sm">Upload PAN Card</p>
                                                                                    <p className="text-xs mt-1 text-blue-400">JPG, PNG or PDF (Max 2MB)</p>
                                                                                </div>
                                                                            )}
                                                                            <input
                                                                                type="file"
                                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                                                accept="image/png, image/jpeg, application/pdf"
                                                                                onChange={handlePanUpload} disabled={isFieldDisabled("panCardUpload")}
                                                                            />
                                                                        </div>
                                                                        {isFieldDisabled("panCardUpload") && (
                                                                            <span
                                                                                className="absolute right-2 top-2.5"
                                                                                title="Auto-filled from KRA and locked"
                                                                            >
                                                                                <Info className="h-4 w-4 text-blue-400" />
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </FormControl>
                                                                {panPreview && (
                                                                    <div className="text-sm text-green-600 flex items-center mt-2">
                                                                        <Check className="h-4 w-4 mr-1" />
                                                                        PAN Card uploaded successfully
                                                                    </div>
                                                                )}
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="signatureUpload"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Upload Signature</FormLabel>
                                                                <FormControl>
                                                                    <div className="relative">
                                                                        <div className="relative w-full h-32 border border-dashed border-blue-300 rounded-md flex items-center justify-center bg-blue-50 overflow-hidden hover:border-blue-500 transition-colors">
                                                                            {signaturePreview ? (
                                                                                <Image
                                                                                    src={signaturePreview || "/placeholder.svg"}
                                                                                    alt="Signature preview"
                                                                                    className="w-full h-full object-contain"
                                                                                    fill
                                                                                    style={{ objectFit: "contain" }}
                                                                                />
                                                                            ) : (
                                                                                <div className="flex flex-col items-center justify-center text-blue-500">
                                                                                    <FileSignature className="h-8 w-8 mb-2" />
                                                                                    <p className="font-medium text-sm">Upload Signature</p>
                                                                                    <p className="text-xs mt-1 text-blue-400">JPG or PNG (Max 1MB)</p>
                                                                                </div>
                                                                            )}
                                                                            <input
                                                                                type="file"
                                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                                                accept="image/png, image/jpeg"
                                                                                onChange={handleSignatureUpload} disabled={isFieldDisabled("signatureUpload")}
                                                                            />
                                                                        </div>
                                                                        {isFieldDisabled("signatureUpload") && (
                                                                            <span
                                                                                className="absolute right-2 top-2.5"
                                                                                title="Auto-filled from KRA and locked"
                                                                            >
                                                                                <Info className="h-4 w-4 text-blue-400" />
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                </FormControl>
                                                                {signaturePreview && (
                                                                    <div className="text-sm text-green-600 flex items-center mt-2">
                                                                        <Check className="h-4 w-4 mr-1" />
                                                                        Signature uploaded successfully
                                                                    </div>
                                                                )}
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                            {/* )} */}
                                        </div>

                                    </div>
                                </div>

                                {/* 2. Address Information Section */}
                                <div ref={addressSectionRef} className="scroll-mt-25 mt-8 transition-all duration-300 ease-in-out border-gray-200 rounded-lg overflow-hidden shadow-lg border-0 bg-white/80 backdrop-blur">
                                    <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                        <div
                                            className={`bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200 flex justify-between items-center cursor-pointer`}
                                            onClick={() => {
                                                // if (formProgress.address === 100) {
                                                toggleSection("address");
                                                // }
                                            }}
                                            title={formProgress.address === 100 ? "Toggle Address Information" : "Complete all required fields to access"}
                                        >
                                            <h3 className="text-blue-800 flex items-center text-lg font-medium gap-3">
                                                <span className="text-xl">{expandedSections.address ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}</span>
                                                Address Information ({formProgress.address}%)

                                                {/* Completed badge */}
                                                {formProgress.address === 100 && (
                                                    <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800 border border-green-300">
                                                        ✔ Completed
                                                    </span>
                                                )}
                                            </h3>
                                        </div>

                                        <div
                                            className={`transition-[max-height,opacity] duration-500 ease-in-out overflow-hidden ${expandedSections.address ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"}`}
                                        >
                                            {/* {expandedSections.address && ( */}
                                            <div className="p-6 space-y-6 bg-white">
                                                {/* Permanent Address Section */}
                                                <div className="bg-blue-50 p-3 rounded-md mb-4">
                                                    <h3 className="font-medium text-blue-800">Permanent Address</h3>
                                                    <p className="text-sm text-blue-600">
                                                        This is your permanent residential address as per your records
                                                    </p>
                                                </div>

                                                <div className="space-y-4">

                                                    <div className="grid gap-4 sm:grid-cols-2">
                                                        <FormField
                                                            control={form.control}
                                                            name="permanentAddressLine1"
                                                            render={({ field }) => (
                                                                <FormItem ref={registerFieldRef("permanentAddressLine1")}>
                                                                    <FormLabel>Address Line <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                    <FormControl>
                                                                        <div className="relative">
                                                                            <Input placeholder="Flat/House No., Building Name" {...field} disabled={isFieldDisabled("permanentAddressLine1")} className="pr-8" />
                                                                            {isFieldDisabled("permanentAddressLine1") && (
                                                                                <span
                                                                                    className="absolute right-2 top-2.5"
                                                                                    title="Auto-filled from KRA and locked"
                                                                                >
                                                                                    <Info className="h-4 w-4 text-blue-400" />
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name="permanentCity"
                                                            render={({ field }) => (
                                                                <FormItem ref={registerFieldRef("permanentCity")}>
                                                                    <FormLabel>City <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                    <FormControl>
                                                                        <div className="relative">
                                                                            <Input placeholder="City" {...field} disabled={isFieldDisabled("permanentCity")} />
                                                                            {isFieldDisabled("permanentCity") && (
                                                                                <span
                                                                                    className="absolute right-2 top-2.5"
                                                                                    title="Auto-filled from KRA and locked"
                                                                                >
                                                                                    <Info className="h-4 w-4 text-blue-400" />
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="grid gap-4 sm:grid-cols-3">
                                                        <FormField
                                                            control={form.control}
                                                            name="permanentState"
                                                            render={({ field }) => (
                                                                <FormItem className="flex flex-col" ref={registerFieldRef("permanentState")}>
                                                                    <FormLabel>State <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                    <div className="relative">
                                                                        <SearchableSelect
                                                                            disabled={isFieldDisabled("permanentState")}
                                                                            field={field}
                                                                            options={stateCodes}
                                                                            placeholder="Select State"
                                                                        />
                                                                        {isFieldDisabled("permanentState") && (
                                                                            <span
                                                                                className="absolute right-2 top-2.5"
                                                                                title="Auto-filled from KRA and locked"
                                                                            >
                                                                                <Info className="h-4 w-4 text-blue-400" />
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <FormField
                                                            control={form.control}
                                                            name="permanentPincode"
                                                            render={({ field }) => (
                                                                <FormItem ref={registerFieldRef("permanentPincode")}>
                                                                    <FormLabel>Pincode <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                    <FormControl>
                                                                        <div className="relative">
                                                                            <Input placeholder="6-digit pincode" {...field} disabled={isFieldDisabled("permanentPincode")} />
                                                                            {isFieldDisabled("permanentPincode") && (
                                                                                <span
                                                                                    className="absolute right-2 top-2.5"
                                                                                    title="Auto-filled from KRA and locked"
                                                                                >
                                                                                    <Info className="h-4 w-4 text-blue-400" />
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name="permanentCountry"
                                                            render={({ field }) => (
                                                                <FormItem className="flex flex-col" ref={registerFieldRef("permanentCountry")}>
                                                                    <FormLabel>Country <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                    <div className="relative">
                                                                        <SearchableSelect
                                                                            disabled={isFieldDisabled("permanentCountry")}
                                                                            field={field}
                                                                            options={countryCodes}
                                                                            placeholder="Select country"
                                                                        />
                                                                        {isFieldDisabled("permanentCountry") && (
                                                                            <span
                                                                                className="absolute right-2 top-2.5"
                                                                                title="Auto-filled from KRA and locked"
                                                                            >
                                                                                <Info className="h-4 w-4 text-blue-400" />
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                </div>

                                                <Separator className="my-4" />

                                                {/* Correspondence Address Section */}
                                                <FormField
                                                    control={form.control}
                                                    name="sameAsPermanent"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-4 p-3 border rounded-md bg-gray-50" ref={registerFieldRef("sameAsPermanent")}>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isFieldDisabled("sameAsPermanent")} />
                                                                    {isFieldDisabled("sameAsPermanent") && (
                                                                        <span
                                                                            className="absolute right-2 top-2.5"
                                                                            title="Auto-filled from KRA and locked"
                                                                        >
                                                                            <Info className="h-4 w-4 text-blue-400" />
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </FormControl>
                                                            <div className="space-y-1 leading-none">
                                                                <FormLabel className="font-medium">Same as Permanent Address</FormLabel>
                                                                <FormDescription>
                                                                    Check this if your correspondence address is the same as your permanent address
                                                                </FormDescription>
                                                            </div>
                                                        </FormItem>
                                                    )}
                                                />

                                                {!sameAsPermanent && (
                                                    <div className="space-y-4">
                                                        <div className="bg-blue-50 p-3 rounded-md mb-4">
                                                            <h3 className="font-medium text-blue-800">Correspondence Address</h3>
                                                            <p className="text-sm text-blue-600">
                                                                This is the address where you'll receive all communications
                                                            </p>
                                                        </div>

                                                        <div className="grid gap-4 sm:grid-cols-2">
                                                            <FormField
                                                                control={form.control}
                                                                name="correspondenceAddressLine1"
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Address Line <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                        <FormControl>
                                                                            <div className="relative">
                                                                                <Input placeholder="Flat/House No., Building Name" {...field} disabled={isFieldDisabled("correspondenceAddressLine1")} className="pr-8" />
                                                                                {isFieldDisabled("correspondenceAddressLine1") && (
                                                                                    <span
                                                                                        className="absolute right-2 top-2.5"
                                                                                        title="Auto-filled from KRA and locked"
                                                                                    >
                                                                                        <Info className="h-4 w-4 text-blue-400" />
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <FormField
                                                                control={form.control}
                                                                name="correspondenceCity"
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>City <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                        <FormControl>
                                                                            <div className="relative">
                                                                                <Input placeholder="City" {...field} disabled={isFieldDisabled("correspondenceCity")} />
                                                                                {isFieldDisabled("correspondenceCity") && (
                                                                                    <span
                                                                                        className="absolute right-2 top-2.5"
                                                                                        title="Auto-filled from KRA and locked"
                                                                                    >
                                                                                        <Info className="h-4 w-4 text-blue-400" />
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>

                                                        <div className="grid gap-4 sm:grid-cols-3">
                                                            <FormField
                                                                control={form.control}
                                                                name="correspondenceState"
                                                                render={({ field }) => (
                                                                    <FormItem className="flex flex-col" ref={registerFieldRef("correspondenceState")}>
                                                                        <FormLabel>State <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                        <div className="relative">
                                                                            <SearchableSelect
                                                                                disabled={isFieldDisabled("correspondenceState")}
                                                                                field={field}
                                                                                options={stateCodes}
                                                                                placeholder="Select State"
                                                                            />
                                                                            {isFieldDisabled("correspondenceState") && (
                                                                                <span
                                                                                    className="absolute right-2 top-2.5"
                                                                                    title="Auto-filled from KRA and locked"
                                                                                >
                                                                                    <Info className="h-4 w-4 text-blue-400" />
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <FormField
                                                                control={form.control}
                                                                name="correspondencePincode"
                                                                render={({ field }) => (
                                                                    <FormItem ref={registerFieldRef("correspondencePincode")}>
                                                                        <FormLabel>Pincode <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                        <FormControl>
                                                                            <div className="relative">
                                                                                <Input placeholder="6-digit pincode" {...field} disabled={isFieldDisabled("correspondencePincode")} />
                                                                                {isFieldDisabled("correspondencePincode") && (
                                                                                    <span
                                                                                        className="absolute right-2 top-2.5"
                                                                                        title="Auto-filled from KRA and locked"
                                                                                    >
                                                                                        <Info className="h-4 w-4 text-blue-400" />
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <FormField
                                                                control={form.control}
                                                                name="correspondenceCountry"
                                                                render={({ field }) => (
                                                                    <FormItem className="flex flex-col" ref={registerFieldRef("correspondenceCountry")}>
                                                                        <FormLabel>Country <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                        <div className="relative">
                                                                            <SearchableSelect
                                                                                disabled={isFieldDisabled("correspondenceCountry")}
                                                                                field={field}
                                                                                options={countryCodes}
                                                                                placeholder="Select country"
                                                                            />
                                                                            {isFieldDisabled("correspondenceCountry") && (
                                                                                <span
                                                                                    className="absolute right-2 top-2.5"
                                                                                    title="Auto-filled from KRA and locked"
                                                                                >
                                                                                    <Info className="h-4 w-4 text-blue-400" />
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {/* )} */}
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Additional Options Section */}
                                <div ref={additionalSectionRef} className="scroll-mt-25 mt-8 transition-all duration-300 ease-in-out border-gray-200 rounded-lg overflow-hidden shadow-lg border-0 bg-white/80 backdrop-blur">
                                    <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                        <div
                                            className={`bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200 flex justify-between items-center cursor-pointer`}
                                            onClick={() => {
                                                // if (formProgress.additional === 100) {
                                                toggleSection("additional");
                                                // }
                                            }}
                                            title={formProgress.additional === 100 ? "Toggle Additional Information" : "Complete all required fields to access"}
                                        >
                                            <h3 className="text-blue-800 flex items-center text-lg font-medium gap-3">
                                                <span className="text-xl">{expandedSections.additional ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}</span>
                                                Additional Options ({formProgress.additional}%)

                                                {/* Completed badge */}
                                                {formProgress.additional === 100 && (
                                                    <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800 border border-green-300">
                                                        ✔ Completed
                                                    </span>
                                                )}
                                            </h3>
                                        </div>
                                        <div
                                            className={`transition-[max-height,opacity] duration-500 ease-in-out overflow-hidden ${expandedSections.additional ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"
                                                }`}
                                        >
                                            {/* {expandedSections.additional && ( */}
                                            <div className="p-6 space-y-6 bg-white">
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <FormField
                                                        control={form.control}
                                                        name="openFreshAccount"
                                                        render={({ field }) => (
                                                            <FormItem className="space-y-4 space-x-4" ref={registerFieldRef("openFreshAccount")}>
                                                                <FormLabel>Open Fresh Account? <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                <FormControl>
                                                                    <RadioGroup
                                                                        onValueChange={field.onChange}
                                                                        defaultValue={field.value}
                                                                        className="flex space-x-4"
                                                                    >
                                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                                            <FormControl>
                                                                                <RadioGroupItem value="yes" />
                                                                            </FormControl>
                                                                            <FormLabel className="font-normal">Yes</FormLabel>
                                                                        </FormItem>
                                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                                            <FormControl>
                                                                                <RadioGroupItem value="no" />
                                                                            </FormControl>
                                                                            <FormLabel className="font-normal">No</FormLabel>
                                                                        </FormItem>
                                                                    </RadioGroup>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="bsdaOption"
                                                        render={({ field }) => (
                                                            <FormItem className="space-y-4 space-x-4" ref={registerFieldRef("bsdaOption")}>
                                                                <FormLabel>BSDA (Basic Services Demat Account) <span className="text-red-500 font-bold text-lg">*</span>    </FormLabel>
                                                                <FormControl>
                                                                    <RadioGroup
                                                                        onValueChange={field.onChange}
                                                                        defaultValue={field.value}
                                                                        className="flex space-x-4"
                                                                    >
                                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                                            <FormControl>
                                                                                <RadioGroupItem value="YES" />
                                                                            </FormControl>
                                                                            <FormLabel className="font-normal">Yes</FormLabel>
                                                                        </FormItem>
                                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                                            <FormControl>
                                                                                <RadioGroupItem value="NO" />
                                                                            </FormControl>
                                                                            <FormLabel className="font-normal">No</FormLabel>
                                                                        </FormItem>
                                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                                            <FormControl>
                                                                                <RadioGroupItem value="OPTED OUT" />
                                                                            </FormControl>
                                                                            <FormLabel className="font-normal">Opted Out</FormLabel>
                                                                        </FormItem>
                                                                    </RadioGroup>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <FormField
                                                        control={form.control}
                                                        name="politicallyExposed"
                                                        render={({ field }) => (
                                                            <FormItem className="space-y-4 space-x-4">
                                                                <FormLabel>Are you politically exposed?</FormLabel>
                                                                <FormControl>
                                                                    <RadioGroup
                                                                        onValueChange={field.onChange}
                                                                        defaultValue={field.value}
                                                                        className="flex space-x-4"
                                                                    >
                                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                                            <FormControl>
                                                                                <RadioGroupItem value="yes" />
                                                                            </FormControl>
                                                                            <FormLabel className="font-normal">Yes</FormLabel>
                                                                        </FormItem>
                                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                                            <FormControl>
                                                                                <RadioGroupItem value="no" />
                                                                            </FormControl>
                                                                            <FormLabel className="font-normal">No</FormLabel>
                                                                        </FormItem>
                                                                    </RadioGroup>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="accountSettlement"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Running Account Settlement</FormLabel>
                                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select frequency" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="monthly">Monthly</SelectItem>
                                                                        <SelectItem value="quarterly">Quarterly</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                <div id="bo" className="scroll-mt-32 ">
                                                    <div className=" border-gray-200 rounded-lg overflow-hidden mt-8 shadow-lg border-0 bg-white/80 backdrop-blur">
                                                        <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-green-200">
                                                            <h3 className="text-green-800 flex items-center text-lg font-medium">
                                                                <FileText className="mr-2 h-5 w-5 text-green-600" />
                                                                BO Details and Flags
                                                            </h3>
                                                            <p className="text-green-700/70 text-sm mt-1">Beneficial Owner account details and preferences</p>
                                                        </div>
                                                        <div className="p-6 space-y-6 bg-white">

                                                            {/* Basic BO Information */}
                                                            <div className="grid gap-4 md:grid-cols-2">
                                                                <DatePickerField
                                                                    ref={registerFieldRef("boDetails.accOpeningDate")}
                                                                    control={form.control}
                                                                    name={`boDetails.accOpeningDate`}
                                                                    label={`Account Opening Date `}
                                                                    required
                                                                    placeholder="Select your Account Opening Date"
                                                                />
                                                                <DatePickerField
                                                                    ref={registerFieldRef("boDetails.documentReceiveDate")}
                                                                    control={form.control}
                                                                    name={`boDetails.documentReceiveDate`}
                                                                    label={`Document Receive Date`}
                                                                    required
                                                                    placeholder="Select your Document Receive Date"
                                                                />
                                                            </div>

                                                            <div className="grid gap-4 md:grid-cols-2 mt-4">
                                                                <FormField
                                                                    control={form.control}
                                                                    name="boDetails.boStatus"
                                                                    render={({ field }) => (
                                                                        <FormItem className="flex flex-col my-auto" ref={registerFieldRef("boDetails.boStatus")}>
                                                                            <FormLabel>BO Status <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                            <SearchableSelect
                                                                                field={field}
                                                                                options={boStatusOptions}
                                                                                placeholder="Select BO status"
                                                                            />
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />

                                                                <FormField
                                                                    control={form.control}
                                                                    name="boDetails.boSubStatus"
                                                                    render={({ field }) => (
                                                                        <FormItem className="flex flex-col" ref={registerFieldRef("boDetails.boSubStatus")}>
                                                                            <FormLabel>BO Substatus <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                            <SearchableSelect
                                                                                field={field}
                                                                                options={boSubStatusOptions}
                                                                                placeholder="Select BO substatus"
                                                                            />
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            </div>

                                                            <div className="grid gap-4 md:grid-cols-2 mt-4">
                                                                <FormField
                                                                    control={form.control}
                                                                    name="boDetails.boAccountCategory"
                                                                    render={({ field }) => (
                                                                        <FormItem className="flex flex-col" ref={registerFieldRef("boDetails.boAccountCategory")}>
                                                                            <FormLabel>BO Category <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                            <SearchableSelect
                                                                                field={field}
                                                                                options={boCategoryOptions}
                                                                                placeholder="Select BO category"
                                                                            />
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                                <FormField
                                                                    control={form.control}
                                                                    name="boDetails.boStatementCycleCode"
                                                                    render={({ field }) => (
                                                                        <FormItem className="" ref={registerFieldRef("boDetails.boStatementCycleCode")}>
                                                                            <FormLabel>BO Statement Cycle Code <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                            <SearchableSelect
                                                                                field={field}
                                                                                options={boStatementCycleCode}
                                                                                placeholder="Select statement cycle"
                                                                            />
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />

                                                            </div>

                                                            {/* Communication Preferences */}
                                                            <div className="grid gap-4 md:grid-cols-3 mt-4">
                                                                <FormField
                                                                    control={form.control}
                                                                    name="boDetails.accountOpeningSrc"
                                                                    render={({ field }) => (
                                                                        <FormItem ref={registerFieldRef("boDetails.accountOpeningSrc")}>
                                                                            <FormLabel>Account Opening Source <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                            <Select onValueChange={field.onChange} value={field.value}>
                                                                                <FormControl>
                                                                                    <SelectTrigger>
                                                                                        <SelectValue placeholder="Select opening source" />
                                                                                    </SelectTrigger>
                                                                                </FormControl>
                                                                                <SelectContent>
                                                                                    <SelectItem value="Online Account opening by the BO">Online Account opening by the BO</SelectItem>
                                                                                    <SelectItem value="Account Opening based on submission of Physical form">
                                                                                        Account Opening based on submission of Physical form
                                                                                    </SelectItem>
                                                                                    <SelectItem value="Default">Default</SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                                <FormField
                                                                    control={form.control}
                                                                    name="boDetails.smsFacility"
                                                                    render={({ field }) => (
                                                                        <FormItem ref={registerFieldRef("boDetails.smsFacility")}>
                                                                            <FormLabel>SMS Facility <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                            <Select onValueChange={field.onChange} value={field.value}>
                                                                                <FormControl>
                                                                                    <SelectTrigger>
                                                                                        <SelectValue placeholder="Select mode" />
                                                                                    </SelectTrigger>
                                                                                </FormControl>
                                                                                <SelectContent>
                                                                                    <SelectItem value="Smart Registration / SMS Facility">Smart Registration / SMS Facility</SelectItem>
                                                                                    <SelectItem value="No Smart Registration / No SMS Facility">No Smart Registration / No SMS Facility</SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />

                                                                <FormField
                                                                    control={form.control}
                                                                    name="boDetails.modeOfOperation"
                                                                    render={({ field }) => (
                                                                        <FormItem ref={registerFieldRef("boDetails.modeOfOperation")}>
                                                                            <FormLabel>Mode of Operation <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                            <Select onValueChange={field.onChange} value={field.value}>
                                                                                <FormControl>
                                                                                    <SelectTrigger>
                                                                                        <SelectValue placeholder="Select mode" />
                                                                                    </SelectTrigger>
                                                                                </FormControl>
                                                                                <SelectContent>
                                                                                    <SelectItem value="Sole Holder">Sole Holder</SelectItem>
                                                                                    <SelectItem value="Jointly (All Holder)">Jointly</SelectItem>
                                                                                    <SelectItem value="Any One or Survivors">Any One or Survivor</SelectItem>
                                                                                    <SelectItem value="Default">Default</SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                                <FormField
                                                                    control={form.control}
                                                                    name="boDetails.communicationsToBeSentTo"
                                                                    render={({ field }) => (
                                                                        <FormItem ref={registerFieldRef("boDetails.communicationsToBeSentTo")}>
                                                                            <FormLabel>Communications Preference <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                            <Select onValueChange={field.onChange} value={field.value}>
                                                                                <FormControl>
                                                                                    <SelectTrigger>
                                                                                        <SelectValue placeholder="Select communication preference" />
                                                                                    </SelectTrigger>
                                                                                </FormControl>
                                                                                <SelectContent>
                                                                                    <SelectItem value="First Holder">First Holder</SelectItem>
                                                                                    <SelectItem value="Second Holder">Second Holder</SelectItem>
                                                                                    <SelectItem value="Third Holder">Third Holder</SelectItem>
                                                                                    <SelectItem value="All Holders">All Holders</SelectItem>
                                                                                </SelectContent>
                                                                                <FormDescription>Required for non-individual clients</FormDescription>
                                                                                <FormMessage />
                                                                            </Select>
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                                <FormField
                                                                    control={form.control}
                                                                    name="boDetails.prefDepositoryFlag"
                                                                    render={({ field }) => (
                                                                        <FormItem className="space-y-6 space-x-4">
                                                                            <FormLabel>Prefered Depository Flag</FormLabel>
                                                                            <FormControl>
                                                                                <RadioGroup
                                                                                    onValueChange={field.onChange}
                                                                                    defaultValue={field.value}
                                                                                    className="flex space-x-4"
                                                                                >
                                                                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                                                                        <FormControl>
                                                                                            <RadioGroupItem value="CDSL" />
                                                                                        </FormControl>
                                                                                        <FormLabel className="font-normal">CDSL</FormLabel>
                                                                                    </FormItem>
                                                                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                                                                        <FormControl>
                                                                                            <RadioGroupItem value="NSDL" />
                                                                                        </FormControl>
                                                                                        <FormLabel className="font-normal">NSDL</FormLabel>
                                                                                    </FormItem>
                                                                                </RadioGroup>
                                                                            </FormControl>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            </div>

                                                            <div className="grid gap-4 md:grid-cols-2 mt-4">
                                                                <FormField
                                                                    control={form.control}
                                                                    name="boDetails.branch"
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormLabel>Branch</FormLabel>
                                                                            <FormControl>
                                                                                <div className="relative">
                                                                                    <Input placeholder="Select branch" {...field} className="pr-8" />

                                                                                </div>
                                                                            </FormControl>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                                <FormField
                                                                    control={form.control}
                                                                    name="boDetails.beneficiaryTaxDed"
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormLabel>Beneficiary Tax Deduction</FormLabel>
                                                                            <SearchableSelect
                                                                                field={{
                                                                                    ...field,
                                                                                    value: field.value ?? ""
                                                                                }}
                                                                                options={beneficiaryTaxDed}
                                                                                placeholder="Select Beneficiary Tax Deduction"
                                                                            />
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            </div>

                                                            {/* Optional Fields */}
                                                            <div className="grid gap-4 md:grid-cols-3 mt-4">
                                                                <FormField
                                                                    control={form.control}
                                                                    name="boDetails.clientEStatementFlag"
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormLabel>Email Statement Flag (Optional)</FormLabel>
                                                                            <Select onValueChange={field.onChange} value={field.value}>
                                                                                <FormControl>
                                                                                    <SelectTrigger>
                                                                                        <SelectValue placeholder="Select Statement flag" />
                                                                                    </SelectTrigger>
                                                                                </FormControl>
                                                                                <SelectContent>
                                                                                    <SelectItem value="Electronic Statement">Electronic Statement</SelectItem>
                                                                                    <SelectItem value="Physical Statement">Physical Statement</SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />

                                                                <FormField
                                                                    control={form.control}
                                                                    name="boDetails.geographicalCode"
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormLabel>Geographical Code (Optional)</FormLabel>
                                                                            <Select onValueChange={field.onChange} value={field.value}>
                                                                                <FormControl>
                                                                                    <SelectTrigger>
                                                                                        <SelectValue placeholder="Select geographical code" />
                                                                                    </SelectTrigger>
                                                                                </FormControl>
                                                                                <SelectContent>
                                                                                    <SelectItem value="Metropolitan">Metropolitan</SelectItem>
                                                                                    <SelectItem value="Others">Others</SelectItem>
                                                                                    <SelectItem value="Rural">Rural</SelectItem>
                                                                                    <SelectItem value="Semi Urban">Semi Urban</SelectItem>
                                                                                    <SelectItem value="Urban">Urban</SelectItem>
                                                                                    <SelectItem value="Default">Default</SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />


                                                                <FormField
                                                                    control={form.control}
                                                                    name="boDetails.fixChargeModule"
                                                                    render={({ field }) => (
                                                                        <FormItem >
                                                                            <FormLabel>Fix Charge Module</FormLabel>
                                                                            <Select onValueChange={field.onChange} value={field.value}>
                                                                                <FormControl>
                                                                                    <SelectTrigger>
                                                                                        <SelectValue placeholder="Select fix charge module" />
                                                                                    </SelectTrigger>
                                                                                </FormControl>
                                                                                <SelectContent>
                                                                                    <SelectItem value="100POA_KRA">100POA_KRA</SelectItem>
                                                                                    <SelectItem value="200POA_KRA">200POA_KRA</SelectItem>
                                                                                    <SelectItem value="KRA">KRA</SelectItem>
                                                                                    <SelectItem value="KRA_POA_NE">KRA_POA_NE</SelectItem>
                                                                                </SelectContent>
                                                                                <FormDescription>Required for non-individual clients</FormDescription>
                                                                                <FormMessage />
                                                                            </Select>
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            </div>

                                                            {/* Boolean Flags */}
                                                            <div className="mt-6 space-y-4">
                                                                <h4 className="font-medium text-gray-900">Account Flags</h4>

                                                                <div className="grid gap-4 md:grid-cols-2">
                                                                    <FormField
                                                                        control={form.control}
                                                                        name="boDetails.boSettlementPlanningFlag"
                                                                        render={({ field }) => (
                                                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                                                <div className="space-y-0.5">
                                                                                    <FormLabel className="text-base">BO Settlement Planning Flag</FormLabel>
                                                                                </div>
                                                                                <FormControl>
                                                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                                                </FormControl>
                                                                            </FormItem>
                                                                        )}
                                                                    />
                                                                    <FormField
                                                                        control={form.control}
                                                                        name="boDetails.mentalDisability"
                                                                        render={({ field }) => (
                                                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                                                <div className="space-y-0.5">
                                                                                    <FormLabel className="text-base">Mental Disability</FormLabel>
                                                                                </div>
                                                                                <FormControl>
                                                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                                                </FormControl>
                                                                            </FormItem>
                                                                        )}
                                                                    />

                                                                    <FormField
                                                                        control={form.control}
                                                                        name="boDetails.standingInstructionIndicator"
                                                                        render={({ field }) => (
                                                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                                                <div className="space-y-0.5">
                                                                                    <FormLabel className="text-base">Standing Instruction Indicator</FormLabel>
                                                                                    <FormDescription>Enable standing instructions for transactions</FormDescription>
                                                                                </div>
                                                                                <FormControl>
                                                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                                                </FormControl>
                                                                            </FormItem>
                                                                        )}
                                                                    />

                                                                    <FormField
                                                                        control={form.control}
                                                                        name="boDetails.autoPledgeIndicator"
                                                                        render={({ field }) => (
                                                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                                                <div className="space-y-0.5">
                                                                                    <FormLabel className="text-base">Pledge Standing Instruction</FormLabel>
                                                                                    <FormDescription>Enable pledge standing instructions</FormDescription>
                                                                                </div>
                                                                                <FormControl>
                                                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                                                </FormControl>
                                                                            </FormItem>
                                                                        )}
                                                                    />
                                                                </div>

                                                                <div className="grid gap-4 md:grid-cols-2">
                                                                    <FormField
                                                                        control={form.control}
                                                                        name="boDetails.annualReportFlag"
                                                                        render={({ field }) => (
                                                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                                                <div className="space-y-0.5">
                                                                                    <FormLabel className="text-base">Annual Report Flag</FormLabel>
                                                                                    <FormDescription>Receive annual reports</FormDescription>
                                                                                </div>
                                                                                <FormControl>
                                                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                                                </FormControl>
                                                                            </FormItem>
                                                                        )}
                                                                    />

                                                                    <FormField
                                                                        control={form.control}
                                                                        name="boDetails.electronicConfirmation"
                                                                        render={({ field }) => (
                                                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                                                <div className="space-y-0.5">
                                                                                    <FormLabel className="text-base">Electronic Confirmation</FormLabel>
                                                                                </div>
                                                                                <FormControl>
                                                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                                                </FormControl>
                                                                            </FormItem>
                                                                        )}
                                                                    />
                                                                </div>


                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* )} */}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button
                                        type="submit"
                                        className="w-full sm:w-auto transition-all hover:scale-105 font-medium px-8 py-2.5 text-base bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600"
                                        disabled={isSubmitting}
                                        onClick={(e) => {
                                            const errorFields = Object.keys(form.formState.errors);

                                            if (errorFields.length > 0) {
                                                const firstErrorField = errorFields[0];
                                                form.setFocus(firstErrorField as any); // will scroll to and focus that field
                                                console.log("Redirecting to first error:", firstErrorField);
                                            }

                                            console.log("Submit button clicked directly");
                                            console.log("Current form state:", {
                                                isValid: form.formState.isValid,
                                                isDirty: form.formState.isDirty,
                                                errors: form.formState.errors,
                                            });
                                            setHasSubmitted(true);

                                            // Don't prevent default – allow normal form submit
                                        }}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            "Verify & Continue"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </>
                )}


            </div >
        </>

    )
}
