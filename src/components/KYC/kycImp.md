// Get sign-in data from localStorage
            // const signInData = localStorage.getItem("kyc_signin_form")
            // let mobileNumber = "" // Default fallback
            // let panNumber = "" // Default fallback

            // if (signInData) {
            //     const parsedSignInData = JSON.parse(signInData)
            //     mobileNumber = parsedSignInData.mobileNumber || mobileNumber
            //     panNumber = parsedSignInData.panNumber || panNumber
            // }

            // // Create dummy profile data for the template values
            // const profileData = {
            //     Status: "Active",
            //     Client_Name: data.fullName,
            //     Client_CodeNo: "CL" + Math.floor(Math.random() * 10000),
            //     Account_Type: "Trading",
            //     Marital_Status: data.maritalStatus,
            //     Gender: "Male",
            //     POI: "PAN",
            //     POIOther: "",
            //     Nationality: "Indian",
            //     dob: "01/01/1990",
            //     Father_Spouse_Name: data.fatherSpouseName,
            //     Adhare_Number: "123456789012",
            //     Client_id: "CID" + Math.floor(Math.random() * 10000),
            //     NationalityOther: "",
            //     PAN: panNumber,
            // }

            // const esignResponse = await createEsignKYC({
            //     signers: [
            //         {
            //             identifier: mobileNumber,
            //             reason: "Test",
            //             signer_tag: "Signer 1",
            //             name: data.fullName,
            //             sign_type: "aadhaar",
            //         },
            //     ],
            //     display_on_page: "ALL",
            //     expire_in_days: 10,
            //     include_authentication_url: "true",
            //     templates: [
            //         {
            //             template_key: "TMP2505121658496794V9XMNB3LJR1P8",
            //             images: {},
            //             template_values: profileData,
            //         },
            //     ],
            //     send_sign_link: true,
            //     notify_signers: true,
            // })

            // if (esignResponse.status !== 200) {
            //     throw new Error("Failed to create eSign")
            // }

            // console.log(esignResponse)

            // if (
            //     esignResponse.data &&
            //     esignResponse.data.data &&
            //     esignResponse.data.data.data.signing_parties &&
            //     esignResponse.data.data.data.signing_parties[0]
            // ) {
            //     const eSignData = esignResponse.data.data.data

            //     try {
            //         const redirectUrl = encodeURIComponent("http://localhost:3000/kyc/nominee-poa")
            //         // const redirectUrl = encodeURIComponent("https://capital.pesb.co.in:5500/kyc/nominee-poa.html");

            //         const baseAuthUrl = `https://ext.digio.in/#/gateway/login/${eSignData?.id}/PESB/${eSignData?.signing_parties[0]?.identifier}?link_approach=true&redirect_url=${redirectUrl}`

            //         // Open in new tab
            //         window.location.href = baseAuthUrl

            //         // Mark as completed after opening the URL
            //         // Save form data
            //         localStorage.setItem("kyc_personal-details_form", JSON.stringify(dataToSave))
            //         completePersonalDetailsSubmission()
            //     } catch (error) {
            //         console.error("Error opening authentication URL:", error)
            //         setIsSubmitting(false)
            //         toast({
            //             title: "Error",
            //             description: "Failed to open authentication URL. Please try again.",
            //             variant: "destructive",
            //         })
            //     }
            // } else {
            //     throw new Error("Invalid response format from createEsign API")
            // }


****************************************************************************************************************************

            ///!!!!!!! old but working without digio
    const fetchProfileDetails = useCallback(async (retryForce = false) => {
        console.log("Triggered fetchProfile");
        await new Promise((resolve) => setTimeout(resolve, 500)); // Delay 100ms

        const retryRequired = sessionStorage.getItem("digioRetryRequired") === "1";
        console.log(sessionStorage.getItem("docs_fetched"));
        console.log(sessionStorage.getItem("selfie_fetched"));
        console.log(retryRequired);
        console.log(retryForce);

        try {
            setIsLoadingProfileData(true);

            const docsFetched = sessionStorage.getItem("docs_fetched");
            const selfieFetched = sessionStorage.getItem("selfie_fetched");
            const digioStatus = sessionStorage.getItem("digioStatus");
            const kid = sessionStorage.getItem("digioKID");

            let panNumber = "";
            let mobileNumber = "";

            if (parsedsigninDetails) {
                panNumber = parsedsigninDetails.panNumber || "";
                mobileNumber = parsedsigninDetails.mobileNumber || "";
            }

            console.log(panNumber);
            console.log(mobileNumber);

            let response: any = null;
            let profileData: any = null;

            if (digioStatus === "success" && kid && docsFetched !== "1") {
                console.log("Digio success, KID found, docs not yet fetched → continue Digio flow");
            }


            // Case 1: RETURNING FROM DIGIO
            if (digioStatus === "success" && kid) {
                console.log(digioStatus);
                console.log(kid);
                response = await getKIDResponseKYC({ k_id: kid });
                if (!checkTokenValidity(response?.data?.tokenValidity)) return;

                setShowRetryButton(false)
                setIsDigioLocked(false)
                sessionStorage.setItem("docs_fetched", "1")
                sessionStorage.setItem("selfie_fetched", "1")
                sessionStorage.removeItem("digioAttempts")
                sessionStorage.removeItem("digioRetryRequired")

                profileData = response?.data?.data?.KIDResponseData?.digilocker;
                fetchBODetails()
            }

            // Case 2: KYC already fetched, skip Digio
            else if (docsFetched === "1" && selfieFetched === "1") {
                response = await getProfileDetailsKYC({ PAN: panNumber });
                console.log(response);
                if (!checkTokenValidity(response?.data?.tokenValidity)) return;
                profileData = response?.data?.data?.data?.profileData?.digilocker;
                const kraData = response?.data?.data?.data?.kraData;

                if (kraData) {
                    setIsKRAFetched(true);
                    setIsFormEditable(false);
                }
                if (profileData || kraData) {
                    profileData = mergeProfileAndKRA(profileData, kraData);
                }
                fetchBODetails()
            }

            else if (digioStatus === "failed" || digioStatus === "cancel") {
                const attempts = parseInt(sessionStorage.getItem("digioAttempts") || "0", 10);
                if (attempts >= 2) {
                    setIsDigioLocked(true);
                    toast({
                        title: "Too many attempts",
                        description: "You've exceeded the maximum number of attempts.",
                        variant: "destructive"
                    });
                } else {
                    toast({
                        title: "Verification Incomplete",
                        description: "You exited or failed the Digio journey. Please retry.",
                        variant: "destructive"
                    });
                    setShowRetryButton(true); // ✅ UI to let user retry
                }
                sessionStorage.setItem("digioRetryRequired", "1");
                setShowRetryButton(true);

                sessionStorage.removeItem("digioStatus");
                sessionStorage.removeItem("digioKID");
                setIsLoadingProfileData(false);
                return;
            }

            // Case 3: TRIGGER Digio journey
            else if ((docsFetched !== "1" || selfieFetched !== "1") && panNumber && mobileNumber && (!retryRequired || retryForce)) {
                // prevent auto re-init if user hasn't clicked retry
                if ((showRetryButton || isDigioLocked) && !retryForce) {
                    setIsLoadingProfileData(false);
                    return;
                }

                const attempts = parseInt(sessionStorage.getItem("digioAttempts") || "0", 10);

                if (attempts >= 2) {
                    toast({
                        title: "Too many attempts",
                        description: "Digio verification failed multiple times. Please try again later or contact support.",
                        variant: "destructive",
                    });
                    setIsLoadingProfileData(false);
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

                    // Open Digio flow (this will likely navigate away)
                    if (digioInstanceRef.current) {
                        updateStepStatus("signin", "completed");
                        digioInstanceRef.current.init();
                        digioInstanceRef.current.submit(newKid, customer_identifier, access_token);
                    } else {
                        throw new Error("Digio instance not initialized");
                    }
                    return; // Exit here, will continue after redirect
                } else {
                    throw new Error("Invalid response from KID generation API");
                }
            }

            if (!profileData) {
                setIsLoadingProfileData(false);
                return;
            }

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
                email: profileData.email_id || parsedsigninDetails?.email,
                fatherSpouseName: profileData.father_spouse_name || "",

                maritalStatus: profileData?.AdditionalProfileData?.marital_status || "",
                tradingExperience: profileData?.AdditionalProfileData?.trading_experience || "",
                occupationType: profileData?.AdditionalProfileData?.occupationsubtype || "",
                annualIncome: profileData?.AdditionalProfileData?.annual_income || "",
                residentialstatus: profileData?.AdditionalProfileData?.residentialstatus || "",
                application_type: profileData?.AdditionalProfileData?.application_type || "",
                fatherSpouseTitle: profileData?.AdditionalProfileData?.father_spouse_title || "",
                motherFirstName: profileData?.AdditionalProfileData?.mother_first_name || "",
                motherMiddleName: profileData?.AdditionalProfileData?.mother_middle_name || "",
                motherLastName: profileData?.AdditionalProfileData?.mother_last_name || "",
                openFreshAccount: normalizeYesNo(profileData?.AdditionalProfileData?.open_fresh_account),
                politicallyExposed: normalizeYesNo(profileData?.AdditionalProfileData?.politically_exposed),
                bsdaOption: profileData?.AdditionalProfileData?.bsda || "",
                accountSettlement: profileData?.AdditionalProfileData?.account_settlement || "",

                permanentAddressLine1:
                    profileData.aadhaar?.permanent_address_details?.address ||
                    mergeAllAddressLines(profileData.permanent_address) ||
                    "",
                permanentCountry:
                    countryCodes.find((c) => c.value === permanentCountryCode)?.value || "",
                permanentState:
                    stateCodes.find((c) => c.value === permanentStateCode)?.value || "",
                permanentCity: profileData.aadhaar?.permanent_address_details?.district_or_city || profileData.permanent_address?.city || "",
                permanentPincode: profileData.aadhaar?.permanent_address_details?.pincode || profileData.permanent_address?.pin_code || "",

                correspondenceAddressLine1:
                    profileData.aadhaar?.current_address_details?.address ||
                    mergeAllAddressLines(profileData.correspondence_address) ||
                    "",
                correspondenceCountry:
                    countryCodes.find((c) => c.value === correspondenceCountryCode)?.value || "",
                correspondenceCity: profileData.aadhaar?.current_address_details?.district_or_city || profileData.correspondence_address?.city || "",
                correspondenceState:
                    stateCodes.find((c) => c.value === correspondenceStateCode)?.value || "",
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
        } catch (err) {
            console.error("Error fetching profile details:", err);
            toast({
                title: "Error",
                description: "Failed to fetch profile details. Please fill manually.",
                variant: "destructive",
            });
        } finally {
            // Reset session flags
            sessionStorage.removeItem("digioStatus");
            sessionStorage.removeItem("digioKID");
            setIsLoadingProfileData(false);
        }
    }, [parsedsigninDetails, form, checkTokenValidity, fetchBODetails, toast, showRetryButton, isDigioLocked, setKycId, updateStepStatus]);