"use client"
import { Check, AlertCircle, Clock, LockIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useKYC } from "@/contexts/kyc-context"
import { useEffect, useMemo, useState } from "react"
import { useKYCError } from "@/contexts/KYCErrorContext"
import { motion } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"


export default function StepProgress() {
  const { state, navigateToStep, canAccessStep, validateStepStatuses } = useKYC()
  const { setErrors } = useKYCError();

  const [trueCurrentStep, setTrueCurrentStep] = useState<string | null>(null);

  const STEP_SEQUENCE = useMemo(
    () => ["signin", "personal-details", "nominee-poa", "bank", "exchange", "completion"],
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = localStorage.getItem("kyc_state");
      if (!raw) return;

      const parsed = JSON.parse(raw);
      const stepsStatus = parsed?.steps || {};

      // ✅ Find the first incomplete step in the sequence
      const nextStep = STEP_SEQUENCE.find((step) => stepsStatus?.[step] !== "completed");

      setTrueCurrentStep(nextStep || STEP_SEQUENCE[STEP_SEQUENCE.length - 1]); // fallback to last step if all completed
    } catch (err) {
      console.error("❌ Failed to parse kyc_state from localStorage", err);
    }
  }, [STEP_SEQUENCE]);

  // Validate step statuses when rendering step progress
  useEffect(() => {
    validateStepStatuses()
  }, [validateStepStatuses])

  // Update the steps array to include the nominee-poa step
  const steps = [
    { id: "signin", label: "Sign In", description: "Verify your identity" },
    { id: "personal-details", label: "Personal Details", description: "Provide your information" },
    { id: "nominee-poa", label: "Nominee & POA", description: "Add nominees and POA" },
    { id: "bank", label: "Bank", description: "Add bank details" },
    { id: "exchange", label: "Exchange", description: "Choose exchanges" },
    { id: "completion", label: "Completion", description: "Completed process!" },
  ]

  // Find the current step index
  const currentStepIndex = steps.findIndex((step) => step.id === state.currentStep)

  // Calculate which steps to show in mobile view
  const getVisibleSteps = () => {
    // If we're on the first 3 steps, show the first 4 steps
    if (currentStepIndex < 3) {
      return steps.slice(0, 4)
    }
    // If we're on the last 3 steps, show the last 4 steps
    else if (currentStepIndex >= steps.length - 3) {
      return steps.slice(-4)
    }
    // Otherwise, show the current step and one before and two after
    else {
      return steps.slice(currentStepIndex - 1, currentStepIndex + 3)
    }
  }

  const visibleSteps = getVisibleSteps()

  return (
    <div className="w-full">

      {/* Desktop view */}
      <div className="hidden md:block">
        <div className="relative">
          <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200"></div>
          <ol className="relative flex justify-between">
            {steps.map((step, index) => {
              const status = state.steps[step.id as keyof typeof state.steps]
              const isCurrent = state.currentStep === step.id
              const isCompleted = status === "completed"
              const isFailed = status === "failed"
              const isInProgress = status === "in_progress"
              const isAccessible = canAccessStep(step.id)
              const isTrueStep = step.id === trueCurrentStep;

              return (
                <li key={step.id} className="flex flex-col items-center relative z-10">
                  <div
                    onClick={() => {
                      // Only allow navigation if step is accessible AND not completed
                      if (isAccessible && !isCompleted) {
                        navigateToStep(step.id)
                      }
                      setErrors([])
                    }}
                    className={cn(
                      "flex flex-col items-center cursor-default",
                      isAccessible && !isCompleted && "cursor-pointer",
                      isCompleted && "cursor-not-allowed opacity-75",
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full z-10 border-2",
                        isCompleted
                          ? "bg-green-100 border-green-500 text-green-600"
                          : isFailed
                            ? "bg-red-100 border-red-500 text-red-600"
                            : isCurrent
                              ? "bg-blue-100 border-blue-500 text-blue-600 ring-4 ring-blue-100"
                              : isInProgress
                                ? "bg-blue-50 border-blue-400 text-blue-500"
                                : "bg-white border-gray-300 text-gray-400",
                      )}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : isFailed ? (
                        <AlertCircle className="w-5 h-5" />
                      ) : isCurrent ? (
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      ) : isInProgress ? (
                        <Clock className="w-5 h-5" />
                      ) : (
                        <LockIcon className="w-4 h-4" />
                      )}
                    </div>

                    {/* Current step indicator */}
                    {/* Status Badge */}
                    {isTrueStep && !isCurrent ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <motion.span
                              animate={{
                                y: [5, -5, 5], // small vertical bounce
                              }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                repeatType: "loop",
                                ease: "easeInOut",
                              }}
                              className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-[10px] font-semibold px-2 py-[2px] rounded-full shadow-md ring-2 ring-white z-10"
                            >
                              Click to View
                            </motion.span>

                          </TooltipTrigger>
                          <TooltipContent className="text-xs max-w-xs">
                            This is the next step you need to complete. Click here to jump.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : isCurrent ? (
                      <span className="absolute -top-1 -right-1 flex h-4 w-10">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 z-10"></span>
                        <span className="relative inline-flex rounded-full h-4 w-10 bg-blue-500 text-[10px] text-white justify-center items-center font-medium z-10">
                          Now
                        </span>
                      </span>
                    ) : null}

                    {/* Status indicator */}
                    {isInProgress && (
                      <span className="absolute -top-1 -right-1 inline-flex rounded-full h-4 px-2 bg-blue-500 text-[10px] text-white justify-center items-center font-medium z-10">
                        In Progress
                      </span>
                    )}

                    <div
                      className={cn(
                        "mt-3 text-center",
                        isAccessible && !isCompleted ? "cursor-pointer" : "cursor-not-allowed opacity-75",
                      )}
                    >
                      <p
                        className={cn(
                          "text-sm font-medium",
                          isCurrent
                            ? "font-bold text-blue-700"
                            : isCompleted
                              ? "font-medium text-green-700"
                              : "font-normal text-gray-600",
                        )}
                      >
                        {step.label}
                      </p>
                      <p className={cn("text-xs mt-0.5", isCurrent ? "text-blue-600" : "text-gray-500")}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </div>

      {/* Mobile view - simplified to show only 4 steps at a time */}
      <div className="md:hidden">
        <div className="relative">
          <div className="flex justify-between px-4 py-2">
            {/* Add connecting line between steps */}
            <div className="absolute top-[22px] left-[40px] right-[40px] h-0.5 bg-gray-200 z-0"></div>

            {visibleSteps.map((step, index) => {
              const status = state.steps[step.id as keyof typeof state.steps]
              const isCurrent = state.currentStep === step.id
              const isCompleted = status === "completed"
              const isFailed = status === "failed"
              const isInProgress = status === "in_progress"
              const isAccessible = canAccessStep(step.id)
              const isTrueStep = step.id === trueCurrentStep;

              return (
                <div
                  key={step.id}
                  className={cn("flex flex-col items-center relative", isCurrent && "scale-110")}
                  onClick={() => {
                    // Only allow navigation if step is accessible AND not completed
                    if (isAccessible && !isCompleted) {
                      navigateToStep(step.id)
                    }
                    setErrors([])
                  }}
                  style={{
                    cursor: isAccessible && !isCompleted ? "pointer" : "not-allowed",
                  }}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full z-10 border-2",
                      isCompleted
                        ? "bg-green-100 border-green-500 text-green-600"
                        : isFailed
                          ? "bg-red-100 border-red-500 text-red-600"
                          : isCurrent
                            ? "bg-blue-100 border-blue-500 text-blue-600 ring-4 ring-blue-100"
                            : isInProgress
                              ? "bg-blue-50 border-blue-400 text-blue-500"
                              : "bg-white border-gray-300 text-gray-400",
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : isFailed ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : isCurrent ? (
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    ) : isInProgress ? (
                      <Clock className="w-5 h-5" />
                    ) : (
                      <LockIcon className="w-4 h-4" />
                    )}
                  </div>

                  {/* Current step indicator */}
                  {/* Status Badge */}
                  {isTrueStep && !isCurrent ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.span
                            animate={{
                              y: [5, -5, 5], // small vertical bounce
                            }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              repeatType: "loop",
                              ease: "easeInOut",
                            }}
                            className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-[10px] font-semibold px-2 py-[2px] rounded-full shadow-md ring-2 ring-white z-10"
                          >
                            Click to View
                          </motion.span>

                        </TooltipTrigger>
                        <TooltipContent className="text-xs max-w-xs">
                          This is the next step you need to complete. Click here to jump.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : isCurrent ? (
                    <span className="absolute -top-1 -right-1 flex h-4 w-10">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 z-10"></span>
                      <span className="relative inline-flex rounded-full h-4 w-10 bg-blue-500 text-[10px] text-white justify-center items-center font-medium z-10">
                        Now
                      </span>
                    </span>
                  ) : null}

                  <div
                    className={cn(
                      "mt-2 text-center",
                      isAccessible && !isCompleted ? "cursor-pointer" : "cursor-not-allowed opacity-70",
                    )}
                  >
                    <p
                      className={cn(
                        "text-xs font-medium",
                        isCurrent
                          ? "font-bold text-blue-700"
                          : isCompleted
                            ? "font-medium text-green-700"
                            : "font-normal text-gray-600",
                      )}
                    >
                      {step.label}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Current step info - keep this part */}
        <div className="mt-4 bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <div className="mr-3 bg-blue-100 p-2 rounded-full">
              {(() => {
                const currentStep = steps.find((s) => s.id === state.currentStep)
                const status = currentStep ? state.steps[currentStep.id as keyof typeof state.steps] : null

                if (status === "completed") {
                  return <Check className="h-5 w-5 text-green-600" />
                } else if (status === "failed") {
                  return <AlertCircle className="h-5 w-5 text-red-600" />
                } else if (status === "in_progress" || state.currentStep === currentStep?.id) {
                  return <Clock className="h-5 w-5 text-blue-600" />
                } else {
                  return <LockIcon className="h-5 w-5 text-gray-600" />
                }
              })()}
            </div>
            <div>
              <h3 className="font-medium text-blue-800">
                Step {steps.findIndex((s) => s.id === state.currentStep) + 1}:{" "}
                {steps.find((s) => s.id === state.currentStep)?.label}
              </h3>
              <p className="text-xs text-blue-600">{steps.find((s) => s.id === state.currentStep)?.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
