/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useReactToPrint } from "react-to-print";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/Dashboard/dashboard-layout";
import { useIPO } from "@/contexts/IPOContext";
import Cookies from "js-cookie";

const Printform = () => {
    const { selectedIPO, clientDetails } = useIPO();

    const blackBoxPositions = [110, 190, 250, 430, 490, 530];

    const [applicationno, setApplicationno] = useState(
        clientDetails?.applicationNo || ""
    );
    const [categoryDescription, setCategoryDescription] = useState("");
    const [email, setEmail] = useState("");
    const [dpDetails, setDpDetails] = useState({
        depository: "",
        boid: "",
        dpid: ""
    });

    const [storedDepository, setStoredDepository] = useState("");
    const [calculatedAmount, setCalculatedAmount] = useState(
        clientDetails?.calculatedAmount || "0"
    );
    const [amountInWords, setAmountInWords] = useState("");
    const [calculatedQuantity, setCalculatedQuantity] = useState("0");

    const [checkboxState, setCheckboxState] = useState({
        retailIndividualBidder: false,
        nonInstitutionalBidder: false,
        eligibleShareholders: false,
        qib: false,
        bid: false,
    });

    const userData = useMemo(
        () => ({
            companysymbol: selectedIPO?.companysymbol || "",
            logolink: selectedIPO?.logolink || "",
            selectedcategory: selectedIPO?.category || "",
            email: clientDetails?.clientDetails?.clientDetails?.email || "",
            retailDiscount: "20",
            calculatedAmount: clientDetails?.calculatedAmount || "0",
            calculatedQuantity: clientDetails?.quantity || "",
            cutoffPrice: selectedIPO?.cutoffprice || "",
            // depository: clientDetails?.depositoryId?.startsWith("IN") ? "NSDL" : "CDSL",
            depository: dpDetails.depository || "",
            CDSLboid: clientDetails?.selectedBOID || "",
            // NSDLboid: clientDetails?.selectedBOID.slice(0, 8),
            // NSDLdpid: clientDetails?.depositoryId || "",
            NSDLboid: dpDetails?.boid || "",
            NSDLdpid: dpDetails?.dpid || "",
            AccNo: clientDetails?.bankAccountNO || "",
            BankName: clientDetails?.bankName || "",
            companyname: selectedIPO?.companyname || "",
            companyAddress: selectedIPO?.companyAddress || "",
            isin: selectedIPO?.isin || "",
            appllicationno: clientDetails?.applicationNo || "",
            clientName: clientDetails?.clientDetails?.clientDetails?.clientName || "",
            mobile: clientDetails?.clientDetails?.clientDetails?.mobile || "",
            pan: clientDetails?.clientDetails?.clientDetails?.pan || "",
        }),
        []
    );

    useEffect(() => {
        if (!clientDetails && !selectedIPO) return;

        const {
            selectedcategory,
            email,
            depository,
            calculatedAmount,
            calculatedQuantity,
        } = userData;

        setEmail(email || "");
        setStoredDepository(depository || "");
        setCalculatedAmount(calculatedAmount || "0");
        setAmountInWords(convertToWords(calculatedAmount || "0"));
        setCalculatedQuantity(calculatedQuantity || "0");
        setApplicationno(clientDetails?.applicationNo || "");

        const dpDetails = clientDetails?.clientDetails?.applicantBoId?.find(
            (boidObj) => boidObj.boid === clientDetails.selectedBOID
        );
        setDpDetails(dpDetails);

        // Set category description based on the selected category
        if (selectedcategory === "INDIVIDUAL") {
            setCategoryDescription(
                "FOR RESIDENT INDIAN INVESTORS, INCLUDING RESIDENT QIBs, NON-INSTITUTIONAL BIDDERS, RETAIL INDIVIDUAL BIDDERS AND ELIGIBLE NRIs APPLYING ON A NON-REPATRIATION BASIS"
            );
        } else if (selectedcategory === "SHARE HOLDER") {
            setCategoryDescription(
                "FOR ELIGIBLE SHAREHOLDERS APPLYING IN THE SHAREHOLDERS RESERVATION PORTION"
            );
        } else {
            setCategoryDescription("Category not available");
        }
    }, []);

    useEffect(() => {
        const { selectedcategory, calculatedAmount } = userData;
        const amountAsNumber = parseFloat(calculatedAmount);
        // Update checkbox state based on category and amount
        const updatedState = {
            retailIndividualBidder:
                selectedcategory === "INDIVIDUAL" && amountAsNumber <= 500000,
            nonInstitutionalBidder:
                selectedcategory === "INDIVIDUAL" && amountAsNumber > 500000,
            eligibleShareholders: selectedcategory === "SHARE HOLDER",
            qib: false, // Always disabled
            bid: selectedcategory === "INDIVIDUAL" && amountAsNumber <= 500000,
        };
        setCheckboxState(updatedState);
    }, [userData]);

    const renderBoidValues = (boid: string, isSmall: boolean) => {
        const blockStyle = isSmall
            ? {
                width: "20px",
                height: "20px",
                border: "1px solid grey",
                display: "inline-block",
            }
            : {
                width: "20px",
                height: "20px",
                border: "1px solid grey",
                display: "inline-block",
            };

        return boid.split("").map((digit, index) => (
            <div key={index} style={blockStyle}>
                {digit}
            </div>
        ));
    };

    // Function to convert number to words
    const convertToWords = (num) => {
        const a = [
            "",
            "ONE",
            "TWO",
            "THREE",
            "FOUR",
            "FIVE",
            "SIX",
            "SEVEN",
            "EIGHT",
            "NINE",
            "TEN",
            "ELEVEN",
            "TWELVE",
            "THIRTEEN",
            "FOURTEEN",
            "FIFTEEN",
            "SIXTEEN",
            "SEVENTEEN",
            "EIGHTEEN",
            "NINETEEN",
        ];
        const b = [
            "",
            "",
            "TWENTY",
            "THIRTY",
            "FORTY",
            "FIFTY",
            "SIXTY",
            "SEVENTY",
            "EIGHTY",
            "NINETY",
        ];

        if (isNaN(num)) return "INVALID NUMBER";

        if (num.toString().length > 9) return "OVERFLOW";
        const n = ("000000000" + num)
            .substr(-9)
            .match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);

        if (!n) return "";
        let str = "";
        str +=
            n[1] !== "00"
                ? `${a[+n[1]] || `${b[n[1][0]]} ${a[n[1][1]]}`} CRORE `
                : "";
        str +=
            n[2] !== "00" ? `${a[+n[2]] || `${b[n[2][0]]} ${a[n[2][1]]}`} LAKH ` : "";
        str +=
            n[3] !== "00"
                ? `${a[+n[3]] || `${b[n[3][0]]} ${a[n[3][1]]}`} THOUSAND `
                : "";
        str += n[4] !== "0" ? `${a[n[4]]} HUNDRED ` : "";
        str +=
            n[5] !== "00" ? `AND ${a[+n[5]] || `${b[n[5][0]]} ${a[n[5][1]]}`}` : "";

        const finalResult = `Rupees ${str.trim().toUpperCase()} Only`;
        return finalResult;
    };

    // Render digit blocks
    const renderDigitBlocks = () => {
        // Ensure calculatedAmount is a string
        const paddedAmount = String(calculatedAmount || "").padStart(10, " ");

        return paddedAmount.split("").map((digit, index) => (
            <div
                key={index}
                className="border border-gray-400 w-6 h-6 flex items-center justify-center"
                style={{
                    fontFamily: "Times New Roman, Times, serif",
                    fontSize: "14px",
                }}
            >
                {digit === " " ? "\u00A0" : digit}
            </div>
        ));
    };

    const contentRef = useRef(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        function handleResize() {
            const formWidth = 800; // This should match the min-width you set on the form container
            const windowWidth = window.innerWidth;
            if (windowWidth < formWidth) {
                setScale(windowWidth / formWidth);
            } else {
                setScale(1);
            }
        }

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const reactToPrintFn = useReactToPrint({
        contentRef,
        pageStyle: `
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .print-content {
          transform: scale(1) !important;
          width: 100% !important;
        }
      }
    `,
    });

    return (
        <DashboardLayout>
            <div className="space-y-4">
                <div
                    className="space-y-4 m-4"
                    style={{
                        fontFamily: "Times New Roman, Times, serif",
                        fontWeight: "bold",
                    }}
                >
                    <Button onClick={() => reactToPrintFn()}>Print </Button>

                    <div className="max-w-full overflow-x-auto text-black">
                        <div
                            className="min-w-[800px] origin-top-left print:transform-none"
                            style={{ transform: `scale(${scale})`, width: `${100 / scale}%` }}
                        >
                            <div
                                ref={contentRef}
                                className={`m-4 p-4 print-content min-w-[800px] origin-top-left`}
                                style={{
                                    transform: `scale(${scale})`,
                                    width: `${100 / scale}%`,
                                }}
                            >
                                <div>
                                    <Table className="w-full text-[10px] text-black">
                                        <TableBody>
                                            <TableRow>
                                                {/* First Column: IPO Form Image */}
                                                <TableHead className="p-0 align-top w-[1%] text-left">
                                                    <div className="relative h-[950px]">
                                                        <Image
                                                            src="/images/IPOForm/IPO-FORM-cut.jpg"
                                                            alt="IPO Form"
                                                            layout="fill"
                                                            objectFit="contain"
                                                        />
                                                    </div>
                                                </TableHead>

                                                {/* Second Column: Black Boxes */}
                                                <TableHead className="p-1 align-top w-[1%] text-left">
                                                    <div className="relative h-[880px] w-[12px]">
                                                        {blackBoxPositions.map((position, index) => (
                                                            <div
                                                                key={index}
                                                                className="absolute left-0"
                                                                style={{ top: `${position}px` }}
                                                            >
                                                                <Image
                                                                    src="/images/IPOForm/blackbox.jpg"
                                                                    alt=""
                                                                    width={12}
                                                                    height={12}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </TableHead>

                                                {/* Third Column: IPO Form Image */}
                                                <TableHead className="p-0 align-top w-[99%]">
                                                    <Table className="w-full text-[10px] text-black">
                                                        <TableRow>
                                                            <span className="text-[15px]">
                                                                {userData?.companysymbol}
                                                                {parseFloat(calculatedAmount) >= 500000 &&
                                                                    " - SYNASBA FORM"}
                                                            </span>
                                                        </TableRow>
                                                        {parseFloat(calculatedAmount) >= 500000 && (
                                                            <TableRow>
                                                                <Table className="w-full border border-white text-white bg-[#666666] p-0 border-gray-400">
                                                                    <TableRow>
                                                                        <TableCell className="text-center p-1 border">
                                                                            <span className="text-[10px]text-[12px] font-bold">
                                                                                SYNDICATE ASBA FORM
                                                                            </span>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                </Table>
                                                            </TableRow>
                                                        )}

                                                        <TableRow>
                                                            <TableCell className="h-[2px] p-0"></TableCell>
                                                        </TableRow>

                                                        <TableRow>
                                                            <TableCell className="p-0">
                                                                <Table className="w-full border border-gray-700 bg-gray-300 bg-[#666666] text-white">
                                                                    <TableRow>
                                                                        {/* First Cell */}
                                                                        <TableCell className="w-[200px] text-center align-middle p-2 text-[9px] font-bold leading-tight border border-gray-400 text-white">
                                                                            COMMON BID CUM
                                                                            <br />
                                                                            APPLICATION FORM
                                                                        </TableCell>

                                                                        {/* Second Cell */}
                                                                        <TableCell className="w-[434px] text-center p-2 text-[10px] leading-tight border border-gray-400">
                                                                            <span>{userData?.companyname}</span>
                                                                            <br />
                                                                            <span className="text-[9px]">
                                                                                {userData?.companyAddress}
                                                                            </span>
                                                                        </TableCell>

                                                                        {/* Third Cell */}
                                                                        <TableCell
                                                                            id="categoryDescription"
                                                                            className="w-[200px] text-center p-2 text-[9px] leading-tight border border-gray-400"
                                                                        >
                                                                            {categoryDescription || ""}
                                                                            {/* FOR RESIDENT INDIAN INVESTORS, INCLUDING RESIDENT QIBs,
                                                    NON-INSTITUTIONAL BIDDERS, RETAIL INDIVIDUAL BIDDERS AND
                                                    ELIGIBLE NRIs APPLYING ON A NON-REPATRIATION BASIS */}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                </Table>
                                                            </TableCell>
                                                        </TableRow>

                                                        <Table className="text-[10px] text-black">
                                                            <TableBody>
                                                                <TableRow>
                                                                    {/* Logo Section */}
                                                                    <TableCell className="w-[10%] text-left align-middle p-0">
                                                                        {/* Need to Change Later */}

                                                                        <Image
                                                                            src={
                                                                                userData?.logolink ||
                                                                                "/default-logo.png"
                                                                            }
                                                                            alt="Company Logo"
                                                                            width={100}
                                                                            height={31}
                                                                        />
                                                                    </TableCell>

                                                                    {/* Company Address Section */}
                                                                    <TableCell className="w-[24%] text-left p-0">
                                                                        <span className="text-[10px]text-[11px] font-bold leading-tight">
                                                                            To,
                                                                            <br />
                                                                            The Board Of Directors,
                                                                            <br />
                                                                            {userData?.companyname}
                                                                        </span>
                                                                    </TableCell>

                                                                    {/* 100% Book Built Offer and ISIN Section */}
                                                                    <TableCell className="w-[32%] text-center p-0">
                                                                        <div className="border border-gray-700">
                                                                            <span className="text-[10px]text-[10px] font-bold">
                                                                                100% Book BUILT OFFER
                                                                            </span>
                                                                        </div>
                                                                        <div className="border border-gray-700">
                                                                            <span className="text-[10px]text-[10px] font-bold">
                                                                                ISIN: {userData?.isin}
                                                                            </span>
                                                                        </div>
                                                                    </TableCell>

                                                                    {/* Application Form Section */}
                                                                    <TableCell className="w-[34%] text-center p-1">
                                                                        <div className="flex items-center justify-center space-x-4">
                                                                            <span className="w-[30%]text-[12px] text-gray-800 font-semibold text-left">
                                                                                Bid Cum
                                                                                <br />
                                                                                Application
                                                                                <br />
                                                                                Form No.
                                                                            </span>
                                                                            <div className="w-[100%] border border-gray-700 py-2 mt-2 bg-gray-50">
                                                                                <span className="text-[20px] text-gray-800 font-bold">
                                                                                    {userData?.appllicationno}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            </TableBody>
                                                        </Table>

                                                        <Table className="w-full text-[10px] text-black">
                                                            <TableBody>
                                                                <TableRow>
                                                                    <TableCell className="w-[60%] align-top p-0 pr-1">
                                                                        <Table className="w-full border border-gray-700">
                                                                            <TableBody>
                                                                                {/* Data Row */}
                                                                                <TableRow className="bg-gray-300">
                                                                                    {/* First Block */}
                                                                                    <TableCell className="text-center bg-[#666666] p-0 border-r border-gray-400">
                                                                                        <span className="text-white text-[10px] font-bold">
                                                                                            SYNDICATE MEMBER`S STAMP CODE
                                                                                        </span>
                                                                                    </TableCell>

                                                                                    {/* Second Block */}
                                                                                    <TableCell className="text-center bg-[#666666] p-0">
                                                                                        <span className="text-white text-[10px] font-bold">
                                                                                            BROKER/SCSB/DP/RTA STAMP CODE
                                                                                        </span>
                                                                                    </TableCell>
                                                                                </TableRow>

                                                                                {/* Empty Box Row */}
                                                                                <TableRow>
                                                                                    {/* First Empty Box */}
                                                                                    <TableCell className="h-[30px] border border-gray-400" />

                                                                                    {/* Second Empty Box */}
                                                                                    <TableCell className="h-[30px] border border-gray-400" />
                                                                                </TableRow>
                                                                                <TableRow className="bg-gray-300">
                                                                                    {/* First Block */}
                                                                                    <TableCell className="text-center bg-[#666666] p-0 border-r border-gray-400">
                                                                                        <span className="text-white text-[10px] font-bold">
                                                                                            SUB-BROKER`S / SUB-AGENT`S STAMP
                                                                                            CODE
                                                                                        </span>
                                                                                    </TableCell>

                                                                                    {/* Second Block */}
                                                                                    <TableCell className="text-center bg-[#666666] p-0">
                                                                                        <span className="text-white text-[10px] font-bold">
                                                                                            ESCROW BANK/SCSB BRANCH STAMP CODE
                                                                                        </span>
                                                                                    </TableCell>
                                                                                </TableRow>

                                                                                {/* Empty Box Row */}
                                                                                <TableRow>
                                                                                    {/* First Empty Box */}
                                                                                    <TableCell className="h-[30px] border border-gray-400" />

                                                                                    {/* Second Empty Box */}
                                                                                    <TableCell className="h-[30px] border border-gray-400" />
                                                                                </TableRow>
                                                                                <TableRow className="bg-gray-300">
                                                                                    {/* First Block */}
                                                                                    <TableCell className="text-center bg-[#666666] p-0 border-r border-gray-400">
                                                                                        <span className="text-white text-[10px] font-bold">
                                                                                            BANK BRANCH SERIAL NO.
                                                                                        </span>
                                                                                    </TableCell>

                                                                                    {/* Second Block */}
                                                                                    <TableCell className="text-center bg-[#666666] p-0">
                                                                                        <span className="text-white text-[10px] font-bold">
                                                                                            SCSB SERIAL NO.
                                                                                        </span>
                                                                                    </TableCell>
                                                                                </TableRow>

                                                                                {/* Empty Box Row */}
                                                                                <TableRow>
                                                                                    {/* First Empty Box */}
                                                                                    <TableCell className="h-[30px] border border-gray-400" />

                                                                                    {/* Second Empty Box */}
                                                                                    <TableCell className="h-[30px] border border-gray-400" />
                                                                                </TableRow>
                                                                            </TableBody>
                                                                        </Table>
                                                                    </TableCell>

                                                                    <TableCell className="w-[40%] align-top p-0">
                                                                        <Table className="w-full border border-gray-700">
                                                                            <TableBody>
                                                                                <TableRow className="bg-gray-300">
                                                                                    <TableCell
                                                                                        colSpan={2}
                                                                                        className="text-left bg-[#666666] p-0 px-2"
                                                                                    >
                                                                                        <span className="text-white text-[10px] font-bold">
                                                                                            1. NAME & CONTACT DETAILS OF SOLE
                                                                                            / FIRST BIDDER
                                                                                        </span>
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                                <TableRow className="w-full">
                                                                                    <div className="flex justify-between items-center">
                                                                                        <TableCell className="w-[20%] text-[10px] font-bold p-0 px-2">
                                                                                            Mr / Ms.
                                                                                        </TableCell>
                                                                                        <TableCell className="w-[100%] p-0">
                                                                                            <div className="flex">
                                                                                                {/* Dynamically render the client name with character blocks */}
                                                                                                {userData?.clientName
                                                                                                    ?.padEnd(18, " ")
                                                                                                    .split("")
                                                                                                    .map((char, i) => (
                                                                                                        <div
                                                                                                            key={i}
                                                                                                            className="border-l border-b border-gray-400 flex-1 flex items-center justify-center text-gray-900"
                                                                                                            style={{
                                                                                                                fontFamily:
                                                                                                                    "Times New Roman, Times, serif",
                                                                                                                fontSize: "10px",
                                                                                                            }}
                                                                                                        >
                                                                                                            {char === " "
                                                                                                                ? "\u00A0"
                                                                                                                : char}{" "}
                                                                                                            {/* Render non-breaking space for blanks */}
                                                                                                        </div>
                                                                                                    ))}
                                                                                            </div>
                                                                                        </TableCell>
                                                                                    </div>
                                                                                </TableRow>
                                                                                <TableRow>
                                                                                    <TableCell
                                                                                        colSpan={2}
                                                                                        className="h-[30px]"
                                                                                    >
                                                                                        <div className="flex">
                                                                                            {/* Simulate the character blocks */}
                                                                                            {[...Array(25)].map((_, i) => (
                                                                                                <div
                                                                                                    key={i}
                                                                                                    className="border border-gray-400 flex items-center justify-center w-6 h-6 text-gray-900 text-[10px] font-medium"
                                                                                                >
                                                                                                    {/* Placeholder character */}
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                                <TableRow>
                                                                                    <TableCell className="w-full p-0">
                                                                                        <div className="flex justify-between items-center">
                                                                                            <span className="text-[10px] font-bold px-2">
                                                                                                Address:
                                                                                            </span>
                                                                                            <div className="w-full h-4 border-b border-gray-400" />
                                                                                        </div>
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                                <TableRow>
                                                                                    <TableCell className="w-full p-0">
                                                                                        <div className="flex justify-between items-center">
                                                                                            <span className="text-[10px] font-bold px-2">
                                                                                                Email:
                                                                                            </span>
                                                                                            <div className="w-full h-4 border-b border-gray-400">
                                                                                                {email || ""}
                                                                                            </div>
                                                                                        </div>
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                                <TableRow>
                                                                                    <TableCell className="w-full p-0 px-2">
                                                                                        <Table className="w-full">
                                                                                            <TableBody>
                                                                                                <TableRow>
                                                                                                    <TableCell className="w-[80%] text-[10px] font-bold p-0">
                                                                                                        Tel. No (with STD code) /
                                                                                                        Mobile
                                                                                                    </TableCell>
                                                                                                    <TableCell className="w-[56%]">
                                                                                                        <div className="flex">
                                                                                                            {/* Dynamically render the mobile number blocks */}
                                                                                                            {(
                                                                                                                userData?.mobile ||
                                                                                                                "null"
                                                                                                            )
                                                                                                                .padEnd(10, " ")
                                                                                                                .split("")
                                                                                                                .map((char, i) => (
                                                                                                                    <div
                                                                                                                        key={i}
                                                                                                                        className="border-l border-b border-gray-400 w-5 h-4 flex items-center justify-center"
                                                                                                                        style={{
                                                                                                                            fontFamily:
                                                                                                                                "Times New Roman, Times, serif",
                                                                                                                            fontSize: "10px",
                                                                                                                        }}
                                                                                                                    >
                                                                                                                        {char === " "
                                                                                                                            ? "\u00A0"
                                                                                                                            : char}{" "}
                                                                                                                        {/* Render non-breaking space for blanks */}
                                                                                                                    </div>
                                                                                                                ))}
                                                                                                        </div>
                                                                                                    </TableCell>
                                                                                                </TableRow>
                                                                                            </TableBody>
                                                                                        </Table>
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                                <TableRow className="bg-[#666666]">
                                                                                    <TableCell className="text-white text-[10px] font-bold p-0 px-2">
                                                                                        2. PAN OF SOLE / FIRST BIDDER
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                                <TableRow className="w-full p-0">
                                                                                    <TableCell className="w-full p-0">
                                                                                        <div className="flex justify-between">
                                                                                            {/* Render the PAN blocks */}
                                                                                            {(userData?.pan || "null")
                                                                                                .padEnd(10, " ")
                                                                                                .split("")
                                                                                                .map((char, i) => (
                                                                                                    <div
                                                                                                        key={i}
                                                                                                        className="w-full h-5 border border-gray-400 flex items-center justify-center"
                                                                                                        style={{
                                                                                                            flex: 1,
                                                                                                            fontFamily:
                                                                                                                "Times New Roman, Times, serif",
                                                                                                            fontSize: "10px",
                                                                                                        }}
                                                                                                    >
                                                                                                        {char === " "
                                                                                                            ? "\u00A0"
                                                                                                            : char}{" "}
                                                                                                        {/* Render non-breaking space for blanks */}
                                                                                                    </div>
                                                                                                ))}
                                                                                        </div>
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            </TableBody>
                                                                        </Table>
                                                                    </TableCell>
                                                                </TableRow>
                                                            </TableBody>
                                                        </Table>

                                                        <Table className="w-full flex items-stretch text-[10px] text-black">
                                                            <div className="w-[80%] m-1">
                                                                <Table className="w-full border border-black table-fixed flex flex-col">
                                                                    {/* Header Row - Includes Checkboxes */}
                                                                    <TableRow className="bg-[#666666] text-white border border-gray-400">
                                                                        <TableCell
                                                                            colSpan={16}
                                                                            className="p-0.5 text-[10] font-bold text-center border border-gray-500"
                                                                            style={{
                                                                                fontSize: "10px",
                                                                                fontFamily:
                                                                                    "Times New Roman, Times, serif",
                                                                                textAlign: "center",
                                                                                verticalAlign: "middle",
                                                                            }}
                                                                        >
                                                                            <div className="flex items-center justify-between">
                                                                                <span>
                                                                                    3. BIDDER’S DEPOSITORY ACCOUNT DETAILS
                                                                                </span>
                                                                                <div className="flex gap-10">
                                                                                    <label
                                                                                        htmlFor="NSDL"
                                                                                        className="flex items-center text-xs"
                                                                                    >
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            id="NSDL"
                                                                                            name="depositoryOption"
                                                                                            value="NSDL"
                                                                                            className="mr-1"
                                                                                            checked={
                                                                                                dpDetails?.depository === "NSDL"
                                                                                            }
                                                                                            disabled
                                                                                        />
                                                                                        NSDL
                                                                                    </label>
                                                                                    <label
                                                                                        htmlFor="CDSL"
                                                                                        className="flex items-center text-xs"
                                                                                    >
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            id="CDSL"
                                                                                            name="depositoryOption"
                                                                                            value="CDSL"
                                                                                            className="mr-1"
                                                                                            checked={
                                                                                                dpDetails?.depository === "CDSL"
                                                                                            }
                                                                                            disabled
                                                                                        />
                                                                                        CDSL
                                                                                    </label>
                                                                                </div>
                                                                            </div>
                                                                        </TableCell>
                                                                    </TableRow>

                                                                    <TableRow className="bg-white-200  flex">
                                                                        {Array.from({ length: 16 }).map(
                                                                            (_, index) => {
                                                                                let dynamicValue = ""; // Default empty string

                                                                                // Fill the columns with the BOID data
                                                                                if (
                                                                                    dpDetails?.depository === "CDSL" &&
                                                                                    userData.CDSLboid
                                                                                ) {
                                                                                    dynamicValue =
                                                                                        userData.CDSLboid[index] || "";
                                                                                } else if (
                                                                                    dpDetails?.depository === "NSDL" &&
                                                                                    userData.NSDLdpid &&
                                                                                    userData.NSDLboid
                                                                                ) {
                                                                                    dynamicValue =
                                                                                        index < 8
                                                                                            ? userData.NSDLdpid[index] || ""
                                                                                            : userData.NSDLboid[index - 8] ||
                                                                                            "";
                                                                                }

                                                                                return (
                                                                                    <TableCell
                                                                                        key={index}
                                                                                        className="p-0.5 text-xs text-center border border-black text-black flex-1 w-6 h-6" // Each column gets 1/16th of the width
                                                                                    >
                                                                                        {dynamicValue}
                                                                                    </TableCell>
                                                                                );
                                                                            }
                                                                        )}
                                                                    </TableRow>

                                                                    {/* Footer Row - Full Width */}
                                                                    <TableRow className="bg-gray-300 border border-black">
                                                                        <TableCell
                                                                            colSpan={15}
                                                                            className="p-0.5 text-xs  font-bold text-left text-black border border-gray-300"
                                                                            style={{
                                                                                fontSize: "9px",
                                                                                fontFamily:
                                                                                    "Times New Roman, Times, serif",
                                                                                // textAlign: "left",
                                                                                // verticalAlign: "top", // Aligns text to the top
                                                                            }}
                                                                        >
                                                                            <span>
                                                                                For NSDL enter 8-digit DP ID followed by
                                                                                8-digit Client ID / For CDSL enter
                                                                                16-digit Client ID
                                                                            </span>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                </Table>

                                                                <Table className="w-full flex gap-1 my-1 overflow-hidden">
                                                                    <div className="w-full">
                                                                        <Table className="w-full text-[10px]">
                                                                            <TableRow className="bg-[#666666] text-white">
                                                                                <TableCell className="p-0 py-1  font-bold text-left  w-full">
                                                                                    <span>
                                                                                        4. BID OPTIONS (ONLY RETAIL
                                                                                        INDIVIDUAL BIDDERS CAN BID AT
                                                                                        "CUT-OFF ")
                                                                                    </span>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                            <TableCell colSpan={2} className="p-0">
                                                                                <Table className="w-full mt-1 table-fixed">
                                                                                    {/* Table Header */}
                                                                                    <TableHead className="w-full p-0 text-[11px]">
                                                                                        <TableRow className="w-full text-black">
                                                                                            <TableCell
                                                                                                className="p-0 w-[15%] text-center truncate border border-gray-700 text-[11px]"
                                                                                                rowSpan={3}
                                                                                            >
                                                                                                Bid Options
                                                                                            </TableCell>
                                                                                            <TableCell
                                                                                                className="p-0 w-[30%] border border-gray-700 text-center truncate"
                                                                                                rowSpan={2}
                                                                                            >
                                                                                                No. of Equity Shares Bid <br />
                                                                                                (In Figures) <br />
                                                                                                (Bids must be in multiples of
                                                                                                Bid Lot as advertised)
                                                                                            </TableCell>
                                                                                            <TableCell
                                                                                                className="p-0 border border-gray-700 text-center truncate"
                                                                                                colSpan={4}
                                                                                            >
                                                                                                Price per Equity Share (Rs)/
                                                                                                "Cut-off" <br />
                                                                                                (Price in multiples of 1/- only)
                                                                                                (In Figures)
                                                                                            </TableCell>
                                                                                        </TableRow>

                                                                                        <TableRow
                                                                                            className="p-0 w-full text-black"
                                                                                            style={{
                                                                                                fontFamily:
                                                                                                    "Times New Roman, Times, serif",
                                                                                                fontSize: "10px",
                                                                                            }}
                                                                                        >
                                                                                            <TableCell className="p-0 w-[15%] border border-gray-700 text-center truncate">
                                                                                                Bid Price
                                                                                            </TableCell>
                                                                                            <TableCell className="p-0 w-[16%] border border-gray-700 text-center truncate">
                                                                                                Retail Discount
                                                                                            </TableCell>
                                                                                            <TableCell className="p-0 w-[16%] border border-gray-700 text-center truncate">
                                                                                                Net Price
                                                                                            </TableCell>
                                                                                            <TableCell
                                                                                                className="p-0 w-[8%] text-center border border-gray-700 truncate"
                                                                                                rowSpan={2}
                                                                                            >
                                                                                                Cut Off <br /> (Please Tick)
                                                                                            </TableCell>
                                                                                        </TableRow>

                                                                                        <TableRow className="text-black">
                                                                                            <TableCell className="p-1 w-[30%] border border-gray-700 text-center">
                                                                                                <div className="flex flex-wrap">
                                                                                                    {[...Array(8)].map((_, i) => (
                                                                                                        <div
                                                                                                            key={i}
                                                                                                            className="border-l border-b border-gray-400 w-5 h-4 flex flex-1 items-center justify-center p-1"
                                                                                                            style={{
                                                                                                                fontFamily:
                                                                                                                    "Times New Roman, Times, serif",
                                                                                                                fontSize: "8px",
                                                                                                                padding: "2px",
                                                                                                            }}
                                                                                                        >
                                                                                                            <span className="p-3">
                                                                                                                {8 - i}
                                                                                                            </span>
                                                                                                        </div>
                                                                                                    ))}
                                                                                                </div>
                                                                                            </TableCell>

                                                                                            {[...Array(3)].map(
                                                                                                (_, colIdx) => (
                                                                                                    <TableCell
                                                                                                        key={colIdx}
                                                                                                        className="p-0 border border-gray-700 text-center pl-1"
                                                                                                    >
                                                                                                        <div className="flex flex-wrap">
                                                                                                            {[...Array(4)].map(
                                                                                                                (_, i) => (
                                                                                                                    <div
                                                                                                                        key={i}
                                                                                                                        className="border-l border-b border-gray-400 w-5 h-4 flex flex-1 items-center justify-center p-1"
                                                                                                                        style={{
                                                                                                                            fontFamily:
                                                                                                                                "Times New Roman, Times, serif",
                                                                                                                            fontSize: "8px",
                                                                                                                            padding: "2px",
                                                                                                                        }}
                                                                                                                    >
                                                                                                                        {4 - i}
                                                                                                                    </div>
                                                                                                                )
                                                                                                            )}
                                                                                                        </div>
                                                                                                    </TableCell>
                                                                                                )
                                                                                            )}
                                                                                        </TableRow>

                                                                                        {/* Option 1 row */}
                                                                                        <TableRow className="text-black">
                                                                                            <TableCell className="p-1 w-[15%] border border-gray-700">
                                                                                                Option 1
                                                                                            </TableCell>

                                                                                            <TableCell className="p-1 w-[30%] border border-gray-700 text-center">
                                                                                                <div className="flex">
                                                                                                    {String(calculatedQuantity)
                                                                                                        .padStart(8, " ")
                                                                                                        .split("")
                                                                                                        .map((digit, i) => (
                                                                                                            <div
                                                                                                                key={i}
                                                                                                                className="border-l border-b border-gray-400 w-5 h-4 flex flex-1 items-center justify-center"
                                                                                                                style={{
                                                                                                                    fontFamily:
                                                                                                                        "Times New Roman, Times, serif",
                                                                                                                    fontSize: "8px",
                                                                                                                    padding: "2px",
                                                                                                                }}
                                                                                                            >
                                                                                                                {digit === " "
                                                                                                                    ? "\u00A0" /* Render a non-breaking space for blank */
                                                                                                                    : digit}
                                                                                                            </div>
                                                                                                        ))}
                                                                                                </div>
                                                                                            </TableCell>

                                                                                            <TableCell className="p-1 w-[30%] border border-gray-700 text-center">
                                                                                                <div className="flex">
                                                                                                    {String(userData?.cutoffPrice)
                                                                                                        .padStart(4, " ")
                                                                                                        .split("")
                                                                                                        .map((digit, i) => (
                                                                                                            <div
                                                                                                                key={i}
                                                                                                                className="border-l border-b border-gray-400 w-5 h-4 flex flex-1 items-center justify-center"
                                                                                                                style={{
                                                                                                                    fontFamily:
                                                                                                                        "Times New Roman, Times, serif",
                                                                                                                    fontSize: "8px",
                                                                                                                    padding: "2px",
                                                                                                                }}
                                                                                                            >
                                                                                                                {digit === " "
                                                                                                                    ? "\u00A0" /* Render a non-breaking space for blank */
                                                                                                                    : digit}
                                                                                                            </div>
                                                                                                        ))}
                                                                                                </div>
                                                                                            </TableCell>

                                                                                            <TableCell className="p-1 w-[30%] border border-gray-700 text-center">
                                                                                                <div className="flex">
                                                                                                    {String(
                                                                                                        userData?.retailDiscount ||
                                                                                                        ""
                                                                                                    )
                                                                                                        .padStart(4, " ")
                                                                                                        .split("")
                                                                                                        .map((digit, i) => (
                                                                                                            <div
                                                                                                                key={i}
                                                                                                                className="border-l border-b border-gray-400 w-5 h-4 flex flex-1 items-center justify-center"
                                                                                                                style={{
                                                                                                                    fontFamily:
                                                                                                                        "Times New Roman, Times, serif",
                                                                                                                    fontSize: "8px",
                                                                                                                    padding: "2px",
                                                                                                                }}
                                                                                                            >
                                                                                                                {digit === " "
                                                                                                                    ? "\u00A0" /* Render a non-breaking space for blank */
                                                                                                                    : digit}
                                                                                                            </div>
                                                                                                        ))}
                                                                                                </div>
                                                                                            </TableCell>

                                                                                            <TableCell className="p-1 w-[30%] border border-gray-700 text-center">
                                                                                                <div className="flex">
                                                                                                    {String(userData?.cutoffPrice)
                                                                                                        .padStart(4, " ")
                                                                                                        .split("")
                                                                                                        .map((digit, i) => (
                                                                                                            <div
                                                                                                                key={i}
                                                                                                                className="border-l border-b border-gray-400 w-5 h-4 flex flex-1 items-center justify-center"
                                                                                                                style={{
                                                                                                                    fontFamily:
                                                                                                                        "Times New Roman, Times, serif",
                                                                                                                    fontSize: "8px",
                                                                                                                    padding: "2px",
                                                                                                                }}
                                                                                                            >
                                                                                                                {digit === " "
                                                                                                                    ? "\u00A0" /* Render a non-breaking space for blank */
                                                                                                                    : digit}
                                                                                                            </div>
                                                                                                        ))}
                                                                                                </div>
                                                                                            </TableCell>

                                                                                            <TableCell className="p-1 border border-gray-700 text-center">
                                                                                                <Input
                                                                                                    type="checkbox"
                                                                                                    className="h-4 w-4"
                                                                                                    disabled
                                                                                                    checked={checkboxState.qib}
                                                                                                />
                                                                                            </TableCell>
                                                                                        </TableRow>

                                                                                        {/* Option 2 row */}
                                                                                        <TableRow className="text-black">
                                                                                            <TableCell className="p-0.5 w-[15%] border border-gray-700">
                                                                                                <span className="text-[9px]">
                                                                                                    (OR){" "}
                                                                                                </span>
                                                                                                Option 2
                                                                                            </TableCell>
                                                                                            <TableCell className="p-1 w-[30%] border border-gray-700 text-center">
                                                                                                <div className="flex">
                                                                                                    {[...Array(8)].map((_, i) => (
                                                                                                        <div
                                                                                                            key={i}
                                                                                                            className="border-l border-b border-gray-400 w-5 h-4 flex-1 flex items-center justify-center"
                                                                                                        />
                                                                                                    ))}
                                                                                                </div>
                                                                                            </TableCell>
                                                                                            {[...Array(3)].map(
                                                                                                (_, colIdx) => (
                                                                                                    <TableCell
                                                                                                        key={colIdx}
                                                                                                        className="p-1 border border-gray-700 text-center"
                                                                                                    >
                                                                                                        <div className="flex">
                                                                                                            {[...Array(4)].map(
                                                                                                                (_, i) => (
                                                                                                                    <div
                                                                                                                        key={i}
                                                                                                                        className="border-l border-b border-gray-400 w-5 h-4 flex-1 flex items-center justify-center"
                                                                                                                    />
                                                                                                                )
                                                                                                            )}
                                                                                                        </div>
                                                                                                    </TableCell>
                                                                                                )
                                                                                            )}
                                                                                            <TableCell className="p-1 border border-gray-700 text-center">
                                                                                                <Input
                                                                                                    type="checkbox"
                                                                                                    className="h-4 w-4"
                                                                                                    disabled
                                                                                                />
                                                                                            </TableCell>
                                                                                        </TableRow>

                                                                                        {/* Option 3 row */}
                                                                                        <TableRow className="text-black">
                                                                                            <TableCell className="p-0.5 w-[15%] border border-gray-700">
                                                                                                {" "}
                                                                                                <span className="text-[9px]">
                                                                                                    (OR){" "}
                                                                                                </span>
                                                                                                Option 3
                                                                                            </TableCell>
                                                                                            <TableCell className="p-1 w-[30%] border border-gray-700 text-center">
                                                                                                <div className="flex">
                                                                                                    {[...Array(8)].map((_, i) => (
                                                                                                        <div
                                                                                                            key={i}
                                                                                                            className="border-l border-b border-gray-400 w-5 h-4 flex-1 flex items-center justify-center"
                                                                                                        />
                                                                                                    ))}
                                                                                                </div>
                                                                                            </TableCell>
                                                                                            {[...Array(3)].map(
                                                                                                (_, colIdx) => (
                                                                                                    <TableCell
                                                                                                        key={colIdx}
                                                                                                        className="p-1 border border-gray-700 text-center"
                                                                                                    >
                                                                                                        <div className="flex">
                                                                                                            {[...Array(4)].map(
                                                                                                                (_, i) => (
                                                                                                                    <div
                                                                                                                        key={i}
                                                                                                                        className="border-l border-b border-gray-400 w-5 h-4 flex-1 flex items-center justify-center"
                                                                                                                    />
                                                                                                                )
                                                                                                            )}
                                                                                                        </div>
                                                                                                    </TableCell>
                                                                                                )
                                                                                            )}
                                                                                            <TableCell className="p-1 border border-gray-700 ">
                                                                                                <Input
                                                                                                    type="checkbox"
                                                                                                    className="h-4 w-4 "
                                                                                                    disabled
                                                                                                />
                                                                                            </TableCell>
                                                                                        </TableRow>
                                                                                    </TableHead>
                                                                                </Table>
                                                                            </TableCell>
                                                                        </Table>
                                                                    </div>

                                                                    <div className="overflow-hidden border border-gray-700">
                                                                        <Table className="w-full overflow-hidden text-black">
                                                                            <TableRow className="bg-[#666666] text-white">
                                                                                <TableCell className="p-0 py-1 text-[10px] font-bold text-left">
                                                                                    <span>5.Category</span>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                            <TableRow className="flex flex-col items-center justify-center w-[98%]">
                                                                                <TableCell className="py-1 pl-1 text-xs text-left flex items-center w-full">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        id="Retail_Individual_Bidder"
                                                                                        name="depositoryOption"
                                                                                        value="Retail_Individual_Bidder"
                                                                                        checked={
                                                                                            checkboxState.retailIndividualBidder
                                                                                        }
                                                                                        className="mr-1"
                                                                                        disabled
                                                                                    />
                                                                                    <label
                                                                                        htmlFor="Retail_Individual_Bidder"
                                                                                        className="text-xs pl-1"
                                                                                    >
                                                                                        Retail Individual Bidder
                                                                                    </label>
                                                                                </TableCell>
                                                                                <TableCell className="py-2 pl-1 text-xs text-left flex items-center w-full">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        id="Non_Institutional_Bidder"
                                                                                        name="depositoryOption"
                                                                                        value="Non_Institutional_Bidder"
                                                                                        checked={
                                                                                            checkboxState.nonInstitutionalBidder
                                                                                        }
                                                                                        className="mr-1"
                                                                                        disabled
                                                                                    />
                                                                                    <label
                                                                                        htmlFor="Non_Institutional_Bidder"
                                                                                        className="text-xs pl-1"
                                                                                    >
                                                                                        Non-Institutional Bidder
                                                                                    </label>
                                                                                </TableCell>
                                                                                <TableCell className="py-2 pl-1 text-xs text-left flex items-center w-full">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        id="Eligible_Shareholders"
                                                                                        name="depositoryOption"
                                                                                        value="Eligible_Shareholders"
                                                                                        checked={
                                                                                            checkboxState.eligibleShareholders
                                                                                        }
                                                                                        className="mr-1"
                                                                                        disabled
                                                                                    />
                                                                                    <label
                                                                                        htmlFor="Eligible_Shareholders"
                                                                                        className="text-xs pl-1"
                                                                                    >
                                                                                        Eligible Shareholders
                                                                                    </label>
                                                                                </TableCell>
                                                                                <TableCell className="py-2 pl-1 text-xs text-left flex items-center w-full">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        id="QIB"
                                                                                        name="depositoryOption"
                                                                                        checked={checkboxState.qib}
                                                                                        value="QIB"
                                                                                        className="mr-1"
                                                                                        disabled
                                                                                    />
                                                                                    <label
                                                                                        htmlFor="QIB"
                                                                                        className="text-xs pl-1"
                                                                                    >
                                                                                        QIB
                                                                                    </label>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        </Table>
                                                                    </div>
                                                                </Table>
                                                            </div>

                                                            <div className="w-[20%] m-1">
                                                                <Table className="w-auto border border-gray-700 text-[10px] text-black">
                                                                    <TableRow className="bg-[#666666] text-white">
                                                                        <TableCell className="p-0 px-2 text-[10px] font-bold text-left w-[35%]">
                                                                            <span>6. INVESTOR STATUS</span>
                                                                        </TableCell>
                                                                    </TableRow>

                                                                    {/* Individual Selection */}
                                                                    <TableRow className="border-none px-2">
                                                                        <TableCell className="py-2 px-3 text-left p-0">
                                                                            <div className="flex items-center gap-2 px-2">
                                                                                <div
                                                                                    className="flex items-center justify-center border border-gray-500"
                                                                                    style={{
                                                                                        width: "12px",
                                                                                        height: "12px",
                                                                                        fontSize: "10px",
                                                                                        fontWeight: "bold",
                                                                                    }}
                                                                                >
                                                                                    {userData?.selectedcategory ===
                                                                                        "INDIVIDUAL"
                                                                                        ? "✔"
                                                                                        : ""}
                                                                                </div>
                                                                                <span
                                                                                    style={{
                                                                                        fontFamily:
                                                                                            "Times New Roman, Times, serif",
                                                                                        fontSize: "10px",
                                                                                    }}
                                                                                >
                                                                                    Individual(s) - IND
                                                                                </span>
                                                                            </div>
                                                                        </TableCell>
                                                                    </TableRow>

                                                                    {/* Other Categories */}
                                                                    {[
                                                                        "Hindu Undivided Family# - HUF",
                                                                        "Bodies Corporate - CO",
                                                                        "Banks Financial Institutions - FI",
                                                                        "Mutual Funds - MF",
                                                                        "Non-Resident Indians - NRI (Non-Repatriation basis)",
                                                                        "National Investment Fund - NIF",
                                                                        "Insurance Funds - IF",
                                                                        "Insurance Companies - IC",
                                                                        "Venture Capital Funds - VCF",
                                                                        "Alternative Investment Funds - AIF",
                                                                        "Others (Please specify) - OTH",
                                                                    ].map((status, index) => (
                                                                        <TableRow
                                                                            key={index}
                                                                            className="border-none"
                                                                        >
                                                                            <TableCell className="py-2 px-3 text-left p-0">
                                                                                <div className="flex items-center gap-2 px-2">
                                                                                    <div
                                                                                        className="flex items-center justify-center border border-gray-500"
                                                                                        style={{
                                                                                            width: "12px",
                                                                                            height: "12px",
                                                                                            fontSize: "10px",
                                                                                            fontWeight: "bold",
                                                                                        }}
                                                                                    >
                                                                                        {userData?.selectedcategory !==
                                                                                            "INDIVIDUAL" &&
                                                                                            status.includes("OTH")
                                                                                            ? "✔"
                                                                                            : ""}
                                                                                    </div>
                                                                                    <span
                                                                                        style={{
                                                                                            fontFamily:
                                                                                                "Times New Roman, Times, serif",
                                                                                            fontSize: "10px",
                                                                                        }}
                                                                                    >
                                                                                        {status}
                                                                                    </span>
                                                                                </div>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}

                                                                    {/* HUF Notice */}
                                                                    <TableRow className="border-none px-2">
                                                                        <TableCell className="py-2 px-3 text-left p-0">
                                                                            <div className="flex items-center gap-2">
                                                                                <span
                                                                                    style={{
                                                                                        fontFamily:
                                                                                            "Times New Roman, Times, serif",
                                                                                        fontSize: "6px",
                                                                                    }}
                                                                                >
                                                                                    #HUF should apply only through Karta
                                                                                    (Application by HUF would be treated
                                                                                    on par with Individual)
                                                                                </span>
                                                                            </div>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                </Table>
                                                            </div>
                                                        </Table>

                                                        <Table className="bg-[#666666] text-black text-[10px]">
                                                            <TableCell className="p-0 py-2 text-[10px] text-white font-bold text-left w-[35%]">
                                                                <span>7. PAYMENT DETAILS</span>
                                                            </TableCell>
                                                            <TableRow className="w-[65%] text-white flex items-center justify-between">
                                                                PAYMENT OPTION:
                                                                <TableCell className="p-2 text-[10px] text-left">
                                                                    <input
                                                                        type="checkbox"
                                                                        id="FULL_PAYMENT"
                                                                        name="depositoryOption"
                                                                        value="FULL_PAYMENT"
                                                                        className="mr-1"
                                                                        checked
                                                                    />
                                                                    <label
                                                                        htmlFor="FULL_PAYMENT"
                                                                        className="text-[10px]"
                                                                    >
                                                                        FULL PAYMENT
                                                                    </label>
                                                                </TableCell>
                                                                <TableCell className="p-2 text-[10px] text-left">
                                                                    <input
                                                                        type="checkbox"
                                                                        id="PART_PAYMENT"
                                                                        name="depositoryOption"
                                                                        value="PART_PAYMENT"
                                                                        className="mr-1"
                                                                        checked={false}
                                                                    />
                                                                    <label
                                                                        htmlFor="PART_PAYMENT"
                                                                        className="text-[10px]"
                                                                    >
                                                                        PART PAYMENT
                                                                    </label>
                                                                </TableCell>
                                                            </TableRow>
                                                        </Table>

                                                        <Table className="w-full max-w-full overflow-x-auto text-black text-[10px] border border-black">
                                                            <TableRow className="w-full flex items-center border-none">
                                                                {/* Amount paid in figures */}
                                                                <TableCell className="text-[11px] text-left py-2 px-3 w-1/3">
                                                                    Amount paid (`in figures):
                                                                </TableCell>
                                                                <TableCell className="flex-grow w-2/5">
                                                                    <div className="flex w-full">
                                                                        {renderDigitBlocks()}
                                                                    </div>
                                                                </TableCell>

                                                                {/* Amount in words */}
                                                                <TableCell className="text-[11px] text-left font-bold py-1 px-3 w-1/3">
                                                                    Rs in words:
                                                                </TableCell>
                                                                <TableCell className="w-full">
                                                                    <div className="text-[10px] text-[10px]font-bold text-gray-800">
                                                                        {amountInWords}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>

                                                            <TableRow className="w-full flex border-none">
                                                                <TableCell className="text-[10px] text-left font-bold py-1 px-3 w-1/5 border-none">
                                                                    ASBA Bank A/c No.:
                                                                </TableCell>
                                                                <TableCell colSpan={4}>
                                                                    <div className="flex w-full">
                                                                        {userData?.AccNo &&
                                                                            userData?.AccNo?.padEnd(30, " ")
                                                                                .split("")
                                                                                .map((digit, index) => (
                                                                                    <div
                                                                                        key={index}
                                                                                        className="border border-gray-400 w-6 h-6 flex items-center justify-center"
                                                                                        style={{
                                                                                            fontFamily:
                                                                                                "Times New Roman, Times, serif",
                                                                                            fontSize: "12px",
                                                                                        }}
                                                                                    >
                                                                                        {digit === " " ? "\u00A0" : digit}{" "}
                                                                                        {/* Display non-breaking space for blanks */}
                                                                                    </div>
                                                                                ))}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>

                                                            <TableRow className="w-full flex border-none">
                                                                <TableCell className="text-[10px] text-left font-bold py-1 px-3 w-1/6">
                                                                    Bank Name Branch:
                                                                </TableCell>
                                                                <TableCell colSpan={4}>
                                                                    <div className="flex w-full">
                                                                        {/* Render the BankName blocks */}
                                                                        {(userData?.BankName || "null")
                                                                            .padEnd(50, " ")
                                                                            .split("")
                                                                            .map((char, i) => (
                                                                                <div
                                                                                    key={i}
                                                                                    className="border-b border-gray-400 w-4 h-3 flex items-center justify-center"
                                                                                    style={{
                                                                                        fontFamily:
                                                                                            "Times New Roman, Times, serif",
                                                                                        fontSize: "10px",
                                                                                    }}
                                                                                >
                                                                                    {char === " " ? "\u00A0" : char}{" "}
                                                                                    {/* Render non-breaking space for blanks */}
                                                                                </div>
                                                                            ))}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>

                                                            <TableRow className="w-full flex border-none">
                                                                <TableCell className="text-[10px] text-left font-bold py-1 px-3 w-1/5">
                                                                    or UPI Id (Maximum 45 characters):
                                                                </TableCell>
                                                                <TableCell colSpan={4} className="w-2/3">
                                                                    <div className="flex gap-1">
                                                                        {[...Array(45)].map((_, i) => (
                                                                            <div
                                                                                key={i}
                                                                                className="w-4 h-4 border-b border-gray-400"
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>

                                                            <TableRow className="bg-gray-200">
                                                                <TableCell
                                                                    colSpan={5}
                                                                    className="px-1 text-[10px] font-bold text-left text-gray-800 p-0"
                                                                    style={{
                                                                        fontFamily: "Times New Roman, Times, serif",
                                                                        fontSize: "9px",
                                                                    }}
                                                                >
                                                                    I/WE (ON BEHALF OF JOINT BIDDERS, IF ANY)
                                                                    HEREBY CONFIRM THAT I/WE HAVE READ AND
                                                                    UNDERSTOOD THE TERMS AND CONDITIONS OF THIS
                                                                    BID CUM APPLICATION FORM AND THE ATTACHED
                                                                    ABRIDGED PROSPECTUS AND THE GENERAL
                                                                    INFORMATION DOCUMENT (GID) FOR INVESTING IN
                                                                    PUBLIC ISSUES AND HEREBY AGREE AND CONFIRM THE
                                                                    BIDDERS UNDERTAKING AS GIVEN OVERLEAF. I/WE
                                                                    (ON BEHALF OF JOINT BIDDERS, IF ANY) HEREBY
                                                                    CONFIRM THAT I/WE HAVE READ THE INSTRUCTIONS
                                                                    FOR FILLING UP THE BID CUM APPLICATION FORM
                                                                    GIVEN OVERLEAF.
                                                                </TableCell>
                                                            </TableRow>
                                                        </Table>

                                                        <Table className="w-full border border-gray-700 my-1 text-[10px] text-black">
                                                            {/* Header Row */}
                                                            <TableRow className="bg-[#666666] text-white">
                                                                {/* First Header Cell */}
                                                                <TableCell
                                                                    rowSpan={2}
                                                                    className="w-[200px] text-center align-middle p-0 text-[10px]font-bold leading-tight border border-gray-400"
                                                                >
                                                                    8A. SIGNATURE OF SOLE/ FIRST BIDDER
                                                                </TableCell>

                                                                {/* Second Header Cell */}
                                                                <TableCell className="w-[434px] text-center p-1 text-[10px]text-[8.5px] leading-tight border border-gray-400">
                                                                    <span>
                                                                        8B. SIGNATURE OF ASBA BANK ACCOUNT HOLDER(S)
                                                                        (AS PER BANK RECORDS)
                                                                    </span>
                                                                </TableCell>

                                                                {/* Third Header Cell */}
                                                                <TableCell
                                                                    rowSpan={2}
                                                                    className="w-[200px] text-center p-0 text-[10px]leading-tight border border-gray-400"
                                                                >
                                                                    BROKER / SCSB / DP / RTA STAMP (Acknowledging
                                                                    upload of Bid in Stock Exchange system)
                                                                </TableCell>
                                                            </TableRow>

                                                            <TableRow>
                                                                <TableCell className="w-[434px] text-center p-1 text-[10px]text-[8px] leading-tight border border-gray-400 bg-[#CCCCCC] text-black">
                                                                    I/We authorize the SCSB to do all acts as are
                                                                    necessary to make the Application in the Issue
                                                                </TableCell>
                                                            </TableRow>
                                                            <TableRow></TableRow>

                                                            <TableRow>
                                                                <TableCell className="w-[200px] text-center p-0 text-[10px]leading-tight border border-gray-400"></TableCell>
                                                                <TableCell className="p-0 px-2 text-[10px]leading-tight border border-gray-400">
                                                                    <ul className="">
                                                                        {["1)", "2)", "3)"].map((item, index) => (
                                                                            <li
                                                                                key={index}
                                                                                className="flex items-center gap-1 mb-1"
                                                                            >
                                                                                <span>{item}:</span>
                                                                                <div className="flex gap-1">
                                                                                    {[...Array(20)].map((_, i) => (
                                                                                        <div
                                                                                            key={i}
                                                                                            className="w-3 h-3 border-b border-gray-400"
                                                                                        />
                                                                                    ))}
                                                                                </div>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </TableCell>
                                                            </TableRow>
                                                        </Table>

                                                        {/* Tear here image */}
                                                        <div className="w-full">
                                                            <Image
                                                                src="/images/IPOForm/IPO-FORM-tearhere.jpg"
                                                                alt="IPO Form"
                                                                layout="responsive"
                                                                width={100}
                                                                height={10}
                                                            />
                                                        </div>
                                                        {parseFloat(calculatedAmount) >= 500000 && (
                                                            <TableRow>
                                                                <Table className="w-full border border-white text-white bg-[#666666] m-0 p-0 border-gray-400">
                                                                    <TableRow>
                                                                        <TableCell className="text-center m-0 p-0 border">
                                                                            <span className="text-[10px]text-[10px] font-bold">
                                                                                SYNDICATE ASBA FORM
                                                                            </span>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                </Table>
                                                            </TableRow>
                                                        )}

                                                        <Table className="w-full border-collapse">
                                                            <TableBody>
                                                                {/* First Row */}
                                                                <TableRow>
                                                                    {/* First Column - Logo */}
                                                                    <TableCell className="w-[7%] align-middle p-2">
                                                                        <Image
                                                                            src={userData?.logolink}
                                                                            alt="Company Logo"
                                                                            width={100}
                                                                            height={31}
                                                                        />
                                                                    </TableCell>

                                                                    {/* Second Column - Company Details */}
                                                                    <TableCell className="w-[55%] p-0 text-center">
                                                                        <Table className="w-full border border-gray-700">
                                                                            <TableBody>
                                                                                <TableRow className="border border-gray-700">
                                                                                    {/* Company Name */}
                                                                                    <TableCell className="text-[10px] text-[10px]text-center font-bold p-0 text-black">
                                                                                        {userData.companyname}
                                                                                    </TableCell>
                                                                                    {/* Acknowledgement Slip */}
                                                                                    <TableCell
                                                                                        rowSpan={2}
                                                                                        className="text-[10px] text-[10px]text-center p-0 align-middle border border-gray-700 text-black"
                                                                                    >
                                                                                        <b>Acknowledgement Slip</b>
                                                                                        <br />
                                                                                        <b>for Broker/SCSB/</b>
                                                                                        <br />
                                                                                        <b>DP/RTA</b>
                                                                                        <b>INITIAL PUBLIC OFFER - R</b>
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                                <TableRow>
                                                                                    {/* Offer Type */}
                                                                                    <TableCell className="text-[10px] text-[10px]text-center font-bold p-0 text-black">
                                                                                        100% BOOK BUILT OFFER
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            </TableBody>
                                                                        </Table>
                                                                    </TableCell>

                                                                    {/* Third Column - Application Details */}
                                                                    <TableCell className="w-[38%] p-0 text-center">
                                                                        <Table className="w-full">
                                                                            <TableBody>
                                                                                <TableRow>
                                                                                    {/* Form Details */}
                                                                                    <TableCell className="w-[24%] text-[11px] text-[10px]text-center font-bold p-1 align-middle text-black">
                                                                                        Bid Cum
                                                                                        <br />
                                                                                        Application
                                                                                        <br />
                                                                                        Form No.
                                                                                    </TableCell>
                                                                                    <TableCell className="w-[76%]">
                                                                                        <Table className="w-full border border-gray-700">
                                                                                            <TableBody>
                                                                                                <TableRow>
                                                                                                    {/* Application Number */}
                                                                                                    <TableCell className="text-[20px] text-[10px]text-center font-bold text-black">
                                                                                                        {userData.appllicationno ||
                                                                                                            "null"}
                                                                                                    </TableCell>
                                                                                                </TableRow>
                                                                                            </TableBody>
                                                                                        </Table>
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            </TableBody>
                                                                        </Table>
                                                                    </TableCell>
                                                                </TableRow>
                                                            </TableBody>
                                                        </Table>

                                                        <Table className="w-[90%] border-collapse border-0">
                                                            <TableBody>
                                                                <TableRow className="flex items-center justify-between">
                                                                    {/* Left Empty Column */}
                                                                    <TableCell className="w-[70%] text-center p-0">
                                                                        <div className="flex items-center ">
                                                                            <div className="w-10 h-9 border border-gray-700 text-[10px] flex items-center justify-center text-black">
                                                                                DP ID/ CL ID
                                                                            </div>
                                                                            <div>
                                                                                {dpDetails?.depository === "CDSL" &&
                                                                                    renderBoidValues(
                                                                                        userData.CDSLboid,
                                                                                        true
                                                                                    )}
                                                                                {dpDetails?.depository === "NSDL" && (
                                                                                    <>
                                                                                        {renderBoidValues(
                                                                                            userData.NSDLdpid,
                                                                                            false
                                                                                        )}
                                                                                        {renderBoidValues(
                                                                                            userData.NSDLboid,
                                                                                            false
                                                                                        )}
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </TableCell>

                                                                    {/* PAN Column */}
                                                                    <TableCell className="w-[40%] text-[10px] text-[10px]text-right flex flex-col items-start p-0 text-black">
                                                                        <span>PAN of Sole / First Bidder</span>
                                                                        <div className="flex">
                                                                            {Array.from({ length: 10 }).map(
                                                                                (_, i) => (
                                                                                    <div
                                                                                        key={i}
                                                                                        className="w-8 h-6 border border-gray-400 flex items-center justify-center text-[9px] text-black "
                                                                                    >
                                                                                        {userData.pan[i] || ""}
                                                                                    </div>
                                                                                )
                                                                            )}
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            </TableBody>
                                                        </Table>

                                                        <div className="flex w-full gap-x-4">
                                                            {/* First Table (70% width) */}
                                                            <div className="flex-[7]">
                                                                <Table className="border border-gray-500 mt-1">
                                                                    <TableBody>
                                                                        {/* First Row */}
                                                                        <TableRow className="flex justify-between items-center ">
                                                                            <TableCell className="text-[10px] text-[10px]p-0 px-1 text-black">
                                                                                Amount blocked (Rs. in figures):{" "}
                                                                                <span className="px-4">
                                                                                    {" "}
                                                                                    {calculatedAmount}
                                                                                </span>
                                                                            </TableCell>
                                                                            <TableCell className="text-[10px] text-[10px]p-0 px-1 text-right pr-5 text-black">
                                                                                {/* ASBA Bank A/c No.: {" "} */}
                                                                                <div className="border-l border-black px-2 py-1 inline-block">
                                                                                    ASBA Bank A/c No.:{" "}
                                                                                </div>
                                                                                <span className="px-4">
                                                                                    {userData.BankName}
                                                                                </span>
                                                                            </TableCell>
                                                                        </TableRow>

                                                                        {/* Second Row */}
                                                                        <TableRow className="border border-gray-500">
                                                                            <TableCell
                                                                                colSpan={2}
                                                                                className="text-[10px] text-[10px]p-0 px-1 text-black"
                                                                            >
                                                                                Bank Branch:{" "}
                                                                                <span className="px-4">
                                                                                    {userData.AccNo}
                                                                                </span>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                        <div className="mt-0.5"></div>

                                                                        {/* Third Row */}
                                                                        <TableRow className="border-b border-black">
                                                                            <TableCell
                                                                                colSpan={2}
                                                                                className="text-[10px] text-[10px]p-0 px-1 text-black"
                                                                            >
                                                                                Received from Mr./Ms.:{" "}
                                                                                <span className="px-4">
                                                                                    {userData.clientName}
                                                                                </span>
                                                                            </TableCell>
                                                                        </TableRow>

                                                                        {/* Fourth Row */}
                                                                        <TableRow className="flex justify-between items-center border border-black">
                                                                            <TableCell className="text-[10px] text-[10px]p-0 px-1 text-black">
                                                                                Telephone / Mobile:{" "}
                                                                                <span className="px-4">
                                                                                    {userData.mobile}
                                                                                </span>
                                                                            </TableCell>
                                                                            <TableCell className="text-[10px] text-[10px]p-0 px-1 pr-5 text-black">
                                                                                {/* Email:  */}
                                                                                <div className="border-l border-black px-2 py-1 inline-block">
                                                                                    Email:{" "}
                                                                                </div>
                                                                                <span className="px-4">{email}</span>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    </TableBody>
                                                                </Table>
                                                            </div>

                                                            {/* Second Table (30% width) */}
                                                            <div className="flex-[3]">
                                                                <Table className="border border-gray-700 mt-1">
                                                                    <TableBody>
                                                                        <TableRow>
                                                                            <TableCell
                                                                                className=" bg-[#666666] text-white text-[8px] text-[10px]text-center p-0"
                                                                                colSpan={1}
                                                                            >
                                                                                <b>
                                                                                    Stamp &nbsp; Signature of SCSB Branch
                                                                                    /Members of Syndicate /Sub-Syndicate
                                                                                    Member /Registered Broker /CDP /RTA
                                                                                    /Agent
                                                                                </b>{" "}
                                                                                <br />
                                                                                {/* <b>of Syndicate / Sub-Syndicate Member /</b> <br /> */}
                                                                            </TableCell>
                                                                        </TableRow>
                                                                        <TableRow>
                                                                            <TableCell className="h-[65px]"></TableCell>
                                                                        </TableRow>
                                                                    </TableBody>
                                                                </Table>
                                                            </div>
                                                        </div>

                                                        {/* Tear here image */}
                                                        <div className="w-full">
                                                            <Image
                                                                src="/images/IPOForm/IPO-FORM-tearhere.jpg"
                                                                alt="IPO Form"
                                                                layout="responsive"
                                                                width={100}
                                                                height={10}
                                                            />
                                                        </div>
                                                        {parseFloat(calculatedAmount) >= 500000 && (
                                                            <TableRow>
                                                                <Table className="w-full border border-white text-white bg-[#666666] m-0 p-0 border-gray-400">
                                                                    <TableRow>
                                                                        <TableCell className="text-center m-0 p-0 border">
                                                                            <span className="text-[10px]text-[10px] font-bold">
                                                                                SYNDICATE ASBA FORM
                                                                            </span>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                </Table>
                                                            </TableRow>
                                                        )}

                                                        <Table className="w-full">
                                                            <TableBody>
                                                                <TableRow>
                                                                    <TableCell
                                                                        rowSpan={2}
                                                                        className="border border-gray-700 p-0"
                                                                    >
                                                                        <div className="w-full h-28 flex items-center justify-center">
                                                                            <span
                                                                                className="text-xs font-bold transform rotate-180 text-black"
                                                                                style={{ writingMode: "vertical-rl" }} // Corrected value
                                                                            >
                                                                                {userData.companyname}
                                                                            </span>
                                                                        </div>
                                                                    </TableCell>

                                                                    <div className="flex m-1 gap-1">
                                                                        <div className="flex-[6]">
                                                                            <Table className="w-full border border-gray-700">
                                                                                <TableBody>
                                                                                    <TableRow className="border border-gray-700 text-center">
                                                                                        <TableCell className="p-0 text-xs font-bold border border-gray-700"></TableCell>
                                                                                        <TableCell className="p-0 text-xs font-bold border border-gray-700 text-black">
                                                                                            Option 1
                                                                                        </TableCell>
                                                                                        <TableCell className="p-0 text-xs font-bold border border-gray-700 text-black">
                                                                                            Option 2
                                                                                        </TableCell>
                                                                                        <TableCell className="p-0 text-xs font-bold border border-gray-700 text-black">
                                                                                            Option 3
                                                                                        </TableCell>
                                                                                    </TableRow>
                                                                                    <TableRow className="border border-gray-700 ">
                                                                                        <TableCell className="p-0 text-xs border border-gray-700 text-black">
                                                                                            No. Of Equity shares
                                                                                        </TableCell>
                                                                                        <TableCell className="p-0 text-xs border border-gray-700 text-center text-black">
                                                                                            {userData.calculatedQuantity || 0}
                                                                                        </TableCell>
                                                                                        <TableCell className="p-0 text-xs border border-gray-700 text-center"></TableCell>
                                                                                    </TableRow>
                                                                                    <TableRow className="border border-gray-700">
                                                                                        <TableCell className="p-0 text-xs border border-gray-700 text-black">
                                                                                            Bid Price
                                                                                        </TableCell>
                                                                                        <TableCell className="p-0 text-xs border border-gray-700 text-center text-black">
                                                                                            {userData.cutoffPrice || 0}
                                                                                        </TableCell>
                                                                                        <TableCell className="p-0 text-xs border border-gray-700 text-center text-black"></TableCell>
                                                                                        <TableCell />
                                                                                    </TableRow>
                                                                                    <TableRow className="border border-gray-700">
                                                                                        <TableCell
                                                                                            className="p-0 text-xs border border-gray-700 text-black "
                                                                                            colSpan={4}
                                                                                        >
                                                                                            Amount Paid:-
                                                                                            <span className="px-4 text-center text-black">
                                                                                                {userData.calculatedAmount || 0}
                                                                                            </span>
                                                                                        </TableCell>
                                                                                    </TableRow>
                                                                                </TableBody>
                                                                            </Table>
                                                                        </div>

                                                                        <div className="flex-[4]">
                                                                            <Table className="border border-gray-600">
                                                                                <TableBody>
                                                                                    <TableRow>
                                                                                        <TableCell
                                                                                            className="bg-[#666666] text-white text-[8px] text-[10px]text-center p-0 "
                                                                                            colSpan={1}
                                                                                        >
                                                                                            <b>
                                                                                                Stamp & Signature of Broker /
                                                                                                SCSB / DP / RTA
                                                                                            </b>
                                                                                        </TableCell>
                                                                                    </TableRow>
                                                                                    <TableRow>
                                                                                        <TableCell className="h-[45px]"></TableCell>
                                                                                    </TableRow>
                                                                                </TableBody>
                                                                            </Table>
                                                                        </div>
                                                                    </div>

                                                                    <TableCell rowSpan={2} className="p-1">
                                                                        <div className="mb-1 flex items-center ">
                                                                            <div className="text-xs font-bold">
                                                                                Name Of Sole / First Bidder
                                                                            </div>
                                                                            <div className="border-b border-gray-300 w-full break-words text-black">
                                                                                {userData.clientName}
                                                                            </div>
                                                                        </div>

                                                                        <Table>
                                                                            <TableBody>
                                                                                <TableRow>
                                                                                    <TableCell
                                                                                        className="bg-[#666666] text-white text-[9px] text-[10px]text-center p-0"
                                                                                        colSpan={2}
                                                                                    >
                                                                                        Acknowledgement slip for Bidder
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            </TableBody>
                                                                        </Table>

                                                                        <div className="w-full mt-1 flex items-center gap-5">
                                                                            <div className="w-1/4 text-center text-[10px] font-bold text-black">
                                                                                Bid Cum Application Form No.
                                                                            </div>
                                                                            <div className="w-3/4">
                                                                                <Table>
                                                                                    <TableBody>
                                                                                        <TableRow>
                                                                                            <TableCell
                                                                                                className="text-xs font-bold text-center border border-gray-700 p-1 text-black"
                                                                                                colSpan={2}
                                                                                            >
                                                                                                {userData.appllicationno}
                                                                                            </TableCell>
                                                                                        </TableRow>
                                                                                    </TableBody>
                                                                                </Table>
                                                                            </div>
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>

                                                                <TableRow>
                                                                    <Table className="">
                                                                        <TableBody className="border border-gray-700">
                                                                            <TableRow className="flex flex-col ">
                                                                                <TableCell
                                                                                    className="text-xs font-bold text-left p-1 pl-4"
                                                                                    colSpan={2}
                                                                                >
                                                                                    <div className="flex ">
                                                                                        <div className="text-xs font-bold text-black">
                                                                                            ASBA Bank A/c No.:
                                                                                        </div>
                                                                                        <div className="border-b border-gray-500 w-48 float-left text-black">
                                                                                            <span className="px-4 ">
                                                                                                {userData.AccNo}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                </TableCell>
                                                                                <TableCell
                                                                                    className="text-xs font-bold text-left p-1 pl-4"
                                                                                    colSpan={2}
                                                                                >
                                                                                    <div className="flex ">
                                                                                        <div className="text-xs font-bold text-black">
                                                                                            Bank Branch:
                                                                                        </div>
                                                                                        <div className="border-b border-gray-500 w-48 float-left text-black">
                                                                                            <span className="px-4 ">
                                                                                                {userData.BankName}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        </TableBody>
                                                                    </Table>
                                                                </TableRow>
                                                            </TableBody>
                                                        </Table>
                                                    </Table>
                                                </TableHead>

                                                {/* Forth Column: Black Boxes */}
                                                <TableHead className="p-0 align-top w-[1%] text-left">
                                                    <div className="relative h-[880px] w-[12px]">
                                                        {blackBoxPositions.map((position, index) => (
                                                            <div
                                                                key={index}
                                                                className="absolute left-0"
                                                                style={{ top: `${position}px` }}
                                                            >
                                                                <Image
                                                                    src="/images/IPOForm/blackbox.jpg"
                                                                    alt=""
                                                                    width={12}
                                                                    height={12}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </TableHead>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Printform;

// IPO Logo
