import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useUser } from '@/contexts/UserContext';
import { getCompatibleUrl } from './url-helpers';
import { getLocalStorage, removeLocalStorage } from './localStorage';
import { Clock, LogOut, ShieldAlert, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export const validateToken = (response: any) => {
    const tokenValidity = response?.data?.tokenValidity;
    const branchClientCheck = response?.data?.branchClientCheck;
    const familyClientCheck = response?.data?.familyClientCheck;

    if (tokenValidity && !tokenValidity.isValid) {
        // const userId = localStorage.getItem("currentClientId");
        // const userId = getLocalStorage(`current${loginType}Id`);
        // if (userId) {
        //     removeLocalStorage(`userToken_${userId}`);
        //     removeLocalStorage(`userID_${userId}`);
        //     removeLocalStorage(`userDetails_${userId}`);
        //     removeLocalStorage(`loginType_${userId}`);
        //     removeLocalStorage(`current${loginType}Id`);
        // }
        toast.error("You have been logged out :(");
        return false;
    } else if (!tokenValidity) {
        toast.warning("tokenValidity is not available in response.");
    }

    if (branchClientCheck && !branchClientCheck.isValidBranch) {
        toast.error("You are not authorized to access this client.");

        // setTimeout(() => {
        //     window.close();
        // }, 5000);

        // return (
        //     <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
        //         <Alert className="bg-white p-6 rounded shadow-md">
        //             <AlertTitle>Access Denied</AlertTitle>
        //             <AlertDescription>You are not authorized to access this branch. Closing tab in 5 seconds...</AlertDescription>
        //         </Alert>
        //     </div>
        // );
    }

    if (familyClientCheck && !familyClientCheck.isValid) {
        toast.error(familyClientCheck.message || "You are not authorized to access this client.");

        // setTimeout(() => {
        //     window.close();
        // }, 5000);

        // return (
        //     <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
        //         <Alert className="bg-white p-6 rounded shadow-md">
        //             <AlertTitle>Access Denied</AlertTitle>
        //             <AlertDescription>You are not authorized to access this branch. Closing tab in 5 seconds...</AlertDescription>
        //         </Alert>
        //     </div>
        // );
    }

    return true;
};

export const clearUserData = (userId: string, loginType: string) => {
    if (!userId) return;

    // Clear common user-related data
    removeLocalStorage(`userToken_${userId}`);
    removeLocalStorage(`userID_${userId}`);
    removeLocalStorage(`userDetails_${userId}`);
    removeLocalStorage(`loginType_${userId}`);
    removeLocalStorage(`userAccessDetails_${userId}`);
    removeLocalStorage(`current${loginType}Id`);
    removeLocalStorage(`accountType_${userId}`);

    // Branch-specific data cleanup
    if (loginType?.toLowerCase() === "branch") {
        removeLocalStorage("currentBranchId");
        if (typeof window !== "undefined") {
            sessionStorage.removeItem("branchClientCheck");
            sessionStorage.removeItem("clientId");
        }
    }
};


/**
 * Modal component displayed when a user's session has expired
 */
export const SessionExpiredModal = () => {
    const [open, setOpen] = useState(true)
    const [countdown, setCountdown] = useState(5) // Increased from 3 to 10 seconds
    const [progress, setProgress] = useState(100)
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { loginType } = useUser()

    // Handle logout and redirection
    const handleLogout = useCallback(() => {
        const userId = getLocalStorage(`current${loginType}Id`)
        if (userId) {
            clearUserData(userId, loginType)
        }

        const hasBranchClientCheck = searchParams.has("branchClientCheck")
        const hasClientId = searchParams.has("clientId")
        const shouldRedirectToBranchLogin = pathname.startsWith("/branch") || (hasBranchClientCheck && hasClientId)

        const redirectPath = shouldRedirectToBranchLogin ? getCompatibleUrl("/authentication/branch/login") : "/"

        router.push(redirectPath)
    }, [router, pathname, loginType, searchParams])

    // Handle immediate logout
    const handleImmediateLogout = () => {
        setCountdown(0)
        handleLogout()
    }

    useEffect(() => {
        // Calculate progress percentage for smoother animation
        setProgress((countdown / 5) * 100)

        // Set up countdown timer
        const timer = setInterval(() => {
            setCountdown((prevCountdown) => {
                if (prevCountdown <= 1) {
                    clearInterval(timer)
                    handleLogout()
                    return 0
                }
                return prevCountdown - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [countdown, handleLogout])

    return (
        <Dialog
            open={open}
            onOpenChange={(newOpen) => {
                // Prevent closing the dialog by setting open to false
                if (newOpen === false) {
                    return
                }
                setOpen(newOpen)
            }}
        >
            <DialogContent
                className="sm:max-w-[450px] p-6"
                onPointerDownOutside={(e) => {
                    // Prevent closing the dialog by clicking outside
                    e.preventDefault()
                }}
                onEscapeKeyDown={(e) => {
                    // Prevent closing the dialog with Escape key
                    e.preventDefault()
                }}
            >
                <DialogHeader className="flex flex-row items-start gap-4 pb-2">
                    <div className="rounded-full p-2 bg-destructive/10 dark:bg-destructive/20 shrink-0">
                        <XCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-semibold tracking-tight">Session Expired</DialogTitle>
                        <DialogDescription className="text-base mt-1">
                            Your session has expired due to inactivity or security reasons.
                        </DialogDescription>
                    </div>
                </DialogHeader>

                {/* <div className="py-4 space-y-3">
                    <Alert variant="destructive" className="border-destructive/20 bg-destructive/10 dark:bg-destructive/20">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle className="font-medium">Security Alert</AlertTitle>
                        <AlertDescription>
                            For your security, your session data has been cleared. You'll need to log in again to continue.
                        </AlertDescription>
                    </Alert>

                    <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/50">
                        <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        <AlertTitle className="font-medium text-yellow-800 dark:text-yellow-300">Automatic Redirect</AlertTitle>
                        <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                            You will be redirected to the login page automatically. Any unsaved work may be lost.
                        </AlertDescription>
                    </Alert>
                </div> */}

                {countdown > 0 && (
                    <div className="mt-2">
                        <div className="flex justify-between text-sm mb-1.5">
                            <span className="font-medium flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" /> Redirecting in {countdown} seconds...
                            </span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                )}

                <DialogFooter className="mt-6">
                    <Button onClick={handleImmediateLogout} variant="default" className="w-full sm:w-auto">
                        <LogOut className="h-4 w-4 mr-2" />
                        Back to Login
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
