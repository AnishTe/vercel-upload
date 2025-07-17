"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
import * as z from "zod"
import {
    User,
    Calendar,
    Check,
    AlertCircle,
    Loader2,
    Plus,
    Shield,
    UserPlus,
    Percent,
    Info,
    Trash2,
    Baby,
    ChevronDown,
    ChevronUp,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format, isValid, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { useKYC } from "@/contexts/kyc-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { addHolderDetailsKYC, addNomineeDetailsKYC, addPOADetailsKYC, fetchHolderDetailsKYC, fetchNomineeDetailsKYC, fetchPOADetailsKYC } from "@/lib/auth"
import { getLocalStorage } from "@/utils/localStorage"
import { SearchableSelect } from "../Dashboard/UI_Components/searchableSelect"
import { DatePickerField } from "../Dashboard/UI_Components/datePicker"
import { motion } from "framer-motion"
import kycData from "@/data/kyc.json";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible"
import { KYCBackButton } from "./kyc-back-button"
import { useKYCError } from "@/contexts/KYCErrorContext"
const { relationOptions, nationalityCodes } = kycData;

const guardianSchema = z.object({
    name: z.string().min(1, "Guardian full name is required"),
    dob: z
        .preprocess((val) => (val === "" || val === null ? undefined : val), z.date({
            required_error: "Guardian Date of birth is required",
            invalid_type_error: "Guardian Invalid date format",
        }))
        .optional()
        .refine((d) => !d || d <= new Date(), {
            message: "Guardian DOB cannot be in the future",
        }),
    isdCode: z.string().min(1, "Guardian ISD code is required").default("91").optional().nullable(),
    mobile: z
        .string()
        .regex(/^\d{10}$/, "Guardian Mobile must be a 10-digit number")
        .optional()
        .nullable().or(z.literal("")),
    email: z.string().email("Guardian Invalid email format").optional().or(z.literal("")),
    address: z.string().min(5, "Guardian address is required"),
    countryCode: z.string().min(2, "Guardian country code is required"),
    stateCode: z.string().min(2, "Guardian state code is required"),
    pinCode: z.string().min(2, "Guardian pin code is required"),
    fatherName: z.string().min(1, "Guardian's / Husband's name is required"),
    gender: z.string()
        .refine(val => ["Male", "Fmale", "Other"].includes(val), {
            message: "Please select Guardian gender",
        }),
    pan: z
        .string()
        .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/i, "Invalid Guardian PAN format")
        .transform((val) => val.toUpperCase()),
    aadhar: z.string().refine(
        (val) => {
            if (val === "") return true
            return /^\d{12}$/.test(val) || /^(\*{8}|x{8})\d{4}$/.test(val)
        },
        {
            message: "Guardian Aadhar must be a 12-digit number or a valid masked format.",
        },
    ),
    relationWithMinorNominee: z
        .string()
        .refine((val) => relationOptions.includes(val), { message: "Guardian Relation with minor nominee is required" }),
})

// Fixed nominee schema with proper conditional validation
const nomineeSchema = z
    .object({
        name: z.string().min(1, "Nominee Full name is required"),
        dob: z
            .date({ required_error: "Nominee Date of birth is required", invalid_type_error: "Nominee Invalid date format" })
            .refine((d) => d <= new Date(), { message: "Nominee DOB cannot be in the future" }),
        proofType: z.string().refine((val) => ["pan", "uid", "passport", "driving_license", "voter_id"].includes(val), {
            message: "Please select a valid Nominee Proof Type.",
        }),
        proofNumber: z.string().min(1, "Nominee Proof number is required"),
        isdCode: z.string().min(1).default("91").optional().nullable(),
        mobile: z.string().regex(/^\d{10}$/, "Nominee Mobile must be a 10-digit number"),
        email: z.string().email("Nominee Invalid email format"),
        address: z.string().min(5, "Nominee Address is required"),
        countryCode: z.string().min(2, "Nominee Country is required"),
        stateCode: z.string().min(2, "Nominee State is required"),
        pinCode: z.string().min(2, "Nominee Pin Code is required"),
        fatherName: z.string().min(1, "Nominee Father Name is required"),
        gender: z.string()
            .refine(val => ["Male", "Fmale", "Other"].includes(val), {
                message: "Please select Nominee gender",
            }),
        pan: z
            .string()
            .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/i, "Invalid Nominee PAN format")
            .transform((val) => val.toUpperCase()),

        relationWithBo: z.string().refine((val) => relationOptions.includes(val), {
            message: "Nominee Relation with BO is required",
        }),
        percentageShares: z.number().min(1).max(100),
        isMinor: z.boolean().optional().default(false),
        guardian: guardianSchema.optional(),
    })
    .superRefine((nominee, ctx) => {
        const { isMinor, dob, guardian } = nominee

        // Calculate age from DOB
        let isMinorByAge = false
        if (dob instanceof Date) {
            const today = new Date()
            let age = today.getFullYear() - dob.getFullYear()
            const m = today.getMonth() - dob.getMonth()
            if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
            isMinorByAge = age < 18
        }

        // ✅ FIXED: Only validate guardian if EITHER isMinor is true OR age < 18
        const shouldValidateGuardian = isMinor || isMinorByAge

        if (shouldValidateGuardian) {
            // Guardian is required
            if (!guardian) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Guardian is required for minor nominee",
                    path: ["guardian"],
                })
                return // Early return to avoid further validation
            }

            // Validate guardian fields only if guardian object exists
            const result = guardianSchema.safeParse(guardian)
            if (!result.success) {
                for (const err of result.error.issues) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: err.message,
                        path: ["guardian", ...err.path],
                    })
                }
            }
        }
        // ✅ FIXED: If not minor, we don't validate guardian at all
        // This allows the guardian object to exist but not be validated
    })

const holderSchema = z.object({
    name: z.string().min(1, "Holder Name is required."),
    fatherName: z.string().optional(),
    pan: z.string()
        .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/i, "Invalid Holder PAN format")
        .transform(val => val.toUpperCase()),
    mobile: z
        .string({
            required_error: "Holder Mobile number is required",
            invalid_type_error: "Holder Mobile must be a string",
        })
        .regex(/^\d{10}$/, "Holder Mobile must be a 10-digit number"),

    email: z
        .string({
            required_error: "Holder Email is required",
            invalid_type_error: "Holder Email must be a string",
        })
        .email("Invalid Holder email format"),
    isdCode: z
        .string()
        .min(1, "Holder ISD code is required")
        .default("91")
        .optional()
        .nullable(),

    dob: z
        .date({
            required_error: "Holder Date of birth is required",
            invalid_type_error: "Holder Invalid date format",
        })
        .refine(d => d <= new Date(), {
            message: "Holder DOB cannot be in the future",
        }),
    aadhar: z
        .string({
            required_error: "Holder Aadhar is required",
            invalid_type_error: "Holder Aadhar must be a string",
        })
        .min(1, "Holder Aadhar is required")
        .refine(
            (val) =>
                /^\d{12}$/.test(val) ||             // 12-digit full Aadhar
                /^(\*{8}|x{8}|X{8})\d{4}$/.test(val), // Masked Aadhar: 8 *, 8 lowercase x, or 8 uppercase X + 4 digits
            {
                message: "Holder Aadhar must be a 12-digit number or a valid masked format.",
            }
        ),
    gender: z.preprocess(
        (val) => val === "" ? undefined : val,
        z.enum(["Male", "Fmale", "Other"], {
            required_error: "Holder Gender Required!",
            invalid_type_error: "Holder Gender Required!",
        })
    ),
    nationality: z.string().optional()
});

const poaSchema = z.object({
    poaId: z.string().optional(),
    poaSetupDate: z.date().optional(),
    poaFromDate: z
        .date({
            required_error: "From date is required",
            invalid_type_error: "Invalid date format",
        }),
    poaToDate: z.date().optional(),
    poaPurposeCode: z.string().optional(),
    poaRemarks: z.string().optional(),
    poaGpaBpaFlag: z
        .array(z.string(), {
            required_error: "Please select at least 2 options",
            invalid_type_error: "Invalid selection",
        })
        .refine((arr) => arr.length >= 2, {
            message: "Please select at least 2 options",
        }),
})

const firstHolderSchema = holderSchema.extend({
    permanentAddressLine1: z.string().min(1, "Permanent Address Line 1 is required"),
    permanentCity: z.string().min(1, "Permanent City is required"),
    permanentState: z.string().min(1, "Permanent State is required"),
    permanentPincode: z.string().min(1, "Permanent Pincode is required"),
    permanentCountry: z.string().min(1, "Permanent Country is required"),
    correspondenceAddressLine1: z.string().min(1, "Correspondence Address Line 1 is required"),
    correspondenceCity: z.string().min(1, "Correspondence City is required"),
    correspondenceState: z.string().min(1, "Correspondence State is required"),
    correspondenceCountry: z.string().min(1, "Correspondence Country is required"),
    correspondencePincode: z.string().min(1, "Correspondence Pincode is required"),
    nationality: z.string().min(1, "Nationality is required"),
    occupationType: z.string().min(1, "Occupation Type is required"),
    annualIncome: z.string().min(1, "Annual Income is required"),
});

const nomineePoaFormSchema = z.object({
    wishToNominate: z.enum(["yes", "no"], {
        required_error: "Please select whether you wish to nominate.",
    }),
    nominees: z.array(nomineeSchema).max(3),
    // isMinor: z.boolean().default(false),
    // guardian: z.any().optional(), // bypass automatic validation

    // POA Fields
    wishToPOA: z.enum(["yes", "no"], {
        required_error: "Please select whether you wish to poa.",
    }),
    poas: z.array(poaSchema).max(2),

    // Holder flags
    addSecondHolder: z.boolean().default(false),
    addThirdHolder: z.boolean().default(false),

    holders: z.object({
        firstHolder: firstHolderSchema.optional(),
        secondHolder: z.lazy(() => z.union([holderSchema, z.undefined()])), // ✅ Skip validation unless included
        thirdHolder: z.lazy(() => z.union([holderSchema, z.undefined()])),  // ✅ Skip validation unless included
    }).optional(),

})
    .superRefine((data, ctx) => {
        // ✅ Guardian required if minor
        // if (data.isMinor) {
        //     const g = data.guardian;
        //     if (!g) {
        //         ctx.addIssue({
        //             code: z.ZodIssueCode.custom,
        //             message: "Guardian is required for minor nominee",
        //             path: ["guardian"],
        //         });
        //     } else {
        //         if (!g.name) ctx.addIssue({ code: "custom", message: "Guardian name is required", path: ["guardian", "name"] });
        //         if (!g.dob) ctx.addIssue({ code: "custom", message: "Guardian DOB is required", path: ["guardian", "dob"] });
        //         if (!g.address) ctx.addIssue({ code: "custom", message: "Guardian address is required", path: ["guardian", "address"] });
        //         if (!g.relationWithMinorNominee) ctx.addIssue({ code: "custom", message: "Relation with minor nominee is required", path: ["guardian", "relationWithMinorNominee"] });
        //     }
        // }

        // ✅ At least one nominee if opted
        if (data.wishToNominate === "yes" && data.nominees.length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "At least one nominee is required if you wish to nominate",
                path: ["nominees"],
            });
        }

        if (data.wishToPOA === "yes" && data.poas.length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "At least one poa is required if you wish to nominate",
                path: ["poas"],
            });
        }

        // ✅ Total nominee shares = 100%
        if (data.wishToNominate === "yes" && data.nominees.length > 0) {
            const total = data.nominees.reduce((sum, nom) => sum + nom.percentageShares, 0);
            if (total !== 100) {
                ctx.addIssue({
                    code: "custom",
                    message: "Total nominee shares must equal 100%",
                    path: ["nominees"],
                });
            }
        }

        // ✅ Each minor nominee must have guardian
        data.nominees.forEach((nom, i) => {
            if (nom.isMinor && !nom.guardian) {
                ctx.addIssue({
                    code: "custom",
                    message: "Guardian information is required for minor nominee",
                    path: ["nominees", i, "guardian"],
                });
            }
        });

        // ✅ Conditional validation for holders
        if (data.addSecondHolder) {
            const result = holderSchema.safeParse(data.holders?.secondHolder);
            if (!result.success) {
                result.error.errors.forEach(err =>
                    ctx.addIssue({
                        code: "custom",
                        message: err.message,
                        path: ["holders", "secondHolder", ...err.path],
                    })
                );
            }
        }

        if (data.addThirdHolder) {
            const result = holderSchema.safeParse(data.holders?.thirdHolder);
            if (!result.success) {
                result.error.errors.forEach(err =>
                    ctx.addIssue({
                        code: "custom",
                        message: err.message,
                        path: ["holders", "thirdHolder", ...err.path],
                    })
                );
            }
        }
    });

type NomineePoaFormValues = z.infer<typeof nomineePoaFormSchema>

type POAType = {
    poaNatureType?: string;
    poaOrDdpiId?: string;
    poaCreationDate?: string;
    poaEffectiveFromDate?: string;
    poaEffectiveToDate?: string;
    poaLinkPurposeCode?: string;
    poaNo?: string;
};

// Define form sections for progress tracking
const formSections = [
    { id: "holders", title: "Holders", icon: <UserPlus className="h-5 w-5" /> }, // New section for holders
    { id: "nominee", title: "Nominee Information", icon: <User className="h-5 w-5" /> },
    { id: "poa", title: "Power of Attorney", icon: <Shield className="h-5 w-5" /> },
]

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

export default function NomineePoaForm() {
    const [isLoadingData, setIsLoadingData] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [shareRemaining, setShareRemaining] = useState(100)
    const [expandedNominees, setExpandedNominees] = useState<Record<number, boolean>>({})
    const [formInitialized, setFormInitialized] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [nomineeProofPreviews, setNomineeProofPreviews] = useState<(string | null)[]>([null, null, null])
    const [activeSection, setActiveSection] = useState("holders")
    const [formProgress, setFormProgress] = useState({
        nominee: 0,
        poa: 0,
        holders: 0,
        total: 0,
    })

    const [hasSubmitted, setHasSubmitted] = useState(false);
    const profileDetails = getLocalStorage("kyc_personal-details_form")
    let parsedprofileDetails
    if (profileDetails) {
        parsedprofileDetails = JSON.parse(profileDetails);
    }

    // Ref for the sticky header to calculate offset
    const headerRef = useRef<HTMLDivElement>(null)

    const { handleStepCompletion, checkTokenValidity } = useKYC()
    const { toast } = useToast()
    const { registerFieldRef, setErrors } = useKYCError();

    // Default values for the form
    const defaultValues = useMemo<Partial<NomineePoaFormValues>>(
        () => ({
            wishToNominate: "no",
            wishToPOA: "no",
            nominees: [],
            poas: [],

            // Holder defaults
            addSecondHolder: false,
            addThirdHolder: false,
            holders: {
                firstHolder: {
                    name: `${parsedprofileDetails?.firstName || ""} ${parsedprofileDetails?.middleName || ""} ${parsedprofileDetails?.lastName || ""}`.trim(),
                    fatherName: parsedprofileDetails?.fatherSpouseName || "",
                    pan: parsedprofileDetails?.pan || "",
                    email: parsedprofileDetails?.email || "",
                    isdCode: parsedprofileDetails?.isdCode || "91",
                    mobile: parsedprofileDetails?.mobile || "",
                    dob: parsedprofileDetails?.dobSchema ? new Date(parsedprofileDetails?.dobSchema) : new Date(),
                    aadhar: parsedprofileDetails?.aadharSchema || "",
                    gender: (() => {
                        const g = capitalize(parsedprofileDetails?.genderSchema || "Other");
                        if (g === "Male" || g === "Fmale" || g === "Other") return g;
                        return "Other";
                    })(),
                    nationality: parsedprofileDetails?.nationality || "IN",
                    // Address defaults
                    permanentAddressLine1: parsedprofileDetails?.permanentAddressLine1 || "",
                    permanentCity: parsedprofileDetails?.permanentCity || "",
                    permanentState: parsedprofileDetails?.permanentState || "",
                    permanentPincode: parsedprofileDetails?.permanentPincode || "",
                    permanentCountry: parsedprofileDetails?.permanentCountry || "IN",
                    correspondenceAddressLine1: parsedprofileDetails?.correspondenceAddressLine1 || "",
                    correspondenceCity: parsedprofileDetails?.correspondenceCity || "",
                    correspondenceState: parsedprofileDetails?.correspondenceState || "",
                    correspondenceCountry: parsedprofileDetails?.correspondenceCountry || "IN",
                    correspondencePincode: parsedprofileDetails?.correspondencePincode || "",
                    occupationType: parsedprofileDetails?.occupationType || "",
                    annualIncome: parsedprofileDetails?.annualIncome || "",
                },
                secondHolder: undefined,
                thirdHolder: undefined,
            }

        }),
        [parsedprofileDetails?.aadharSchema, parsedprofileDetails?.annualIncome, parsedprofileDetails?.correspondenceAddressLine1, parsedprofileDetails?.correspondenceCity, parsedprofileDetails?.correspondenceCountry, parsedprofileDetails?.correspondencePincode, parsedprofileDetails?.correspondenceState, parsedprofileDetails?.dobSchema, parsedprofileDetails?.email, parsedprofileDetails?.fatherSpouseName, parsedprofileDetails?.firstName, parsedprofileDetails?.genderSchema, parsedprofileDetails?.isdCode, parsedprofileDetails?.lastName, parsedprofileDetails?.middleName, parsedprofileDetails?.mobile, parsedprofileDetails?.nationality, parsedprofileDetails?.occupationType, parsedprofileDetails?.pan, parsedprofileDetails?.permanentAddressLine1, parsedprofileDetails?.permanentCity, parsedprofileDetails?.permanentCountry, parsedprofileDetails?.permanentPincode, parsedprofileDetails?.permanentState],
    )

    const form = useForm<NomineePoaFormValues>({
        resolver: zodResolver(nomineePoaFormSchema),
        defaultValues: defaultValues as NomineePoaFormValues,
    })

    // Use field array for nominees
    const {
        fields: nomineeFields,
        append: appendNominee,
        remove: removeNominee,
    } = useFieldArray({
        control: form.control,
        name: "nominees",
    })

    const {
        fields: poaFields,
        append: appendPOA,
        remove: removePOA,
    } = useFieldArray({
        control: form.control,
        name: "poas", // should match the schema key
    });

    // Watch for changes to wishToNominate to conditionally show nominee fields
    const wishToNominate = form.watch("wishToNominate")
    const wishToPOA = form.watch("wishToPOA")
    const nominees = form.watch("nominees")
    const poas = form.watch("poas")
    const addSecondHolder = form.watch("addSecondHolder")
    const addThirdHolder = form.watch("addThirdHolder")

    const mapHolderDataToForm = useCallback((holderArray: any[] = []) => {
        const mappedHolders: any = {};
        const flags: { addSecondHolder: boolean; addThirdHolder: boolean } = {
            addSecondHolder: false,
            addThirdHolder: false,
        };

        holderArray.forEach((holder: any, index: number) => {
            if (!holder) return;

            const nationalityCode = holder.holdNationalityCode || ""

            const mappedHolder = {
                name: holder.holdBoName || "",
                fatherName: holder.holdFatherHusbandName || "",
                pan: holder.holdPan || "",
                mobile: holder.holdMobileNo || "",
                email: holder.holdEmailId || "",
                isdCode: holder.holdIsdCodeForMobileNo || "91",
                dob: holder.holdDateOfBirth ? parseISO(holder.holdDateOfBirth) : undefined,
                aadhar: holder.holdAadhaar || "",
                gender: holder.holdSexCode === "MALE" ? "Male" : holder.holdSexCode === "FMALE" ? "Fmale" : "Other",
                nationality: nationalityCodes.find((c) => c.value === nationalityCode)?.value || "",
            };

            const firstHolder = {
                name: `${parsedprofileDetails?.firstName || ""} ${parsedprofileDetails?.middleName || ""} ${parsedprofileDetails?.lastName || ""}`.trim(),
                fatherName: parsedprofileDetails?.fatherSpouseName || "",
                pan: parsedprofileDetails?.pan || "",
                email: parsedprofileDetails?.email || "",
                isdCode: parsedprofileDetails?.isdCode || "91",
                mobile: parsedprofileDetails?.mobile || "",
                dob: parsedprofileDetails?.dobSchema ? new Date(parsedprofileDetails?.dobSchema) : new Date(),
                aadhar: parsedprofileDetails?.aadharSchema || "",
                gender: (() => {
                    const g = capitalize(parsedprofileDetails?.genderSchema || "Other");
                    if (g === "Male" || g === "Fmale" || g === "Other") return g;
                    return "Other";
                })(),
                nationality: parsedprofileDetails?.nationality || "IN",
                // Address defaults
                permanentAddressLine1: parsedprofileDetails?.permanentAddressLine1 || "",
                permanentCity: parsedprofileDetails?.permanentCity || "",
                permanentState: parsedprofileDetails?.permanentState || "",
                permanentPincode: parsedprofileDetails?.permanentPincode || "",
                permanentCountry: parsedprofileDetails?.permanentCountry || "IN",
                correspondenceAddressLine1: parsedprofileDetails?.correspondenceAddressLine1 || "",
                correspondenceCity: parsedprofileDetails?.correspondenceCity || "",
                correspondenceState: parsedprofileDetails?.correspondenceState || "",
                correspondenceCountry: parsedprofileDetails?.correspondenceCountry || "IN",
                correspondencePincode: parsedprofileDetails?.correspondencePincode || "",
                occupationType: parsedprofileDetails?.occupationType || "",
                annualIncome: parsedprofileDetails?.annualIncome || "",
            }

            if (index === 0) mappedHolders.firstHolder = firstHolder;
            if (index === 1) {
                mappedHolders.secondHolder = mappedHolder;
                flags.addSecondHolder = true;
            }
            if (index === 2) {
                mappedHolders.thirdHolder = mappedHolder;
                flags.addThirdHolder = true;
            }
        });

        return {
            holders: mappedHolders,
            ...flags, // 🧠 addSecondHolder and addThirdHolder at root level
        };
    }, [parsedprofileDetails?.aadharSchema, parsedprofileDetails?.annualIncome, parsedprofileDetails?.correspondenceAddressLine1, parsedprofileDetails?.correspondenceCity, parsedprofileDetails?.correspondenceCountry, parsedprofileDetails?.correspondencePincode, parsedprofileDetails?.correspondenceState, parsedprofileDetails?.dobSchema, parsedprofileDetails?.email, parsedprofileDetails?.fatherSpouseName, parsedprofileDetails?.firstName, parsedprofileDetails?.genderSchema, parsedprofileDetails?.isdCode, parsedprofileDetails?.lastName, parsedprofileDetails?.middleName, parsedprofileDetails?.mobile, parsedprofileDetails?.nationality, parsedprofileDetails?.occupationType, parsedprofileDetails?.pan, parsedprofileDetails?.permanentAddressLine1, parsedprofileDetails?.permanentCity, parsedprofileDetails?.permanentCountry, parsedprofileDetails?.permanentPincode, parsedprofileDetails?.permanentState]);

    const mapPOADataToForm = (poaArray: POAType[] = []) => {
        if (!Array.isArray(poaArray) || poaArray.length === 0) {
            return null;
        }

        const allNatureTypes = Array.from(
            new Set(
                poaArray
                    .map((poa) => poa.poaNatureType?.trim())
                    .filter(Boolean)
            )
        );

        const firstPOA = poaArray[0];

        return {
            poaId: firstPOA.poaOrDdpiId?.trim() || "",
            // poaSetupDate:
            //     firstPOA.poaCreationDate && isValid(parseISO(firstPOA.poaCreationDate))
            //         ? parseISO(firstPOA.poaCreationDate)
            //         : undefined,
            // poaFromDate:
            //     firstPOA.poaEffectiveFromDate && isValid(parseISO(firstPOA.poaEffectiveFromDate))
            //         ? parseISO(firstPOA.poaEffectiveFromDate)
            //         : undefined,
            // poaToDate:
            //     firstPOA.poaEffectiveToDate && isValid(parseISO(firstPOA.poaEffectiveToDate))
            //         ? parseISO(firstPOA.poaEffectiveToDate)
            //         : undefined,
            poaPurposeCode: firstPOA.poaLinkPurposeCode || "",
            poaRemarks: "",
            poaGpaBpaFlag: allNatureTypes, // merged unique values
        };
    };

    const normalizeGender = (val: string) => {
        const lower = val.toLowerCase()
        if (lower === "m" || lower === "male") return "Male"
        if (lower === "f" || lower === "female") return "Fmale"
        if (lower === "ts" || lower === "transgender") return "Transgender"
        return ""
    }

    const mapNomineeDataToForm = useCallback((nominee: any) => {
        const isMinor = nominee.isMinor === "YES" || nominee.nomMinorIndicator === "FNM";
        const relationWithBoCode = nominee.nomRelationship?.trim() || "";

        const cleaned: any = {
            name: nominee.nomName?.trim() || "",
            dob: nominee.nomDOB ? parseISO(nominee.nomDOB) : undefined,
            proofType: nominee.nomProofType?.toLowerCase().trim() || "",
            proofNumber: nominee.nomProofNo?.trim() || "",
            isdCode: "91", // default
            mobile: nominee.nomMobile?.trim() || "",
            email: nominee.nomEmail?.trim() || "",
            address: nominee.nomAddress?.trim() || "",
            countryCode: nominee.nomCountryCode?.trim() || "",
            stateCode: nominee.nomStateCode?.trim() || "",
            pinCode: nominee.nomPinCode?.trim() || "",
            fatherName: nominee.nomFatherHusbandName?.trim() || "",
            gender: normalizeGender(nominee.nomSexCode),
            pan: nominee.nomPAN?.trim() || "",
            relationWithBo: relationOptions.find((c) => c === relationWithBoCode) || "",
            percentageShares: parseFloat(nominee.nomPercentage?.trim()) || 0,
            isMinor,
        };

        if (isMinor) {
            cleaned.guardian = {
                name: nominee.guardName?.trim() || "",
                dob: nominee.guardDOB ? parseISO(nominee.guardDOB) : undefined,
                email: nominee.guardEmail?.trim() || "",
                mobile: nominee.guardMobile?.trim() || "",
                pan: nominee.guardPAN?.trim() || "",
                aadhar: nominee.guardAadhar?.trim() || "",
                address: nominee.guardAddress?.trim() || "",
                stateCode: nominee.guardStateCode?.trim() || "",
                pinCode: nominee.guardPinCode?.trim() || "",
                countryCode: nominee.guardCountryCode?.trim() || "",
                gender: normalizeGender(nominee.guardSexCode),
                fatherName: nominee.guardFatherHusbandName?.trim() || "",
                relationWithMinorNominee: nominee.guardRelationship?.trim() || "",
            };
        }

        return cleaned;
    }, []);

    const fetchDetails = useCallback(async () => {
        try {
            setIsLoadingData(true);

            const dematId = sessionStorage.getItem("dematId")
            if (!dematId) {
                toast({
                    title: "Error",
                    description: "Can't fetch the details, missing Demat ID.",
                    variant: "destructive",
                });
                return
            }

            const [nomineeResponse, holderResponse, poaResponse] = await Promise.all([
                fetchNomineeDetailsKYC({ dematId }),
                fetchHolderDetailsKYC({ dematId }),
                fetchPOADetailsKYC({ dematId }),
            ]);

            if (
                !checkTokenValidity(nomineeResponse?.data?.tokenValidity) ||
                !checkTokenValidity(holderResponse?.data?.tokenValidity) ||
                !checkTokenValidity(poaResponse?.data?.tokenValidity)
            ) {
                return; // Early exit if any token is invalid (dialog + redirect handled)
            }

            if (nomineeResponse.status === 200) {
                const nomineeDataArray = nomineeResponse.data.data; // ✅ This is an array

                if (Array.isArray(nomineeDataArray) && nomineeDataArray.length > 0) {
                    form.setValue("wishToNominate", "yes");

                    removeNominee(); // clear existing nominees if needed

                    nomineeDataArray.forEach(nominee => {
                        const nomineeForm = mapNomineeDataToForm(nominee);

                        // Optional: Validate parsed DOB and other fields here if needed
                        appendNominee(nomineeForm);
                    });
                }
            }

            if (holderResponse.status === 200) {
                const holderData = holderResponse.data.data
                if (Array.isArray(holderData) && holderData.length > 0) {
                    const mappedHolderFields = mapHolderDataToForm(holderData);
                    form.reset({
                        ...form.getValues(),
                        ...mappedHolderFields,
                    });
                }
            }

            if (poaResponse.status === 200) {
                const poaData = poaResponse.data.data;
                const poaForm = mapPOADataToForm(poaData);

                if (poaForm) {
                    form.setValue("wishToPOA", "yes");

                    removePOA(); // clear any existing

                    // Ensure poaFromDate is not undefined and poaGpaBpaFlag is string[]
                    if (Array.isArray(poaForm.poaGpaBpaFlag)) {
                        appendPOA({
                            ...poaForm,
                            poaFromDate: new Date(),
                            poaSetupDate: new Date(),
                            poaGpaBpaFlag: (poaForm.poaGpaBpaFlag as (string | undefined)[]).filter((v): v is string => typeof v === "string"),
                        });
                    }
                }
            }
            toast({
                title: "Success",
                description: "Details has been prefilled.",
            });

        } catch (error) {
            console.error("Error fetching profile details:", error);
            toast({
                title: "Error",
                description: "Failed to fetch BO details.",
                variant: "destructive",
            });
        } finally {
            setIsLoadingData(false);
        }
    }, [appendNominee, appendPOA, checkTokenValidity, form, mapHolderDataToForm, mapNomineeDataToForm, removeNominee, removePOA, toast])

    // Calculate form completion progress
    const calculateFormProgress = useCallback(() => {
        const formValues = form.getValues()
        const totalFields = { nominee: 0, poa: 0, holders: 0, total: 0 }
        const filledFields = { nominee: 0, poa: 0, holders: 0, total: 0 }

        // Nominee section
        totalFields.nominee += 1 // wishToNominate
        totalFields.total += 1
        if (formValues.wishToNominate) filledFields.nominee += 1
        if (formValues.wishToNominate) filledFields.total += 1

        if (formValues.wishToNominate === "yes") {
            if (formValues.nominees.length > 0) {
                formValues.nominees.forEach((nominee) => {
                    const nomineeBaseFields = 14 // name (first/last), relationship, address, mobile, email, dob, proofType, proofNumber, share
                    totalFields.nominee += nomineeBaseFields
                    totalFields.total += nomineeBaseFields

                    if (nominee.name) { // Check both for name completion
                        filledFields.nominee += 1
                        filledFields.total += 1
                    }
                    if (nominee.relationWithBo) {
                        filledFields.nominee += 1
                        filledFields.total += 1
                    }
                    if (nominee.address) {
                        filledFields.nominee += 1
                        filledFields.total += 1
                    }
                    if (nominee.proofType) {
                        filledFields.nominee += 1
                        filledFields.total += 1
                    }
                    if (nominee.proofNumber) {
                        filledFields.nominee += 1
                        filledFields.total += 1
                    }
                    if (nominee.percentageShares) {
                        filledFields.nominee += 1
                        filledFields.total += 1
                    }
                    if (nominee.mobile) {
                        filledFields.nominee += 1
                        filledFields.total += 1
                    }
                    if (nominee.email) {
                        filledFields.nominee += 1
                        filledFields.total += 1
                    }
                    if (nominee.countryCode) {
                        filledFields.nominee += 1
                        filledFields.total += 1
                    }
                    if (nominee.stateCode) {
                        filledFields.nominee += 1
                        filledFields.total += 1
                    }
                    if (nominee.pinCode) {
                        filledFields.nominee += 1
                        filledFields.total += 1
                    }
                    if (nominee.fatherName) {
                        filledFields.nominee += 1
                        filledFields.total += 1
                    }
                    if (nominee.gender) {
                        filledFields.nominee += 1
                        filledFields.total += 1
                    }
                    if (nominee.pan) {
                        filledFields.nominee += 1
                        filledFields.total += 1
                    }

                    // Guardian fields if nominee is minor
                    if (nominee.isMinor) {
                        const guardianFields = 13 // name (first/last), relationship, address, mobile, email, dob
                        totalFields.nominee += guardianFields
                        totalFields.total += guardianFields
                        if (nominee.guardian) { // Check if guardian object exists
                            if (nominee.guardian.name) {
                                filledFields.nominee += 1
                                filledFields.total += 1
                            }
                            if (nominee.guardian.relationWithMinorNominee) {
                                filledFields.nominee += 1
                                filledFields.total += 1
                            }
                            if (nominee.guardian.address) {
                                filledFields.nominee += 1
                                filledFields.total += 1
                            }
                            if (nominee.guardian.mobile) {
                                filledFields.nominee += 1
                                filledFields.total += 1
                            }
                            if (nominee.guardian.email) {
                                filledFields.nominee += 1
                                filledFields.total += 1
                            }
                            if (nominee.guardian.dob) {
                                filledFields.nominee += 1
                                filledFields.total += 1
                            }
                            if (nominee.guardian.countryCode) {
                                filledFields.nominee += 1
                                filledFields.total += 1
                            }
                            if (nominee.guardian.stateCode) {
                                filledFields.nominee += 1
                                filledFields.total += 1
                            }
                            if (nominee.guardian.pinCode) {
                                filledFields.nominee += 1
                                filledFields.total += 1
                            }
                            if (nominee.guardian.fatherName) {
                                filledFields.nominee += 1
                                filledFields.total += 1
                            }
                            if (nominee.guardian.gender) {
                                filledFields.nominee += 1
                                filledFields.total += 1
                            }
                            if (nominee.guardian.pan) {
                                filledFields.nominee += 1
                                filledFields.total += 1
                            }
                            if (nominee.guardian.aadhar) {
                                filledFields.nominee += 1
                                filledFields.total += 1
                            }
                        }
                    }
                })
            }
        }

        // POA section
        totalFields.poa += 1 // wishToNominate
        totalFields.total += 1
        if (formValues.wishToPOA) filledFields.poa += 1
        if (formValues.wishToPOA) filledFields.total += 1

        if (formValues.wishToPOA === "yes") {
            if (formValues.poas.length > 0) {
                formValues.poas.forEach((poa) => {

                    const poaFields = 4 // poaId, poaSetupDate, poaFromDate, poaPurposeCode, poaRemark
                    totalFields.poa += poaFields
                    totalFields.total += poaFields
                    if (poa.poaId) {
                        filledFields.poa += 1
                        filledFields.total += 1
                    }
                    if (poa.poaSetupDate) {
                        filledFields.poa += 1
                        filledFields.total += 1
                    }
                    if (poa.poaFromDate) {
                        filledFields.poa += 1
                        filledFields.total += 1
                    }
                    if (poa.poaPurposeCode) {
                        filledFields.poa += 1
                        filledFields.total += 1
                    }
                })
            }
        }


        // Holders section
        // Assume first holder is already completed from previous step (PersonalDetails)
        const firstHolderFieldsCount = 7; // title,name,pan,email,mobile,dob
        totalFields.holders += firstHolderFieldsCount;
        filledFields.holders += firstHolderFieldsCount; // Assume all fields for the first holder are filled
        totalFields.total += firstHolderFieldsCount;
        filledFields.total += firstHolderFieldsCount;

        // ====================================================================
        // IMPORTANT: Access nested holder fields
        // ====================================================================
        if (formValues.addSecondHolder) {
            const secondHolderFields = 7; // title,name,pan,email,mobile,dob
            totalFields.holders += secondHolderFields;
            totalFields.total += secondHolderFields;
            // Check fields within formValues.holders.secondHolder
            if (formValues.holders?.secondHolder?.name) { filledFields.holders += 1; filledFields.total += 1; }
            if (formValues.holders?.secondHolder?.pan) { filledFields.holders += 1; filledFields.total += 1; }
            if (formValues.holders?.secondHolder?.email) { filledFields.holders += 1; filledFields.total += 1; }
            if (formValues.holders?.secondHolder?.mobile) { filledFields.holders += 1; filledFields.total += 1; }
            if (formValues.holders?.secondHolder?.dob) { filledFields.holders += 1; filledFields.total += 1; }
            // if (formValues.holders?.secondHolder?.fatherName) { filledFields.holders += 1; filledFields.total += 1; }
            if (formValues.holders?.secondHolder?.aadhar) { filledFields.holders += 1; filledFields.total += 1; }
            if (formValues.holders?.secondHolder?.gender) { filledFields.holders += 1; filledFields.total += 1; }
            // if (formValues.holders?.secondHolder?.nationality) { filledFields.holders += 1; filledFields.total += 1; }
        }
        if (formValues.addThirdHolder) {
            const thirdHolderFields = 7; // title,name,pan,email,mobile,dob
            totalFields.holders += thirdHolderFields;
            totalFields.total += thirdHolderFields;
            // Check fields within formValues.holders.thirdHolder
            if (formValues.holders?.thirdHolder?.name) { filledFields.holders += 1; filledFields.total += 1; }
            if (formValues.holders?.thirdHolder?.pan) { filledFields.holders += 1; filledFields.total += 1; }
            if (formValues.holders?.thirdHolder?.email) { filledFields.holders += 1; filledFields.total += 1; }
            if (formValues.holders?.thirdHolder?.mobile) { filledFields.holders += 1; filledFields.total += 1; }
            if (formValues.holders?.thirdHolder?.dob) { filledFields.holders += 1; filledFields.total += 1; }
            // if (formValues.holders?.thirdHolder?.fatherName) { filledFields.holders += 1; filledFields.total += 1; }
            if (formValues.holders?.thirdHolder?.aadhar) { filledFields.holders += 1; filledFields.total += 1; }
            if (formValues.holders?.thirdHolder?.gender) { filledFields.holders += 1; filledFields.total += 1; }
            // if (formValues.holders?.thirdHolder?.nationality) { filledFields.holders += 1; filledFields.total += 1; }
        }

        // Calculate percentages
        const progress = {
            nominee: totalFields.nominee > 0 ? Math.round((filledFields.nominee / totalFields.nominee) * 100) : 0,
            poa: totalFields.poa > 0 ? Math.round((filledFields.poa / totalFields.poa) * 100) : 0,
            holders: totalFields.holders > 0 ? Math.round((filledFields.holders / totalFields.holders) * 100) : 0,
            total: totalFields.total > 0 ? Math.round((filledFields.total / totalFields.total) * 100) : 0,
        };
        return progress
    }, [form])

    // Calculate remaining share whenever nominees change
    useEffect(() => {
        if (nominees && nominees.length > 0) {
            const totalShare = nominees.reduce((sum, nominee) => sum + (nominee.percentageShares || 0), 0)
            setShareRemaining(Math.max(0, 100 - totalShare))
        } else {
            setShareRemaining(100)
        }
    }, [nominees])

    // Update form progress whenever form values change
    useEffect(() => {
        if (formInitialized) {
            const subscription = form.watch(() => {
                const progress = calculateFormProgress()
                setFormProgress(progress)
            })
            return () => subscription.unsubscribe()
        }
    }, [calculateFormProgress, form, formInitialized])

    useEffect(() => {
        if (!formInitialized) {
            setTimeout(() => {
                fetchDetails();
            }, 1000)
        }
        setFormInitialized(true);
    }, [fetchDetails, formInitialized]);

    useEffect(() => {
        // If wishToNominate changes to "no", clear all nominees
        if (wishToNominate === "no" && nominees.length > 0) {
            form.setValue("nominees", [])
        }

        if (wishToPOA === "no" && poas.length > 0) {
            form.setValue("poas", [])
        }
    }, [wishToNominate, form, nominees, wishToPOA, poas.length])

    // useEffect for handling 2nd and 3rd holder fields valdiation
    useEffect(() => {
        if (!addSecondHolder) {
            // Clear second holder
            form.setValue("holders.secondHolder", undefined)

            // Uncheck and clear third holder
            form.setValue("addThirdHolder", false)
            form.setValue("holders.thirdHolder", undefined)
        }
    }, [addSecondHolder, form])

    useEffect(() => {
        if (!addThirdHolder) {
            form.setValue("holders.thirdHolder", undefined)
        }
    }, [addThirdHolder, form])

    // Handle section navigation
    const navigateToSection = (sectionId: string) => {
        setActiveSection(sectionId)

        // Scroll to section with proper offset
        const element = document.getElementById(sectionId)
        if (element) {
            const headerHeight = headerRef.current?.offsetHeight || 120 // Default to 120px if ref not available
            const y = element.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20 // Extra 20px padding
            window.scrollTo({ top: y, behavior: "smooth" })
        }
    }

    const toggleNomineeExpansion = (index: number) => {
        setExpandedNominees((prev) => ({
            ...prev,
            [index]: !prev[index],
        }))
    }

    // Handle adding a new nominee
    const handleAddNominee = () => {
        if (wishToNominate !== "yes") {
            toast({
                title: "Cannot add nominee",
                description: "Please select 'Yes' for 'Do you wish to nominate?' first.",
                variant: "destructive",
            })
            return
        }

        if (nomineeFields.length < 3) {
            const newIndex = nomineeFields.length
            const totalNominees = nomineeFields.length + 1

            const newPercentage = Math.floor(shareRemaining / (nomineeFields.length + 1))

            // Add the new nominee first
            appendNominee({
                name: "",
                isdCode: "91",
                relationWithBo: "Spouse",
                address: "",
                mobile: "",
                email: "",
                dob: undefined as unknown as Date,
                proofType: "pan",
                proofNumber: "",
                percentageShares: newPercentage, // Will be set below
                isMinor: false,
                guardian: undefined,
                pan: "",
                countryCode: "",
                stateCode: "",
                pinCode: "",
                fatherName: "",
                gender: "Other",
            })

            // Update nominee proof previews array
            setNomineeProofPreviews([...nomineeProofPreviews, null])

            // Redistribute all shares equally after adding
            setTimeout(() => {
                const baseShare = Math.floor(100 / totalNominees)
                const remainder = 100 % totalNominees

                for (let i = 0; i < totalNominees; i++) {
                    const shareForThisNominee = baseShare + (i < remainder ? 1 : 0)
                    form.setValue(`nominees.${i}.percentageShares`, shareForThisNominee)
                }
            }, 100)

            // Scroll to the new nominee after a short delay
            setTimeout(() => {
                const element = document.getElementById(`nominee-${newIndex}`)
                if (element) {
                    const headerHeight = headerRef.current?.offsetHeight || 120
                    const y = element.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20
                    window.scrollTo({ top: y, behavior: "smooth" })
                }
            }, 200)

            // Auto-expand the new nominee
            setExpandedNominees((prev) => ({
                ...prev,
                [nomineeFields.length]: true,
            }))
        } else {
            toast({
                title: "Maximum nominees reached",
                description: "You can add a maximum of 3 nominees.",
                variant: "destructive",
            })
        }
    }

    const transformNomineeData = (nominees: any[], dematId: string, boId: string) => {
        // Calculate the smart minor indicator for all nominees
        const minorIndicators = calculateMinorIndicators(nominees);
        const client_id = sessionStorage.getItem("client_id") || "";

        console.log(boId);

        return {
            data: nominees.map((nominee, index) => {
                console.log(1, nominee);
                return {
                    nomName: nominee.name,
                    nomAddress: nominee.address || "",
                    nomCountryCode: nominee.countryCode || "",
                    nomPinCode: nominee.pinCode || "",
                    nomStateCode: nominee.stateCode || "",
                    nomMobile: nominee.mobile || "",
                    nomEmail: nominee.email || "",
                    nomDOB: format(nominee.dob, "yyyy-MM-dd"),
                    nomProofType: nominee.proofType,
                    nomProofNo: nominee.proofNumber,
                    isdCodeForMobileNo: nominee.isdCode,
                    nomFatherHusbandName: nominee.fatherName || "",
                    nomSexCode: nominee.gender,
                    nomPAN: nominee.pan || "",
                    nomPANFlag: "PANVLD",
                    nomAadhar: "",
                    nomAadharFlag: "",
                    isMinor: nominee.isMinor ? "YES" : "NO",
                    nomNoNominationFlag: "YES",
                    nomRelationship: nominee.relationWithBo,
                    nomPercentage: nominee.percentageShares.toString(),
                    nomFlagSharePercEquality: "YES",
                    nomResidualSecuritiesFlag: index === 0 ? "YES" : "NO",
                    nomSerialNo: (index + 1).toString(),

                    // Use the smart minor indicator for all nominees
                    // nomMinorIndicator: minorIndicators[index],
                    nomMinorIndicator: nominee.isMinor ? "YES" : "NO",

                    // Guardian details (if minor)
                    guardName: nominee.isMinor ? nominee.guardian.name : "",
                    guardAddress: nominee.isMinor && nominee.guardian ? nominee.guardian.address || "" : "",
                    guardCountryCode: nominee.isMinor ? nominee.guardian.countryCode : "",
                    guardPinCode: nominee.isMinor ? nominee.guardian.pinCode : "",
                    guardStateCode: nominee.isMinor ? nominee.guardian.stateCode : "",
                    guardMobile: nominee.isMinor ? nominee.guardian.mobile : "",
                    guardEmail: nominee.isMinor ? nominee.guardian.email : "",
                    guardDOB: nominee.isMinor && nominee.guardian ? format(nominee.guardian.dob, "yyyy-MM-dd") : "",
                    guardFatherHusbandName: nominee.isMinor ? nominee.guardian.fatherName : "",
                    guardSexCode: nominee.isMinor ? nominee.guardian.gender : "",
                    guardPAN: nominee.isMinor ? nominee.guardian.pan : "",
                    guardAadhar: nominee.isMinor ? nominee.guardian.aadhar : "",
                    guardRelationship:
                        nominee.isMinor && nominee.guardian ? nominee.guardian.relationWithMinorNominee : "",
                    guardResidualSecuritiesFlag: "YES",
                    guardAadharFlag: "",
                    guardPANFlag: "",
                    clientId: client_id,
                    dematId: dematId.toString(),
                    boId: boId || ""
                }
            }),
        }
    }

    const formatOccupationType = (type: string) => {
        switch (type) {
            case "Government":
                return "Government Services";
            case "PrivateSector":
                return "Private Sector";
            case "PublicSector":
                return "Public Sector";
            case "BusinessOwner":
                return "Business";
            case "SelfEmployed":
            case "Other":
                return "Others";
            default:
                return type;
        }
    };

    function buildHolderPayload(holder: any, dematId: string, index: number, boId: string) {
        console.log(holder);
        const occType = formatOccupationType(holder.occupationType);
        const client_id = sessionStorage.getItem("client_id") || "";

        return {
            dematId: dematId.toString(),
            clientId: client_id,
            holdBoName: `${holder.firstName ?? holder.name ?? ""} ${holder.middleName || ""} ${holder.lastName || ""}`.trim(),
            holdBeneficiaryShortName: "",
            holdFatherHusbandName: holder.fatherHusbandName ?? holder.fatherName ?? "",
            holdDateOfBirth: holder.dob ? format(holder.dob, "yyyy-MM-dd") : "",
            holdSexCode: holder.gender ? holder.gender.toUpperCase() : "",
            holdPan: holder.pan || "",
            holdPanVerifyFlag: "PANVLD",
            holdAadhaar: holder.aadhar || "",
            holdAadhaarVerifyFlag: "",
            holdReasonForNonUpdationOfAadhaar: "",
            holdIsdCodeForMobileNo: holder.isdCode || "",
            holdMobileNo: holder.mobile || "",
            holdFamilyFlagForMobileNumber: "",
            holdIsdCodeForSecondaryMobileNo: "",
            holdPhoneNo: "",
            holdEmailId: holder.email || "",
            holdFamilyFlagForEmailId: "",
            holdAlternateEmailId: "",
            holdAnnualIncome: holder.annualIncome || "",
            holdCorrAddr: holder.correspondenceAddressLine1 || "",
            holdCorrCountryCode: holder.correspondenceCountry || "",
            holdCorrPinCode: holder.correspondencePincode || "",
            holdCorrStateCode: holder.correspondenceState || "",
            holdNationalityCode: holder.nationality || "",
            holdPermAddr: holder.permanentAddressLine1 || "",
            holdPermAddrCountryCode: holder.permanentCountry || "",
            holdPermAddrPinCode: holder.permanentPincode || "",
            holdPermAddrStateCode: holder.permanentState || "",
            holdOccupation: occType || "",
            holdSerialNo: index.toString(),
            boId: boId || ""
        };
    }

    const calculateMinorIndicators = (nominees: { isMinor: boolean }[]) => {
        const indicators = new Array(nominees.length).fill("");

        // Get minor positions (1-based)
        const minorPositions = nominees
            .map((n, i) => (n.isMinor ? i + 1 : null))
            .filter((v) => v !== null) as number[];

        const minorCount = minorPositions.length;

        // Handle single minor nominee
        if (minorCount === 1) {
            const minorIndex = minorPositions[0] - 1; // convert to 0-based
            indicators[minorIndex] =
                minorPositions[0] === 1
                    ? "FNM"
                    : minorPositions[0] === 2
                        ? "SNM"
                        : "TNM";
            return indicators;
        }

        // Handle two minors
        if (minorCount === 2) {
            const set = new Set(minorPositions);
            let groupIndicator = "";

            if (set.has(1) && set.has(2)) groupIndicator = "FSM";
            else if (set.has(1) && set.has(3)) groupIndicator = "FTM";
            else if (set.has(2) && set.has(3)) groupIndicator = "STM";

            minorPositions.forEach((pos) => {
                indicators[pos - 1] = groupIndicator;
            });
            return indicators;
        }

        // All minors
        if (minorCount === nominees.length && nominees.length > 1) {
            minorPositions.forEach((pos) => {
                indicators[pos - 1] = "ANM";
            });
            return indicators;
        }

        // No minors or unrecognized
        return indicators;
    };

    async function onSubmit(data: NomineePoaFormValues) {
        // handleStepCompletion("nominee-poa", data)

        const dematId = sessionStorage.getItem("dematId")
        const rawBoId = sessionStorage.getItem("boId");
        const boId = !rawBoId || rawBoId === "null" ? "" : rawBoId;

        console.log(boId);

        if (!dematId) {
            console.error("Demat ID not found in session storage")
            setErrorMessage("Demat ID is required to submit the form.")
            return
        }

        setIsSubmitting(true)
        setErrorMessage(null)
        setSuccessMessage(null)

        try {
            const nomineePromise = data.nominees.length > 0
                ? addNomineeDetailsKYC(transformNomineeData(data.nominees, dematId, boId))
                : Promise.resolve({ data: [] });

            const poaPromise = addPOADetailsKYC({
                data: (Array.isArray(data.poas?.[0]?.poaGpaBpaFlag) ? data.poas[0].poaGpaBpaFlag : []).map((flag) => ({
                    poaOrDdpiId: data.poas?.[0]?.poaId,
                    poaCreationDate: data.poas?.[0]?.poaSetupDate ? format(data.poas[0].poaSetupDate, "yyyy-MM-dd") : "",
                    poaToOperateAcc: "YES",
                    poaEffectiveFromDate: data.poas?.[0]?.poaFromDate ? format(data.poas[0].poaFromDate, "yyyy-MM-dd") : "",
                    poaEffectiveToDate: data.poas?.[0]?.poaToDate ? format(data.poas[0].poaToDate, "yyyy-MM-dd") : "",
                    poaLinkPurposeCode: data.poas?.[0]?.poaPurposeCode,
                    poaNatureType: flag,
                    dematId: dematId.toString(),
                    boId: boId || ""
                })),
            });

            const holderPromise = addHolderDetailsKYC({
                data: [
                    buildHolderPayload(data?.holders?.firstHolder, dematId, 1, boId),
                    ...(data?.addSecondHolder && data?.holders?.secondHolder
                        ? [buildHolderPayload(data.holders.secondHolder, dematId, 2, boId)]
                        : []),
                    ...(data?.addThirdHolder && data?.holders?.thirdHolder
                        ? [buildHolderPayload(data.holders.thirdHolder, dematId, 3, boId)]
                        : []),
                ]
            });

            // 🔁 Run all 3 in parallel
            const [nomineeRes, poaRes, holderRes] = await Promise.all([nomineePromise, poaPromise, holderPromise]);

            // ✅ Check both tokenValidity responses before proceeding
            if (
                !checkTokenValidity(nomineeRes?.data?.tokenValidity) ||
                !checkTokenValidity(poaRes?.data?.tokenValidity) ||
                !checkTokenValidity(holderRes?.data?.tokenValidity)
            ) {
                return; // Early exit if any token is invalid (dialog + redirect handled)
            }

            // ✅ Validate all response objects inside each response
            const isMatchingSuccessArray = (responseArr: any[], expectedLength: number) => {
                return (
                    Array.isArray(responseArr) &&
                    responseArr.length === expectedLength &&
                    responseArr.every((item) => item?.status === true)
                );
            };
            const nomineeCount = data.nominees.length;
            const poaCount = Array.isArray(data.poas?.[0]?.poaGpaBpaFlag) ? data.poas[0].poaGpaBpaFlag.length : 0;

            let holderCount = 1; // always first holder
            if (data.addSecondHolder && data.holders?.secondHolder) holderCount++;
            if (data.addThirdHolder && data.holders?.thirdHolder) holderCount++;

            const nomineeData = nomineeRes?.data?.data || [];
            const poaData = poaRes?.data?.data || [];
            const holderData = holderRes?.data?.data || [];

            const isNomineeSuccess = isMatchingSuccessArray(nomineeData, nomineeCount);
            const isPoaSuccess = isMatchingSuccessArray(poaData, poaCount);
            const isHolderSuccess = isMatchingSuccessArray(holderData, holderCount);
            holderRes.data.data.every((res: any) => res?.status === true);

            if (!isNomineeSuccess || !isPoaSuccess || !isHolderSuccess) {
                setErrorMessage("Some sections failed to save. Please try again.");
                toast({
                    title: "Error",
                    description: "Some sections failed to save. Please try again.",
                    variant: "destructive",
                });
                console.error("❌ Failed responses:", { nomineeRes, poaRes, holderRes });
                return;
            }

            // ✅ Save and proceed
            handleStepCompletion("nominee-poa", data)

        } catch (error) {
            console.error("Error submitting nominee-poa form:", error);
            setErrorMessage("There was an error saving your information. Please try again.");
        } finally {
            setIsSubmitting(false);
        }

    }

    useEffect(() => {
        if (formInitialized) {
            const progress = calculateFormProgress()
            setFormProgress(progress)
        }
    }, [formInitialized, calculateFormProgress, nominees.length, nominees])

    // Handle nominee removal and share redistribution
    useEffect(() => {
        if (nominees && nominees.length > 0) {
            const totalShare = nominees.reduce((sum, nominee) => sum + (nominee.percentageShares || 0), 0)

            // Always ensure shares total exactly 100%
            if (totalShare !== 100) {
                // Redistribute shares equally among all nominees
                const baseShare = Math.floor(100 / nominees.length)
                const remainder = 100 % nominees.length

                nominees.forEach((_, index) => {
                    const newShare = baseShare + (index < remainder ? 1 : 0)
                    form.setValue(`nominees.${index}.percentageShares`, newShare)
                })
            }
        }
    }, [nominees.length, form, nominees]) // Only watch for changes in nominee count

    // Separate effect to update remaining share display
    useEffect(() => {
        if (nominees && nominees.length > 0) {
            const totalShare = nominees.reduce((sum, nominee) => sum + (nominee.percentageShares || 0), 0)
            setShareRemaining(Math.max(0, 100 - totalShare))
        } else {
            setShareRemaining(100)
        }
    }, [nominees])

    useEffect(() => {
        if (wishToPOA === "yes" && poaFields.length === 0) {
            appendPOA({
                poaId: "2205810000000202",
                poaSetupDate: new Date(),
                poaFromDate: new Date(),
                poaToDate: undefined,
                poaPurposeCode: "First Holder",
                poaRemarks: "for_payin",
                poaGpaBpaFlag: [],
            });
        }

        // Optional: Clear if toggled off
        if (wishToPOA === "no" && poaFields.length > 0) {
            removePOA(); // custom function to remove all
        }
    }, [appendPOA, poaFields.length, removePOA, wishToPOA]);

    const flattenErrors = useCallback((
        errorObj: any,
        parentPath: (string | number)[] = []
    ): { path: string; message: string }[] => {
        if (!errorObj) return [];

        // Handle a field-level error
        if (errorObj.message && typeof errorObj.message === "string") {
            const fullPath = parentPath.join(".");

            // 🛑 Skip `.root` placeholder messages (from union)
            if (parentPath[parentPath.length - 1] === "root") {
                return [];
            }

            return [
                {
                    path: fullPath,
                    message: errorObj.message === "Required" ? "This field is required." : errorObj.message,
                },
            ];
        }

        // Traverse arrays
        if (Array.isArray(errorObj)) {
            return errorObj.flatMap((item, index) =>
                flattenErrors(item, [...parentPath, index])
            );
        }

        // Traverse nested objects
        if (typeof errorObj === "object") {
            return Object.entries(errorObj).flatMap(([key, val]) =>
                flattenErrors(val, [...parentPath, key])
            );
        }

        return [];
    }, [])

    const watchedValues = useWatch({ control: form.control });

    useEffect(() => {
        if (!hasSubmitted) return;

        const timeout = setTimeout(async () => {
            await form.trigger();

            setTimeout(() => {
                const freshErrors = flattenErrors(form.formState.errors);
                console.log(freshErrors);
                setErrors(freshErrors);
            }, 10);
        }, 300);

        return () => clearTimeout(timeout);
    }, [watchedValues, hasSubmitted, form, flattenErrors, setErrors]);

    return (
        <div className="space-y-6 p-0">
            {/* Header with Progress Bar */}
            <div
                ref={headerRef}
                className="sticky top-0 z-10 border-b pb-4 pt-4 px-2 shadow-lg backdrop-blur-md bg-white/30 rounded-xl"
            >
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-lg font-bold text-gray-800">Nominee & Power of Attorney</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Completion:</span>
                            <span className="text-sm font-bold text-blue-600">{formProgress.total}%</span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                        <Progress value={formProgress.total} className="h-2" />
                    </div>

                    {/* Section Navigation */}
                    <div className="mt-3 justify-center grid grid-cols-3 gap-2 text-xs">
                        {formSections.map((section) => (
                            <div
                                key={section.id}
                                className={`flex flex-col gap-2 justify-center items-center sm:flex-row mx-auto cursor-pointer ${activeSection === section.id ? "text-blue-600" : "text-gray-500"
                                    }`}
                                onClick={() => navigateToSection(section.id)}
                            >
                                <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${formProgress[section.id] === 100
                                        ? "bg-green-100 text-green-600"
                                        : activeSection === section.id
                                            ? "bg-blue-100 text-blue-600"
                                            : "bg-gray-100 text-gray-500"
                                        }`}
                                >
                                    {formProgress[section.id] === 100 ? <Check className="w-4 h-4" /> : section.icon}
                                </div>
                                <span className="text-center text-xs">
                                    {section.title} ({formProgress[section.id]}%)
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-0 m-0">

                {/* 1. Show loader if loading */}
                {isLoadingData ? (
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
                                    We’re fetching your details. Please hold on a moment.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    // 2. Only show form and progress if not in above states
                    <>
                        {/* Status Messages */}
                        {errorMessage && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{errorMessage}</AlertDescription>
                            </Alert>
                        )}

                        {successMessage && (
                            <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
                                <Check className="h-4 w-4 text-green-500" />
                                <AlertTitle>Success</AlertTitle>
                                <AlertDescription>{successMessage}</AlertDescription>
                            </Alert>
                        )}

                        {/* {!isLoadingData && ( */}
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)}>

                                {/* HOLDERS SECTION */}
                                <div id="holders" className="scroll-mt-32">
                                    <div className="border-gray-200 rounded-lg overflow-hidden shadow-lg border-0 bg-white/80 backdrop-blur">
                                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
                                            <h3 className="text-blue-800 flex items-center text-lg font-medium">
                                                <User className="mr-2 h-5 w-5" />
                                                Holder Information
                                            </h3>
                                        </div>
                                        <div className="p-6 space-y-6 bg-white">

                                            {/* First Holder (Current User) */}
                                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="font-semibold text-green-800 flex items-center">
                                                        <Check className="h-4 w-4 mr-2" />
                                                        Primary Holder (You)
                                                    </h3>
                                                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                        Active
                                                    </Badge>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-600">Name:</span>
                                                        <p className="font-medium">ANISH DIPAK TELI</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">PAN:</span>
                                                        <p className="font-medium">ABCDE1234F</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Email:</span>
                                                        <p className="font-medium">anish@example.com</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <Separator className="my-4" />

                                            {/* Second Holder (Optional) */}
                                            <FormField
                                                control={form.control}
                                                name="addSecondHolder"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-lg bg-gray-50">
                                                        <FormControl>
                                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                        </FormControl>
                                                        <div className="space-y-1 leading-none">
                                                            <FormLabel className="font-medium">Add Second Holder</FormLabel>
                                                            <FormDescription>Add a joint holder to this account (optional)</FormDescription>
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />

                                            {addSecondHolder && (
                                                <div className="space-y-4 p-4 border rounded-md border-blue-200 bg-blue-50/50">
                                                    <h3 className="text-lg text-blue-800 font-medium ">Second Holder Details</h3>
                                                    <Separator className="my-4" />

                                                    <div className="grid gap-4 sm:grid-cols-2">
                                                        <FormField
                                                            control={form.control}
                                                            name="holders.secondHolder.name"
                                                            render={({ field }) => (
                                                                <FormItem ref={registerFieldRef("holders.secondHolder.name")}>
                                                                    <FormLabel>Full Name <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                    <FormControl>
                                                                        <Input placeholder="Full name as per documents" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name="holders.secondHolder.fatherName"
                                                            render={({ field }) => (
                                                                <FormItem ref={registerFieldRef("holders.secondHolder.fatherName")}>
                                                                    <FormLabel>Father's/ Husband's Name </FormLabel>
                                                                    <FormControl>
                                                                        <Input placeholder="Full name as per documents" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name="holders.secondHolder.aadhar"
                                                            render={({ field }) => {
                                                                const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                                                                    let value = e.target.value.replace(/\D/g, "") // Remove non-digits
                                                                    if (value.length > 12) value = value.slice(0, 12) // Limit to 12 digits

                                                                    field.onChange(value)
                                                                }

                                                                const maskedValue =
                                                                    field.value && field.value.length === 12
                                                                        ? "********" + field.value.slice(-4)
                                                                        : field.value

                                                                return (
                                                                    <FormItem ref={registerFieldRef("holders.secondHolder.aadhar")}>
                                                                        <FormLabel>Aadhar Number <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                        <FormControl>
                                                                            <Input
                                                                                placeholder="Aadhar Number"
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
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )
                                                            }}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name="holders.secondHolder.pan"
                                                            render={({ field }) => (
                                                                <FormItem ref={registerFieldRef("holders.secondHolder.pan")}>
                                                                    <FormLabel>PAN Number <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder="e.g., ABCDE1234F"
                                                                            {...field}
                                                                            value={field.value ?? ""}
                                                                            onChange={(e) => {
                                                                                const value = e.target.value.toUpperCase()
                                                                                field.onChange(value)
                                                                            }}
                                                                            className="uppercase"
                                                                        />
                                                                    </FormControl>
                                                                    <FormDescription className="text-xs">PAN should be in format ABCDE1234F</FormDescription>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="grid gap-4 sm:grid-cols-3">
                                                        <FormField
                                                            control={form.control}
                                                            name="holders.secondHolder.gender"
                                                            render={({ field }) => (
                                                                <FormItem ref={registerFieldRef("holders.secondHolder.gender")}>
                                                                    <FormLabel>Gender <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                    <FormControl>
                                                                        <select
                                                                            {...field}
                                                                            className="w-full border border-input rounded-md h-10 px-3"
                                                                        >
                                                                            <option value="">Select Gender</option>
                                                                            <option value="Male">Male</option>
                                                                            <option value="Fmale">Female</option>
                                                                            <option value="Other">Other</option>
                                                                        </select>
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <DatePickerField
                                                            ref={registerFieldRef("holders.secondHolder.dob")}
                                                            control={form.control}
                                                            name={`holders.secondHolder.dob`}
                                                            label={
                                                                <>
                                                                    Date of Birth <span className="text-red-500 font-bold text-lg">*</span>
                                                                </>
                                                            }
                                                            placeholder="Select holders Date of Birth"
                                                            endYear={new Date().getFullYear()}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name="holders.secondHolder.nationality"
                                                            render={({ field }) => (
                                                                <FormItem className="space-y-3">
                                                                    <FormLabel>Nationality </FormLabel>
                                                                    <SearchableSelect
                                                                        field={{
                                                                            ...field,
                                                                            value: field.value ?? "",
                                                                        }}
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
                                                            name="holders.secondHolder.email"
                                                            render={({ field }) => (
                                                                <FormItem ref={registerFieldRef("holders.secondHolder.email")}>
                                                                    <FormLabel>Email <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                    <FormControl>
                                                                        <Input placeholder="Email address" type="email" {...field} value={field.value ?? ""} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <FormField
                                                            control={form.control}
                                                            name="holders.secondHolder.mobile"
                                                            render={({ field }) => (
                                                                <FormItem ref={registerFieldRef("holders.secondHolder.mobile")}>
                                                                    <FormLabel>Mobile Number <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                    <FormControl>
                                                                        <div className="flex">
                                                                            <div className="flex items-center">
                                                                                <FormField
                                                                                    control={form.control}
                                                                                    name="holders.secondHolder.isdCode"
                                                                                    render={({ field }) => (
                                                                                        <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                                                                                            <FormControl>
                                                                                                <SelectTrigger className="w-[80px] rounded-r-none">
                                                                                                    <SelectValue placeholder="ISD" />
                                                                                                </SelectTrigger>
                                                                                            </FormControl>
                                                                                            <SelectContent>
                                                                                                <SelectItem value="91">+91</SelectItem>
                                                                                                <SelectItem value="1">+1</SelectItem>
                                                                                                <SelectItem value="44">+44</SelectItem>
                                                                                                <SelectItem value="61">+61</SelectItem>
                                                                                                <SelectItem value="65">+65</SelectItem>
                                                                                            </SelectContent>
                                                                                        </Select>
                                                                                    )}
                                                                                />
                                                                            </div>
                                                                            <Input
                                                                                placeholder="10-digit mobile number"
                                                                                {...field}
                                                                                value={field.value ?? ""}
                                                                                maxLength={10}
                                                                                className="rounded-l-none"
                                                                                onChange={(e) => {
                                                                                    const value = e.target.value.replace(/\D/g, "").slice(0, 10)
                                                                                    field.onChange(value)
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <Separator className="my-4" />

                                            {/* Third Holder (Optional) */}
                                            <FormField
                                                control={form.control}
                                                name="addThirdHolder"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-lg bg-gray-50">
                                                        <FormControl>
                                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={!addSecondHolder} />
                                                        </FormControl>
                                                        <div className="space-y-1 leading-none">
                                                            <FormLabel className={cn("font-medium", !addSecondHolder && "text-gray-400")}>
                                                                Add Third Holder
                                                            </FormLabel>
                                                            <FormDescription className={!addSecondHolder ? "text-gray-400" : ""}>
                                                                {!addSecondHolder
                                                                    ? "Add second holder first to enable this option"
                                                                    : "Add a third holder to this account (optional)"}
                                                            </FormDescription>
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />

                                            {addSecondHolder && addThirdHolder && (
                                                <div className="space-y-4 p-4 border rounded-md border-blue-200 bg-blue-50/50">
                                                    <h3 className="text-lg text-blue-800 font-medium ">Third Holder Details</h3>
                                                    <Separator className="my-4" />

                                                    <div className="grid gap-4 sm:grid-cols-2">
                                                        <FormField
                                                            control={form.control}
                                                            name="holders.thirdHolder.name"
                                                            render={({ field }) => (
                                                                <FormItem ref={registerFieldRef("holders.thirdHolder.name")}>
                                                                    <FormLabel>Full Name <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                    <FormControl>
                                                                        <Input placeholder="Full name as per documents" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name="holders.thirdHolder.fatherName"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Father's/ Husband's Name</FormLabel>
                                                                    <FormControl>
                                                                        <Input placeholder="Full name as per documents" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name="holders.thirdHolder.aadhar"
                                                            render={({ field }) => {
                                                                const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                                                                    let value = e.target.value.replace(/\D/g, "") // Remove non-digits
                                                                    if (value.length > 12) value = value.slice(0, 12) // Limit to 12 digits

                                                                    field.onChange(value)
                                                                }

                                                                const maskedValue =
                                                                    field.value && field.value.length === 12
                                                                        ? "********" + field.value.slice(-4)
                                                                        : field.value

                                                                return (
                                                                    <FormItem ref={registerFieldRef("holders.thirdHolder.aadhar")}>
                                                                        <FormLabel>Aadhar Number <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                        <FormControl>
                                                                            <Input
                                                                                placeholder="Aadhar Number"
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
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )
                                                            }}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name="holders.thirdHolder.pan"
                                                            render={({ field }) => (
                                                                <FormItem ref={registerFieldRef("holders.thirdHolder.pan")}>
                                                                    <FormLabel>PAN Number <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder="e.g., ABCDE1234F"
                                                                            {...field}
                                                                            value={field.value ?? ""}
                                                                            onChange={(e) => {
                                                                                const value = e.target.value.toUpperCase()
                                                                                field.onChange(value)
                                                                            }}
                                                                            className="uppercase"
                                                                        />
                                                                    </FormControl>
                                                                    <FormDescription className="text-xs">PAN should be in format ABCDE1234F</FormDescription>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="grid gap-4 sm:grid-cols-3">
                                                        <FormField
                                                            control={form.control}
                                                            name="holders.thirdHolder.gender"
                                                            render={({ field }) => (
                                                                <FormItem ref={registerFieldRef("holders.thirdHolder.gender")}>
                                                                    <FormLabel>Gender <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                    <FormControl>
                                                                        <select
                                                                            {...field}
                                                                            className="w-full border border-input rounded-md h-10 px-3"
                                                                        >
                                                                            <option value="">Select Gender</option>
                                                                            <option value="Male">Male</option>
                                                                            <option value="Fmale">Female</option>
                                                                            <option value="Other">Other</option>
                                                                        </select>
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <DatePickerField
                                                            ref={registerFieldRef("holders.thirdHolder.dob")}
                                                            control={form.control}
                                                            name={`holders.thirdHolder.dob`}
                                                            label={
                                                                <>
                                                                    Date of Birth <span className="text-red-500 font-bold text-lg">*</span>
                                                                </>
                                                            }
                                                            placeholder="Select holders Date of Birth"
                                                            endYear={new Date().getFullYear()}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name="holders.thirdHolder.nationality"
                                                            render={({ field }) => (
                                                                <FormItem className="space-y-3">
                                                                    <FormLabel>Nationality </FormLabel>
                                                                    <SearchableSelect
                                                                        field={{
                                                                            ...field,
                                                                            value: field.value ?? "",
                                                                        }}
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
                                                            name="holders.thirdHolder.email"
                                                            render={({ field }) => (
                                                                <FormItem ref={registerFieldRef("holders.thirdHolder.email")}>
                                                                    <FormLabel>Email <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                    <FormControl>
                                                                        <Input placeholder="Email address" type="email" {...field} value={field.value ?? ""} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <FormField
                                                            control={form.control}
                                                            name="holders.thirdHolder.mobile"
                                                            render={({ field }) => (
                                                                <FormItem ref={registerFieldRef("holders.thirdHolder.mobile")}>
                                                                    <FormLabel>Mobile Number <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                    <FormControl>
                                                                        <div className="flex">
                                                                            <div className="flex items-center">
                                                                                <FormField
                                                                                    control={form.control}
                                                                                    name="holders.thirdHolder.isdCode"
                                                                                    render={({ field }) => (
                                                                                        <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                                                                                            <FormControl>
                                                                                                <SelectTrigger className="w-[80px] rounded-r-none">
                                                                                                    <SelectValue placeholder="ISD" />
                                                                                                </SelectTrigger>
                                                                                            </FormControl>
                                                                                            <SelectContent>
                                                                                                <SelectItem value="91">+91</SelectItem>
                                                                                                <SelectItem value="1">+1</SelectItem>
                                                                                                <SelectItem value="44">+44</SelectItem>
                                                                                                <SelectItem value="61">+61</SelectItem>
                                                                                                <SelectItem value="65">+65</SelectItem>
                                                                                            </SelectContent>
                                                                                        </Select>
                                                                                    )}
                                                                                />
                                                                            </div>
                                                                            <Input
                                                                                placeholder="10-digit mobile number"
                                                                                {...field}
                                                                                value={field.value ?? ""}
                                                                                maxLength={10}
                                                                                className="rounded-l-none"
                                                                                onChange={(e) => {
                                                                                    const value = e.target.value.replace(/\D/g, "").slice(0, 10)
                                                                                    field.onChange(value)
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* NOMINEE SECTION */}
                                <div id="nominee" className="scroll-mt-32 mt-8">
                                    <div className="border-gray-200 rounded-lg overflow-hidden shadow-lg border-0 bg-white/80 backdrop-blur">
                                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
                                            <h3 className="text-blue-800 flex items-center text-lg font-medium">
                                                <User className="mr-2 h-5 w-5 text-blue-600" />
                                                Nominee Information
                                            </h3>
                                            <p className="text-blue-700/70 text-sm mt-1">
                                                Add up to 3 nominees who will receive your holdings in the event of your demise
                                            </p>
                                        </div>
                                        <div className="p-6 space-y-6 bg-white">
                                            <FormField
                                                control={form.control}
                                                name="wishToNominate"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-3">
                                                        <FormLabel className="text-lg font-medium">Do you wish to add nominees?</FormLabel>
                                                        <FormControl>
                                                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-6">
                                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                                    <FormControl>
                                                                        <RadioGroupItem value="yes" />
                                                                    </FormControl>
                                                                    <FormLabel className="font-normal cursor-pointer">Yes, I want to add nominees</FormLabel>
                                                                </FormItem>
                                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                                    <FormControl>
                                                                        <RadioGroupItem value="no" />
                                                                    </FormControl>
                                                                    <FormLabel className="font-normal cursor-pointer">No, skip for now</FormLabel>
                                                                </FormItem>
                                                            </RadioGroup>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {wishToNominate === "yes" ? (
                                                <div className="space-y-6">
                                                    {/* Remaining share indicator */}
                                                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-2">
                                                                <Percent className="h-5 w-5 text-amber-600" />
                                                                <span className="font-medium text-amber-800">Share Distribution</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-sm text-amber-700">Remaining: {shareRemaining}%</div>
                                                                <Badge
                                                                    variant={shareRemaining === 0 ? "default" : "destructive"}
                                                                    className={shareRemaining === 0 ? "bg-green-500" : ""}
                                                                >
                                                                    {shareRemaining === 0 ? "Complete" : "Incomplete"}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Add Nominee Button */}
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <h3 className="text-lg font-medium text-gray-800">Nominees ({nomineeFields.length}/3)</h3>
                                                            <p className="text-sm text-gray-500">Add up to 3 nominees</p>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={handleAddNominee}
                                                            disabled={nomineeFields.length >= 3}
                                                            className="flex items-center gap-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                            Add Nominee
                                                        </Button>
                                                    </div>

                                                    {nomineeFields.length === 0 && (
                                                        <div className="text-center py-10 border border-dashed rounded-md bg-gray-50 border-gray-300">
                                                            <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                                            <p className="text-gray-500 mb-2">No nominees added yet</p>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={handleAddNominee}
                                                                className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                                                            >
                                                                <Plus className="h-4 w-4 mr-1" />
                                                                Add Your First Nominee
                                                            </Button>
                                                        </div>
                                                    )}

                                                    {nomineeFields.map((field, index) => {

                                                        const nominee = nominees[index]
                                                        const isExpanded = expandedNominees[index]
                                                        const isMinor = nominee?.isMinor || false

                                                        const dob = form.watch(`nominees.${index}.dob`);
                                                        const isMinorToggle = form.watch(`nominees.${index}.isMinor`); // optional

                                                        const isMinorByAge = dob ? (() => {
                                                            const today = new Date();
                                                            let age = today.getFullYear() - dob.getFullYear();
                                                            const monthDiff = today.getMonth() - dob.getMonth();
                                                            const dayDiff = today.getDate() - dob.getDate();
                                                            if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age--;
                                                            return age < 18;
                                                        })() : false;

                                                        // Final minor flag (used for guardian logic)
                                                        const isActuallyMinor = isMinorByAge || isMinorToggle;

                                                        return (
                                                            <div
                                                                key={field.id}
                                                                className={cn("border transition-all rounded-lg p-4 mb-4", isMinor ? "border-blue-300 bg-blue-50/30" : "border-gray-200")}
                                                            >
                                                                <Collapsible open={isExpanded} onOpenChange={() => toggleNomineeExpansion(index)}>
                                                                    <CollapsibleTrigger asChild>
                                                                        <div className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-50 transition-colors">
                                                                            <div className="flex items-center space-x-3">
                                                                                <div
                                                                                    className={cn(
                                                                                        "w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold",
                                                                                        isMinor ? "bg-blue-500" : "bg-purple-500",
                                                                                    )}
                                                                                >
                                                                                    {index + 1}
                                                                                </div>
                                                                                <div>
                                                                                    <div className="text-lg font-medium">
                                                                                        {nominee?.name || `Nominee ${index + 1}`}
                                                                                        {isMinor && (
                                                                                            <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-transparent">
                                                                                                <Baby className="h-3 w-3 mr-1" />
                                                                                                Minor
                                                                                            </Badge>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="text-sm">
                                                                                        Share: {nominee?.percentageShares || 0}%
                                                                                        {nominee?.relationWithBo && ` • ${nominee.relationWithBo}`}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center space-x-2">
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation()
                                                                                        removeNominee(index)
                                                                                    }}
                                                                                    className="text-red-600 hover:text-red-800"
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </Button>
                                                                                {isExpanded ? (
                                                                                    <ChevronUp className="h-5 w-5" />
                                                                                ) : (
                                                                                    <ChevronDown className="h-5 w-5" />
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </CollapsibleTrigger>

                                                                    <CollapsibleContent>
                                                                        <div className="pt-0 space-y-6">
                                                                            <Separator className="my-4" />

                                                                            <div className="ml-6">
                                                                                <div className="grid gap-4 md:grid-cols-2">
                                                                                    <FormField
                                                                                        control={form.control}
                                                                                        name={`nominees.${index}.name`}
                                                                                        render={({ field }) => (
                                                                                            <FormItem ref={registerFieldRef(`nominees.${index}.name`)}>
                                                                                                <FormLabel>Full Name <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                                                <FormControl>
                                                                                                    <Input placeholder="Full name" {...field} />
                                                                                                </FormControl>
                                                                                                <FormMessage />
                                                                                            </FormItem>
                                                                                        )}
                                                                                    />
                                                                                    <FormField
                                                                                        control={form.control}
                                                                                        name={`nominees.${index}.fatherName`}
                                                                                        render={({ field }) => (
                                                                                            <FormItem ref={registerFieldRef(`nominees.${index}.fatherName`)}>
                                                                                                <FormLabel>Father's / Husband's Name <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                                                <FormControl>
                                                                                                    <Input placeholder="Father's / Husband's Name" {...field} />
                                                                                                </FormControl>
                                                                                                <FormMessage />
                                                                                            </FormItem>
                                                                                        )}
                                                                                    />
                                                                                </div>

                                                                                <div className="grid gap-4 md:grid-cols-3 mt-4">
                                                                                    <FormField
                                                                                        control={form.control}
                                                                                        name={`nominees.${index}.pan`}
                                                                                        render={({ field }) => (
                                                                                            <FormItem ref={registerFieldRef(`nominees.${index}.pan`)}>
                                                                                                <FormLabel>PAN Number <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                                                <FormControl>
                                                                                                    <Input placeholder="PAN Number" {...field} />
                                                                                                </FormControl>
                                                                                                <FormMessage />
                                                                                            </FormItem>
                                                                                        )}
                                                                                    />
                                                                                    <FormField
                                                                                        control={form.control}
                                                                                        name={`nominees.${index}.email`}
                                                                                        render={({ field }) => (
                                                                                            <FormItem ref={registerFieldRef(`nominees.${index}.email`)}>
                                                                                                <FormLabel>Email <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                                                <FormControl>
                                                                                                    <Input placeholder="Email" {...field} />
                                                                                                </FormControl>
                                                                                                <FormMessage />
                                                                                            </FormItem>
                                                                                        )}
                                                                                    />

                                                                                    <FormField
                                                                                        control={form.control}
                                                                                        name={`nominees.${index}.mobile`}
                                                                                        render={({ field }) => (
                                                                                            <FormItem ref={registerFieldRef(`nominees.${index}.mobile`)}>
                                                                                                <FormLabel>Mobile Number <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                                                <FormControl>
                                                                                                    <div className="flex">
                                                                                                        <div className="flex items-center">
                                                                                                            <FormField
                                                                                                                control={form.control}
                                                                                                                name={`nominees.${index}.isdCode`}
                                                                                                                render={({ field }) => (
                                                                                                                    <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                                                                                                                        <FormControl>
                                                                                                                            <SelectTrigger className="w-[80px] rounded-r-none">
                                                                                                                                <SelectValue placeholder="ISD" />
                                                                                                                            </SelectTrigger>
                                                                                                                        </FormControl>
                                                                                                                        <SelectContent>
                                                                                                                            <SelectItem value="91">+91</SelectItem>
                                                                                                                            <SelectItem value="1">+1</SelectItem>
                                                                                                                            <SelectItem value="44">+44</SelectItem>
                                                                                                                            <SelectItem value="61">+61</SelectItem>
                                                                                                                            <SelectItem value="65">+65</SelectItem>
                                                                                                                        </SelectContent>
                                                                                                                    </Select>
                                                                                                                )}
                                                                                                            />
                                                                                                        </div>
                                                                                                        <Input
                                                                                                            placeholder="10-digit mobile number"
                                                                                                            {...field}
                                                                                                            value={field.value ?? ""}
                                                                                                            maxLength={10}
                                                                                                            className="rounded-l-none"
                                                                                                            onChange={(e) => {
                                                                                                                const value = e.target.value.replace(/\D/g, "").slice(0, 10)
                                                                                                                field.onChange(value)
                                                                                                            }}
                                                                                                        />
                                                                                                    </div>
                                                                                                </FormControl>
                                                                                                <FormMessage />
                                                                                            </FormItem>
                                                                                        )}
                                                                                    />
                                                                                </div>

                                                                                <div className="grid gap-4 md:grid-cols-3 mt-4">
                                                                                    <FormField
                                                                                        control={form.control}
                                                                                        name={`nominees.${index}.gender`}
                                                                                        render={({ field }) => (
                                                                                            <FormItem ref={registerFieldRef(`nominees.${index}.gender`)}>
                                                                                                <FormLabel>Gender <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                                                <FormControl>
                                                                                                    <select
                                                                                                        {...field}
                                                                                                        className="w-full border border-input rounded-md h-10 px-3"
                                                                                                    >
                                                                                                        <option value="">Select Gender</option>
                                                                                                        <option value="Male">Male</option>
                                                                                                        <option value="Fmale">Female</option>
                                                                                                        <option value="Other">Other</option>
                                                                                                    </select>
                                                                                                </FormControl>
                                                                                                <FormMessage />
                                                                                            </FormItem>
                                                                                        )}
                                                                                    />
                                                                                    <DatePickerField
                                                                                        ref={registerFieldRef(`nominees.${index}.dob`)}
                                                                                        control={form.control}
                                                                                        name={`nominees.${index}.dob`}
                                                                                        label={
                                                                                            <>
                                                                                                Date of Birth <span className="text-red-500 font-bold text-lg">*</span>
                                                                                            </>
                                                                                        }
                                                                                        endYear={new Date().getFullYear()}
                                                                                        onDateSelect={(date) => {
                                                                                            if (date) {
                                                                                                const today = new Date();
                                                                                                let age = today.getFullYear() - date.getFullYear();
                                                                                                const monthDiff = today.getMonth() - date.getMonth();
                                                                                                const dayDiff = today.getDate() - date.getDate();

                                                                                                if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
                                                                                                    age--;
                                                                                                }

                                                                                                const isMinor = age < 18;
                                                                                                form.setValue(`nominees.${index}.isMinor`, isMinor);
                                                                                            }
                                                                                        }}
                                                                                    />
                                                                                    <FormField
                                                                                        control={form.control}
                                                                                        name={`nominees.${index}.relationWithBo`}
                                                                                        render={({ field }) => (
                                                                                            <FormItem>
                                                                                                <FormLabel>Relation with BO <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                                                <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                                                                    <FormControl>
                                                                                                        <SelectTrigger>
                                                                                                            <SelectValue placeholder="Select relation" />
                                                                                                        </SelectTrigger>
                                                                                                    </FormControl>
                                                                                                    <SelectContent>
                                                                                                        {relationOptions.map((option) => (
                                                                                                            <SelectItem key={option} value={option}>
                                                                                                                {option}
                                                                                                            </SelectItem>
                                                                                                        ))}
                                                                                                    </SelectContent>
                                                                                                </Select>
                                                                                                <FormMessage />
                                                                                            </FormItem>
                                                                                        )}
                                                                                    />
                                                                                </div>

                                                                                <div className="grid gap-4 md:grid-cols-2 mt-4">
                                                                                    <FormField
                                                                                        control={form.control}
                                                                                        name={`nominees.${index}.proofType`}
                                                                                        render={({ field }) => (
                                                                                            <FormItem ref={registerFieldRef(`nominees.${index}.proofType`)}>
                                                                                                <FormLabel>Proof Type <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                                                <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                                                                    <FormControl>
                                                                                                        <SelectTrigger>
                                                                                                            <SelectValue placeholder="Select proof type" />
                                                                                                        </SelectTrigger>
                                                                                                    </FormControl>
                                                                                                    <SelectContent>
                                                                                                        {/* <SelectItem value="pan">PAN Card</SelectItem> */}
                                                                                                        <SelectItem value="uid">Aadhaar</SelectItem>
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
                                                                                        name={`nominees.${index}.proofNumber`}
                                                                                        render={({ field }) => (
                                                                                            <FormItem ref={registerFieldRef(`nominees.${index}.proofNumber`)}>
                                                                                                <FormLabel>Proof Number <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                                                <FormControl>
                                                                                                    <Input placeholder="Proof number" {...field} />
                                                                                                </FormControl>
                                                                                                <FormMessage />
                                                                                            </FormItem>
                                                                                        )}
                                                                                    />
                                                                                </div>

                                                                                <div className="grid gap-4 sm:grid-cols-1 mt-4">
                                                                                    <FormField
                                                                                        control={form.control}
                                                                                        name={`nominees.${index}.address`}
                                                                                        render={({ field }) => (
                                                                                            <FormItem ref={registerFieldRef(`nominees.${index}.address`)}>
                                                                                                <FormLabel>Address <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                                                <FormControl>
                                                                                                    <Textarea placeholder="Flat/House No., Building Name" {...field} />
                                                                                                </FormControl>
                                                                                                <FormMessage />
                                                                                            </FormItem>
                                                                                        )}
                                                                                    />
                                                                                </div>

                                                                                <div className="grid gap-4 sm:grid-cols-3 mt-4">
                                                                                    <FormField
                                                                                        control={form.control}
                                                                                        name={`nominees.${index}.stateCode`}
                                                                                        render={({ field }) => (
                                                                                            <FormItem ref={registerFieldRef(`nominees.${index}.stateCode`)}>
                                                                                                <FormLabel>State <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                                                <FormControl>
                                                                                                    <Input placeholder="State" {...field} />
                                                                                                </FormControl>
                                                                                                <FormMessage />
                                                                                            </FormItem>
                                                                                        )}
                                                                                    />

                                                                                    <FormField
                                                                                        control={form.control}
                                                                                        name={`nominees.${index}.pinCode`}
                                                                                        render={({ field }) => (
                                                                                            <FormItem ref={registerFieldRef(`nominees.${index}.pinCode`)}>
                                                                                                <FormLabel>Pincode <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                                                <FormControl>
                                                                                                    <Input placeholder="6-digit pincode" {...field} />
                                                                                                </FormControl>
                                                                                                <FormMessage />
                                                                                            </FormItem>
                                                                                        )}
                                                                                    />
                                                                                    <FormField
                                                                                        control={form.control}
                                                                                        name={`nominees.${index}.countryCode`}
                                                                                        render={({ field }) => (
                                                                                            <FormItem ref={registerFieldRef(`nominees.${index}.countryCode`)}>
                                                                                                <FormLabel>Country <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                                                <FormControl>
                                                                                                    <Input placeholder="Country" {...field} />
                                                                                                </FormControl>
                                                                                                <FormMessage />
                                                                                            </FormItem>
                                                                                        )}
                                                                                    />

                                                                                </div>

                                                                                <FormField
                                                                                    control={form.control}
                                                                                    name={`nominees.${index}.percentageShares`}
                                                                                    render={({ field }) => (
                                                                                        <FormItem className="mt-4">
                                                                                            <FormLabel>Percentage Shares</FormLabel>
                                                                                            <FormControl>
                                                                                                <div className="space-y-2">
                                                                                                    <Slider
                                                                                                        value={[field.value || 100]}
                                                                                                        onValueChange={(vals) => field.onChange(vals[0])}
                                                                                                        max={100}
                                                                                                        step={1}
                                                                                                        className="w-full"
                                                                                                    />
                                                                                                    <div className="text-center text-sm text-gray-600">{field.value || 100}%</div>
                                                                                                </div>
                                                                                            </FormControl>
                                                                                            <FormMessage />
                                                                                        </FormItem>
                                                                                    )}
                                                                                />
                                                                            </div>

                                                                            <div className="mt-4 p-4 border rounded-lg">
                                                                                <FormField
                                                                                    control={form.control}
                                                                                    name={`nominees.${index}.isMinor`}
                                                                                    render={({ field }) => (
                                                                                        <FormItem className="flex flex-row items-center justify-between" ref={registerFieldRef(`nominees.${index}.isMinor`)}>
                                                                                            <div className="space-y-0.5">
                                                                                                <FormLabel className="text-base">Is Minor Nominee?</FormLabel>
                                                                                                <FormDescription>
                                                                                                    {isMinorByAge
                                                                                                        ? "You cannot change this because DOB indicates the nominee is a minor."
                                                                                                        : "Toggle this if the nominee is a minor (under 18 years old)"}
                                                                                                </FormDescription>
                                                                                            </div>
                                                                                            <FormControl>
                                                                                                <Switch
                                                                                                    checked={isMinorByAge || field.value}
                                                                                                    disabled={isMinorByAge}
                                                                                                    onCheckedChange={(checked) => {
                                                                                                        // Allow toggle only if age >= 18
                                                                                                        const dob = form.getValues(`nominees.${index}.dob`);
                                                                                                        if (!dob) return;

                                                                                                        const today = new Date();
                                                                                                        let age = today.getFullYear() - dob.getFullYear();
                                                                                                        const m = today.getMonth() - dob.getMonth();
                                                                                                        const d = today.getDate() - dob.getDate();
                                                                                                        if (m < 0 || (m === 0 && d < 0)) age--;

                                                                                                        const isMinorByAge = age < 18;
                                                                                                        if (isMinorByAge) return;

                                                                                                        // Manually toggle `isMinor`
                                                                                                        form.setValue(`nominees.${index}.isMinor`, checked);

                                                                                                        // Guardian logic
                                                                                                        if (checked) {
                                                                                                            const guardian = form.getValues(`nominees.${index}.guardian`);
                                                                                                            if (!guardian || !guardian.name) {
                                                                                                                form.setValue(`nominees.${index}.guardian`, {
                                                                                                                    name: "",
                                                                                                                    dob: undefined,
                                                                                                                    isdCode: "91",
                                                                                                                    mobile: "",
                                                                                                                    email: "",
                                                                                                                    address: "",
                                                                                                                    relationWithMinorNominee: "Spouse",
                                                                                                                    countryCode: "",
                                                                                                                    stateCode: "",
                                                                                                                    pinCode: "",
                                                                                                                    fatherName: "",
                                                                                                                    gender: "Other",
                                                                                                                    pan: "",
                                                                                                                    aadhar: "",
                                                                                                                });
                                                                                                            }
                                                                                                        } else {
                                                                                                            form.setValue(`nominees.${index}.guardian`, undefined);
                                                                                                        }
                                                                                                    }}
                                                                                                />

                                                                                            </FormControl>
                                                                                        </FormItem>
                                                                                    )}
                                                                                />
                                                                            </div>

                                                                            {isActuallyMinor && (
                                                                                <div className="mt-6 p-4 border rounded-lg bg-blue-50 ">
                                                                                    <h5 className="font-medium mb-4 text-blue-800 flex items-center "><Shield className="h-4 w-4 mr-2" /> Guardian Details (Required for Minor Nominee)</h5>
                                                                                    <Separator className="my-4" />

                                                                                    <div className="ml-6">
                                                                                        <div className="grid gap-4 md:grid-cols-2">
                                                                                            <FormField
                                                                                                control={form.control}
                                                                                                name={`nominees.${index}.guardian.name`}
                                                                                                render={({ field }) => (
                                                                                                    <FormItem ref={registerFieldRef(`nominees.${index}.guardian.name`)}>
                                                                                                        <FormLabel>Guardian Name <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                                                        <FormControl>
                                                                                                            <Input placeholder="Full name" {...field} />
                                                                                                        </FormControl>
                                                                                                        <FormMessage />
                                                                                                    </FormItem>
                                                                                                )}
                                                                                            />
                                                                                            <FormField
                                                                                                control={form.control}
                                                                                                name={`nominees.${index}.guardian.fatherName`}
                                                                                                render={({ field }) => (
                                                                                                    <FormItem ref={registerFieldRef(`nominees.${index}.guardian.fatherName`)}>
                                                                                                        <FormLabel>Father's / Husband's Name <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                                                        <FormControl>
                                                                                                            <Input placeholder="Father's / Husband's Name" {...field} />
                                                                                                        </FormControl>
                                                                                                        <FormMessage />
                                                                                                    </FormItem>
                                                                                                )}
                                                                                            />
                                                                                        </div>

                                                                                        <div className="grid gap-4 md:grid-cols-3 mt-4">
                                                                                            <FormField
                                                                                                control={form.control}
                                                                                                name={`nominees.${index}.guardian.pan`}
                                                                                                render={({ field }) => (
                                                                                                    <FormItem ref={registerFieldRef(`nominees.${index}.guardian.pan`)}>
                                                                                                        <FormLabel>PAN Number <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                                                        <FormControl>
                                                                                                            <Input placeholder="PAN Number" {...field} />
                                                                                                        </FormControl>
                                                                                                        <FormMessage />
                                                                                                    </FormItem>
                                                                                                )}
                                                                                            />
                                                                                            <FormField
                                                                                                control={form.control}
                                                                                                name={`nominees.${index}.guardian.aadhar`}
                                                                                                render={({ field }) => {
                                                                                                    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                                                                                                        let value = e.target.value.replace(/\D/g, "") // Remove non-digits
                                                                                                        if (value.length > 12) value = value.slice(0, 12) // Limit to 12 digits

                                                                                                        field.onChange(value)
                                                                                                    }

                                                                                                    const maskedValue =
                                                                                                        field.value && field.value.length === 12
                                                                                                            ? "********" + field.value.slice(-4)
                                                                                                            : field.value

                                                                                                    return (
                                                                                                        <FormItem ref={registerFieldRef(`nominees.${index}.guardian.aadhar`)}>
                                                                                                            <FormLabel>Aadhar Number <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                                                            <FormControl>
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
                                                                                                                />
                                                                                                            </FormControl>
                                                                                                            <FormMessage />
                                                                                                        </FormItem>
                                                                                                    )
                                                                                                }}
                                                                                            />
                                                                                        </div>

                                                                                        <div className="grid gap-4 md:grid-cols-3 mt-4">
                                                                                            <FormField
                                                                                                control={form.control}
                                                                                                name={`nominees.${index}.guardian.email`}
                                                                                                render={({ field }) => (
                                                                                                    <FormItem ref={registerFieldRef(`nominees.${index}.guardian.email`)}>
                                                                                                        <FormLabel>Guardian Email (Optional)</FormLabel>
                                                                                                        <FormControl>
                                                                                                            <Input placeholder="email@example.com" type="email" {...field} />
                                                                                                        </FormControl>
                                                                                                        <FormMessage />
                                                                                                    </FormItem>
                                                                                                )}
                                                                                            />
                                                                                            <FormField
                                                                                                control={form.control}
                                                                                                name={`nominees.${index}.guardian.mobile`}
                                                                                                render={({ field }) => (
                                                                                                    <FormItem ref={registerFieldRef(`nominees.${index}.guardian.mobile`)}>
                                                                                                        <FormLabel>Guardian Mobile (Optional)</FormLabel>
                                                                                                        <FormControl>
                                                                                                            <Input placeholder="10-digit mobile" {...field} value={field.value ?? ""} />
                                                                                                        </FormControl>
                                                                                                        <FormMessage />
                                                                                                    </FormItem>
                                                                                                )}
                                                                                            />
                                                                                            <FormField
                                                                                                control={form.control}
                                                                                                name={`nominees.${index}.guardian.relationWithMinorNominee`}
                                                                                                render={({ field }) => (
                                                                                                    <FormItem ref={registerFieldRef(`nominees.${index}.guardian.relationWithMinorNominee`)}>
                                                                                                        <FormLabel>Relation with Minor Nominee <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                                                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                                                                            <FormControl>
                                                                                                                <SelectTrigger>
                                                                                                                    <SelectValue placeholder="Select relation" />
                                                                                                                </SelectTrigger>
                                                                                                            </FormControl>
                                                                                                            <SelectContent>
                                                                                                                {relationOptions.map((option) => (
                                                                                                                    <SelectItem key={option} value={option}>
                                                                                                                        {option}
                                                                                                                    </SelectItem>
                                                                                                                ))}
                                                                                                            </SelectContent>
                                                                                                        </Select>
                                                                                                        <FormMessage />
                                                                                                    </FormItem>
                                                                                                )}
                                                                                            />

                                                                                            <FormField
                                                                                                control={form.control}
                                                                                                name={`nominees.${index}.guardian.gender`}
                                                                                                render={({ field }) => (
                                                                                                    <FormItem>
                                                                                                        <FormLabel>Gender <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                                                        <FormControl>
                                                                                                            <select
                                                                                                                {...field}
                                                                                                                className="w-full border border-input rounded-md h-10 px-3 bg-transparent"
                                                                                                            >
                                                                                                                <option value="">Select Gender</option>
                                                                                                                <option value="Male">Male</option>
                                                                                                                <option value="Fmale">Female</option>
                                                                                                                <option value="Other">Other</option>
                                                                                                            </select>
                                                                                                        </FormControl>
                                                                                                        <FormMessage />
                                                                                                    </FormItem>
                                                                                                )}
                                                                                            />
                                                                                            <DatePickerField
                                                                                                ref={registerFieldRef(`nominees.${index}.guardian.dob`)}
                                                                                                control={form.control}
                                                                                                name={`nominees.${index}.guardian.dob`}
                                                                                                label={
                                                                                                    <>
                                                                                                        Guardian Date of Birth <span className="text-red-500 font-bold text-lg">*</span>
                                                                                                    </>
                                                                                                }
                                                                                                placeholder="Select your Guardian Date of Birth"
                                                                                            />
                                                                                        </div>

                                                                                        <div className="grid gap-4 sm:grid-cols-1 mt-4">
                                                                                            <FormField
                                                                                                control={form.control}
                                                                                                name={`nominees.${index}.guardian.address`}
                                                                                                render={({ field }) => (
                                                                                                    <FormItem ref={registerFieldRef(`nominees.${index}.guardian.address`)}>
                                                                                                        <FormLabel>Address <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                                                        <FormControl>
                                                                                                            <Textarea placeholder="Flat/House No., Building Name" {...field} />
                                                                                                        </FormControl>
                                                                                                        <FormMessage />
                                                                                                    </FormItem>
                                                                                                )}
                                                                                            />
                                                                                        </div>

                                                                                        <div className="grid gap-4 sm:grid-cols-3 mt-4">
                                                                                            <FormField
                                                                                                control={form.control}
                                                                                                name={`nominees.${index}.guardian.stateCode`}
                                                                                                render={({ field }) => (
                                                                                                    <FormItem ref={registerFieldRef(`nominees.${index}.guardian.stateCode`)}>
                                                                                                        <FormLabel>State <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                                                        <FormControl>
                                                                                                            <Input placeholder="State" {...field} />
                                                                                                        </FormControl>
                                                                                                        <FormMessage />
                                                                                                    </FormItem>
                                                                                                )}
                                                                                            />

                                                                                            <FormField
                                                                                                control={form.control}
                                                                                                name={`nominees.${index}.guardian.pinCode`}
                                                                                                render={({ field }) => (
                                                                                                    <FormItem ref={registerFieldRef(`nominees.${index}.guardian.pinCode`)}>
                                                                                                        <FormLabel>Pincode <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                                                        <FormControl>
                                                                                                            <Input placeholder="6-digit pincode" {...field} />
                                                                                                        </FormControl>
                                                                                                        <FormMessage />
                                                                                                    </FormItem>
                                                                                                )}
                                                                                            />
                                                                                            <FormField
                                                                                                control={form.control}
                                                                                                name={`nominees.${index}.guardian.countryCode`}
                                                                                                render={({ field }) => (
                                                                                                    <FormItem ref={registerFieldRef(`nominees.${index}.guardian.countryCode`)}>
                                                                                                        <FormLabel>Country <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                                                        <FormControl>
                                                                                                            <Input placeholder="Country" {...field} />
                                                                                                        </FormControl>
                                                                                                        <FormMessage />
                                                                                                    </FormItem>
                                                                                                )}
                                                                                            />
                                                                                        </div>
                                                                                    </div>

                                                                                    <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                                                                                        <p className="text-sm text-blue-700">
                                                                                            <strong>Note:</strong> Guardian details are mandatory for nominees under 18 years of age.
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                    </CollapsibleContent>
                                                                </Collapsible>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>

                                {/* POA SECTION */}
                                <div id="poa" className="scroll-mt-32">
                                    <div className="border-gray-200 rounded-lg overflow-hidden shadow-lg border-0 bg-white/80 backdrop-blur mt-8">
                                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
                                            <h3 className="text-blue-800 flex items-center text-lg font-medium">
                                                <Shield className="mr-2 h-5 w-5 text-blue-600" />
                                                Power of Attorney
                                            </h3>
                                            <p className="text-blue-700/70 text-sm mt-1">Add power of attorney details if applicable</p>
                                        </div>
                                        <div className="p-6 space-y-6 bg-white">
                                            <Alert className="bg-amber-50 border-amber-200">
                                                <Info className="h-4 w-4 text-amber-600" />
                                                <AlertTitle className="text-amber-800">Information</AlertTitle>
                                                <AlertDescription className="text-amber-700">
                                                    Power of Attorney (POA) gives another person the authority to make decisions about your
                                                    investments. Only add a POA if you want to delegate this authority.
                                                </AlertDescription>
                                            </Alert>

                                            <div className="space-y-5 border rounded-md p-5 mt-4 border-gray-200 bg-gray-50">
                                                <FormField
                                                    control={form.control}
                                                    name="wishToPOA"
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-3">
                                                            <FormLabel className="text-gray-700 font-medium">Do you wish to POA?</FormLabel>
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

                                                {wishToPOA === "yes" ? (
                                                    <div className="space-y-6">
                                                        {poaFields.map((field, index) => (
                                                            <div
                                                                key={field.id}
                                                                className="border rounded-lg p-4 mb-4"
                                                            >
                                                                <div className="grid gap-5 sm:grid-cols-2">
                                                                    <FormField
                                                                        control={form.control}
                                                                        name={`poas.${index}.poaId`}
                                                                        render={({ field }) => (
                                                                            <FormItem ref={registerFieldRef(`poas.${index}.poaId`)}>
                                                                                <FormLabel className="text-gray-700">POA ID <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                                    <FormControl>
                                                                                        <SelectTrigger className="border-gray-300">
                                                                                            <SelectValue placeholder="Select POA ID" />
                                                                                        </SelectTrigger>
                                                                                    </FormControl>
                                                                                    <SelectContent>
                                                                                        <SelectItem value="2205810000000202">2205810000000202</SelectItem>
                                                                                        <SelectItem value="2205810000000050">2205810000000050</SelectItem>
                                                                                    </SelectContent>
                                                                                </Select>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )}
                                                                    />

                                                                    <FormField
                                                                        control={form.control}
                                                                        name={`poas.${index}.poaSetupDate`}
                                                                        render={({ field }) => (
                                                                            <FormItem className="flex flex-col" ref={registerFieldRef(`poas.${index}.poaSetupDate`)}>
                                                                                <FormLabel className="text-gray-700">Setup/POA Creation Date <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                                <Popover>
                                                                                    <PopoverTrigger asChild>
                                                                                        <FormControl>
                                                                                            <Button
                                                                                                variant={"outline"}
                                                                                                className={cn(
                                                                                                    "w-full pl-3 text-left font-normal border-gray-300",
                                                                                                    !field.value && "text-muted-foreground",
                                                                                                )}
                                                                                            >
                                                                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                                                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                                                                            </Button>
                                                                                        </FormControl>
                                                                                    </PopoverTrigger>
                                                                                    <PopoverContent className="w-auto p-0" align="start">
                                                                                        <CalendarComponent
                                                                                            mode="single"
                                                                                            selected={field.value}
                                                                                            onSelect={field.onChange}
                                                                                            initialFocus
                                                                                        />
                                                                                    </PopoverContent>
                                                                                </Popover>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )}
                                                                    />
                                                                </div>

                                                                <div className="grid gap-5 sm:grid-cols-2 mt-5">

                                                                    <DatePickerField
                                                                        ref={registerFieldRef(`poas.${index}.poaFromDate`)}
                                                                        control={form.control}
                                                                        name={`poas.${index}.poaFromDate`}
                                                                        label={
                                                                            <>
                                                                                From Date <span className="text-red-500 font-bold text-lg">*</span>
                                                                            </>
                                                                        }
                                                                        placeholder="Select your POA From Date"
                                                                    />

                                                                    <DatePickerField
                                                                        ref={registerFieldRef(`poas.${index}.poaToDate`)}
                                                                        control={form.control}
                                                                        name={`poas.${index}.poaToDate`}
                                                                        label={
                                                                            <>
                                                                                To Date
                                                                            </>
                                                                        }
                                                                        placeholder="Select your POA To Date"
                                                                    />

                                                                </div>

                                                                <div className="grid gap-5 sm:grid-cols-2 mt-5">
                                                                    <FormField
                                                                        control={form.control}
                                                                        name={`poas.${index}.poaPurposeCode`}
                                                                        render={({ field }) => (
                                                                            <FormItem ref={registerFieldRef(`poas.${index}.poaPurposeCode`)}>
                                                                                <FormLabel className="text-gray-700">POA Purpose Code <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                                    <FormControl>
                                                                                        <SelectTrigger className="border-gray-300">
                                                                                            <SelectValue placeholder="Select purpose code" />
                                                                                        </SelectTrigger>
                                                                                    </FormControl>
                                                                                    <SelectContent>
                                                                                        <SelectItem value="First Holder">First Holder</SelectItem>
                                                                                        <SelectItem value="Second Holder">Second Holder</SelectItem>
                                                                                        <SelectItem value="Third Holder">Third Holder</SelectItem>
                                                                                        <SelectItem value="All Holders">All Holders</SelectItem>
                                                                                    </SelectContent>
                                                                                </Select>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )}
                                                                    />

                                                                    <FormField
                                                                        control={form.control}
                                                                        name={`poas.${index}.poaRemarks`}
                                                                        render={({ field }) => (
                                                                            <FormItem>
                                                                                <FormLabel className="text-gray-700">Remarks</FormLabel>
                                                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                                    <FormControl>
                                                                                        <SelectTrigger className="border-gray-300">
                                                                                            <SelectValue placeholder="Select remarks" />
                                                                                        </SelectTrigger>
                                                                                    </FormControl>
                                                                                    <SelectContent>
                                                                                        <SelectItem value="for_payin">For Payin</SelectItem>
                                                                                    </SelectContent>
                                                                                </Select>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )}
                                                                    />
                                                                </div>

                                                                <FormField
                                                                    control={form.control}
                                                                    name={`poas.${index}.poaGpaBpaFlag`}
                                                                    render={({ field }) => (
                                                                        <FormItem ref={registerFieldRef(`poas.${index}.poaGpaBpaFlag`)}>
                                                                            <FormLabel className="text-gray-700">GPA/BPA Flag <span className="text-red-500 font-bold text-lg">*</span></FormLabel>
                                                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                                                <FormItem className="flex items-center space-x-2 space-y-0 bg-white p-3 rounded-md border border-gray-200">
                                                                                    <FormControl>
                                                                                        <Checkbox
                                                                                            id="checkbox_POA_GPA"
                                                                                            checked={field.value?.includes("General purpose")}
                                                                                            onCheckedChange={(checked) => {
                                                                                                const currentValues = field.value || []
                                                                                                if (checked) {
                                                                                                    field.onChange([...currentValues, "General purpose"])
                                                                                                } else {
                                                                                                    field.onChange(currentValues.filter((value) => value !== "General purpose"))
                                                                                                }
                                                                                            }}
                                                                                        />
                                                                                    </FormControl>
                                                                                    <FormLabel htmlFor="checkbox_POA_GPA" className="font-normal">
                                                                                        General purpose
                                                                                    </FormLabel>
                                                                                </FormItem>

                                                                                <FormItem className="flex items-center space-x-2 space-y-0 bg-white p-3 rounded-md border border-gray-200">
                                                                                    <FormControl>
                                                                                        <Checkbox
                                                                                            id="checkbox_POA_BPA"
                                                                                            checked={field.value?.includes("Bank Specific")}
                                                                                            onCheckedChange={(checked) => {
                                                                                                const currentValues = field.value || []
                                                                                                if (checked) {
                                                                                                    field.onChange([...currentValues, "Bank Specific"])
                                                                                                } else {
                                                                                                    field.onChange(currentValues.filter((value) => value !== "Bank Specific"))
                                                                                                }
                                                                                            }}
                                                                                        />
                                                                                    </FormControl>
                                                                                    <FormLabel htmlFor="checkbox_POA_BPA" className="font-normal">
                                                                                        Bank Specific
                                                                                    </FormLabel>
                                                                                </FormItem>

                                                                                <FormItem className="flex items-center space-x-2 space-y-0 bg-white p-3 rounded-md border border-gray-200">
                                                                                    <FormControl>
                                                                                        <Checkbox
                                                                                            id="checkbox_POA_Settlement"
                                                                                            checked={field.value?.includes("Settlement")}
                                                                                            onCheckedChange={(checked) => {
                                                                                                const currentValues = field.value || []
                                                                                                if (checked) {
                                                                                                    field.onChange([...currentValues, "Settlement"])
                                                                                                } else {
                                                                                                    field.onChange(currentValues.filter((value) => value !== "Settlement"))
                                                                                                }
                                                                                            }}
                                                                                        />
                                                                                    </FormControl>
                                                                                    <FormLabel htmlFor="checkbox_POA_Settlement" className="font-normal">
                                                                                        Settlement
                                                                                    </FormLabel>
                                                                                </FormItem>

                                                                                <FormItem className="flex items-center space-x-2 space-y-0 bg-white p-3 rounded-md border border-gray-200">
                                                                                    <FormControl>
                                                                                        <Checkbox
                                                                                            id="checkbox_POA_MarginPledge"
                                                                                            checked={field.value?.includes("Margin Pledge")}
                                                                                            onCheckedChange={(checked) => {
                                                                                                const currentValues = field.value || []
                                                                                                if (checked) {
                                                                                                    field.onChange([...currentValues, "Margin Pledge"])
                                                                                                } else {
                                                                                                    field.onChange(currentValues.filter((value) => value !== "Margin Pledge"))
                                                                                                }
                                                                                            }}
                                                                                        />
                                                                                    </FormControl>
                                                                                    <FormLabel htmlFor="checkbox_POA_MarginPledge" className="font-normal">
                                                                                        Margin Pledge
                                                                                    </FormLabel>
                                                                                </FormItem>

                                                                                <FormItem className="flex items-center space-x-2 space-y-0 bg-white p-3 rounded-md border border-gray-200">
                                                                                    <FormControl>
                                                                                        <Checkbox
                                                                                            id="checkbox_POA_MutualFund"
                                                                                            checked={field.value?.includes("Mutual Fund")}
                                                                                            onCheckedChange={(checked) => {
                                                                                                const currentValues = field.value || []
                                                                                                if (checked) {
                                                                                                    field.onChange([...currentValues, "Mutual Fund"])
                                                                                                } else {
                                                                                                    field.onChange(currentValues.filter((value) => value !== "Mutual Fund"))
                                                                                                }
                                                                                            }}
                                                                                        />
                                                                                    </FormControl>
                                                                                    <FormLabel htmlFor="checkbox_POA_MutualFund" className="font-normal">
                                                                                        Mutual Fund
                                                                                    </FormLabel>
                                                                                </FormItem>

                                                                                <FormItem className="flex items-center space-x-2 space-y-0 bg-white p-3 rounded-md border border-gray-200">
                                                                                    <FormControl>
                                                                                        <Checkbox
                                                                                            id="checkbox_POA_Shares"
                                                                                            checked={field.value?.includes("Tender Offer")}
                                                                                            onCheckedChange={(checked) => {
                                                                                                const currentValues = field.value || []
                                                                                                if (checked) {
                                                                                                    field.onChange([...currentValues, "Tender Offer"])
                                                                                                } else {
                                                                                                    field.onChange(currentValues.filter((value) => value !== "Tender Offer"))
                                                                                                }
                                                                                            }}
                                                                                        />
                                                                                    </FormControl>
                                                                                    <FormLabel htmlFor="checkbox_POA_Shares" className="font-normal">
                                                                                        Tender Offer
                                                                                    </FormLabel>
                                                                                </FormItem>
                                                                            </div>
                                                                            <FormDescription className="mt-2 text-gray-600">
                                                                                You can select up to 2 options
                                                                            </FormDescription>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : null}


                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="flex justify-between items-center mt-6"
                                >
                                    <KYCBackButton variant="ghost" />
                                    <Button
                                        type="submit"
                                        className="w-full sm:w-auto transition-all hover:scale-105 font-medium px-8 py-2.5 text-base bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600"
                                        disabled={isSubmitting}
                                        onClick={(e) => {
                                            console.log("Submit button clicked directly")
                                            console.log("Current form state:", {
                                                isValid: form.formState.isValid,
                                                isDirty: form.formState.isDirty,
                                                errors: form.formState.errors,
                                            })
                                            setHasSubmitted(true)
                                            // Don't prevent default - we want the form submission to continue
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
                                </motion.div>
                            </form>
                        </Form>
                        {/* )} */}
                    </>
                )}
            </div>
        </div>
    )
}
