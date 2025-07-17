import { Building, CalendarRange, ReceiptText } from "lucide-react";
import { Badge } from "./ui/badge";

export default function BuybackDetails({ selectedCompanyDetails }: any) {
    if (!selectedCompanyDetails) return

    return (
        <div className="mb-0 border rounded-md p-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <div className="flex items-center gap-1.5">
                    <div className="bg-blue-100 p-1 rounded-md">
                        <Building className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                        <div className="text-xs text-slate-500">Company</div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium">
                                {selectedCompanyDetails.scrip}
                            </span>
                            {selectedCompanyDetails.isin &&
                                selectedCompanyDetails.isin !== "-" && (
                                    <Badge variant="outline" className="text-xs">
                                        {selectedCompanyDetails.isin}
                                    </Badge>
                                )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <div className="bg-green-100 p-1 rounded-md">
                        <CalendarRange className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                        <div className="text-xs text-slate-500">Date</div>
                        <div className="font-medium text-sm">
                            {selectedCompanyDetails.fromdate &&
                                selectedCompanyDetails.fromdate !== "-"
                                ? selectedCompanyDetails.fromdate
                                : "N/A"}
                            {" - "}
                            {selectedCompanyDetails.todate &&
                                selectedCompanyDetails.todate !== "-"
                                ? selectedCompanyDetails.todate
                                : "N/A"}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <div className="bg-purple-100 p-1 rounded-md">
                        <ReceiptText className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                        <div className="text-xs text-slate-500">
                            Price & Settlement No
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-sm">
                                ₹
                                {selectedCompanyDetails.buybackprice > 0
                                    ? selectedCompanyDetails.buybackprice
                                    : "N/A"}
                            </span>

                            {selectedCompanyDetails.nsesettno &&
                                selectedCompanyDetails.nsesettno !== "-" && (
                                    <Badge variant="secondary" className="text-xs">
                                        NSE: {selectedCompanyDetails.nsesettno}
                                    </Badge>
                                )}
                            {selectedCompanyDetails.bsesettno &&
                                selectedCompanyDetails.bsesettno !== "-" && (
                                    <Badge variant="secondary" className="text-xs">
                                        BSE: {selectedCompanyDetails.bsesettno}
                                    </Badge>
                                )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}