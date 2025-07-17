/* eslint-disable jsx-a11y/alt-text */
import { Page, Text, View, Document, StyleSheet, PDFViewer, Font, Image } from "@react-pdf/renderer"
// Register a monospaced font for better alignment
Font.register({
    family: "Courier",
    fonts: [
        {
            src: "https://fonts.gstatic.com/s/courierprime/v9/u-450q2lgwslOqpF_6gQ8kELaw9pWt_-.ttf",
        },
        {
            src: "https://fonts.gstatic.com/s/courierprime/v9/u-4k0q2lgwslOqpF_6gQ8kELY7pMf-fVqvHoJXw.ttf",
            fontWeight: 800,
        },
    ],
})

const styles = StyleSheet.create({
    page: {
        fontFamily: "Courier",
        fontWeight: 700,
        fontSize: 10,
        padding: 30,
    },
    bgColor: {
        backgroundColor: "#f0f8ff",
    },
    section: {
        margin: 5,
        padding: 5,
    },
    table: {
        display: "flex",
        width: "auto",
        borderStyle: "solid",
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        margin: 5,
    },
    tableRowCustom: {
        border: "none",
        textAlign: "center",
        margin: "auto",
        flexDirection: "row",
    },
    tableRow: {
        margin: "auto",
        flexDirection: "row",
    },
    tableCol: {
        width: "16.66%",
        borderStyle: "solid",
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
    },
    tableCell: {
        textAlign: "center",
        margin: 5,
        fontSize: 10,
    },
    textCenter: {
        textAlign: "center",
    },
    flexBetween: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
    },
    flexColumn: {
        display: "flex",
        flexDirection: "column",
    },
    formRow: {
        display: "flex",
        flexDirection: "row",
        marginBottom: 2,
    },
    labelCol: {
        width: "35%",
        fontFamily: "Courier",
        fontSize: 10,
    },
    valueCol: {
        width: "65%",
        fontFamily: "Courier",
        fontSize: 10,
        paddingLeft: 5,
    },
    signatureSection: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginTop: 10,
    },
    leftColumn: {
        display: "flex",
        flexDirection: "column",
        gap: 5,
    },
    rightColumn: {
        alignSelf: "flex-end",
        marginTop: 20,
    },
    codeMainContent: {
        width: "90%",
    },
    codeNumber: {
        width: "10%",
        textAlign: "right",
    },
    indentedContinuation: {
        marginLeft: 10,
    },
    codeRow: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    mainText: {
        flex: 1,
    },
    numberColumn: {
        width: 20,
        textAlign: "right",
    },
    codeValue: {
        width: 30,
        textAlign: "right",
    },
    subPoint: {
        marginLeft: 12,
        paddingRight: 20,
        display: "flex",
        flexDirection: "row",
    },
    subPointNumber: {
        width: 25,
    },
    subPointText: {
        flex: 1,
    },
    codeRow1: {
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
    },
    numberColumn1: {
        width: 30,
        marginRight: 3,
    },
    mainText1: {
        flex: 1,
        paddingRight: 5,
    },
    pageNumber: {
        position: "absolute",
        fontSize: 12,
        bottom: 30,
        right: 30,
        color: "grey",
    },
    footer: {
        position: "absolute",
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: "right",
        fontSize: 12,
    },
})

const DocumentHeader = () => (
    <View fixed style={{ marginBottom: 3 }}>
        <View
            style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
            }}
        >
            <View
                style={{
                    width: "20%",
                }}
            >
                <Image src="/faviconFull.jpg" style={{ width: 100 }} />
            </View>
            <View
                style={{
                    width: "60%",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                }}
            >
                <Text style={[styles.textCenter, { width: "100%" }]}>PUNE E STOCK BROKING LIMITED</Text>
                <Text style={[styles.textCenter, { width: "100%" }]}>186:STT Certificate</Text>
                <Text style={[styles.textCenter, { width: "100%" }]}>Form No. 10DB</Text>
            </View>

            <View style={{ width: "20%" }}></View>
        </View>
        <View style={{ backgroundColor: "#9999cc", padding: 5, margin: 5 }}>
            <Text style={styles.textCenter}>(See rule 20AB)</Text>
            <Text style={styles.textCenter}>Form for evidence of payment of Securities Transaction Tax on</Text>
            <Text style={styles.textCenter}>transactions entered in a Recognised Stock Exchange.</Text>
        </View>
    </View>
)

const MainDocument = ({ data, fromDate, toDate }) => {

    const totalExchangeValue = (data?.tableDetails ?? []).reduce(
        (sum, record) => sum + (Number.parseFloat(record?.TOTAL_EXCHANGE_VALUE) || 0),
        0
    ).toFixed(2);

    const totalExchangeSTT = (data?.tableDetails ?? []).reduce(
        (sum, record) => sum + (Number.parseFloat(record?.TOTAL_EXCHANGE_STT) || 0),
        0
    ).toFixed(2);

    const totalAccountValue = (data?.tableDetails ?? []).reduce(
        (sum, record) => sum + (Number.parseFloat(record?.TOTAL_ACCOUNT_VALUE) || 0),
        0
    ).toFixed(2);

    const totalAccountSTT = (data?.tableDetails ?? []).reduce(
        (sum, record) => sum + (Number.parseFloat(record?.TOTAL_ACCOUNT_STT) || 0),
        0
    ).toFixed(2);


    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <DocumentHeader />

                <View>

                    <View style={[styles.section, styles.bgColor]}>
                        <View style={styles.formRow}>
                            <Text style={styles.labelCol}>1. Name of the Assessee :</Text>
                            <Text style={styles.valueCol}>{data?.common?.CLIENT_NAME || ""}</Text>
                        </View>
                        <View style={styles.formRow}>
                            <Text style={styles.labelCol}>2. Address of the Assessee :</Text>
                            <Text style={styles.valueCol}>{data?.common?.RESI_ADD || ""}</Text>
                        </View>
                        <View style={styles.formRow}>
                            <Text style={styles.labelCol}>3. PAN No. of the Assessee :</Text>
                            <Text style={styles.valueCol}>{data?.common?.PAN_NO || ""}</Text>
                        </View>
                        <View style={styles.formRow}>
                            <Text style={styles.labelCol}>4. MAP-IN Id of the Assessee:</Text>
                            <Text style={styles.valueCol}>{data?.common?.MAPIN || ""}</Text>
                        </View>
                        <View style={styles.formRow}>
                            <Text style={styles.labelCol}>5. Stock Exchange :</Text>
                            <Text style={styles.valueCol}>{data?.common?.EXCHANGE_NAME || ""}</Text>
                        </View>
                        <View style={styles.formRow}>
                            <Text style={styles.labelCol}>6. Financial Year :</Text>
                            <Text style={styles.valueCol}>{fromDate || ""} - {toDate || ""}</Text>
                        </View>
                        <View style={styles.formRow}>
                            <Text style={styles.labelCol}>7. Brokers Name :</Text>
                            <Text style={styles.valueCol}>{data?.common?.COMPANY_NAME || ""}</Text>
                        </View>
                        <View style={styles.formRow}>
                            <Text style={styles.labelCol}>8. Brokers Address :</Text>
                            <Text style={styles.valueCol}>{data?.common?.COMPANY_ADDRESS || ""}</Text>
                        </View>
                        <View style={styles.formRow}>
                            <Text style={styles.labelCol}></Text>
                            <Text style={styles.valueCol}>{data?.common?.COMPANY_ADDRESS2 || ""}</Text>
                        </View>
                        <View style={styles.formRow}>
                            <Text style={styles.labelCol}>9. Broker Code :</Text>
                            <Text style={styles.valueCol}>{data?.common?.BROKER_CODE || ""}</Text>
                        </View>
                        <View style={styles.formRow}>
                            <Text>
                                10. Details of Value of Securities Transactions and Securities Transaction Tax Collected from the Assessee
                                :
                            </Text>
                        </View>
                    </View>

                    <View style={styles.table}>
                        <View style={[styles.tableRow, styles.bgColor]}>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>Client Code number</Text>
                                <Text style={styles.tableCell}>(1)</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>Trans Code</Text>
                                <Text style={styles.tableCell}>(2)</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>Value of transaction enter into during financial year</Text>
                                <Text style={styles.tableCell}>(3)</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>
                                    Total securities transaction tax collected from assessee during financial year
                                </Text>
                                <Text style={styles.tableCell}>(4)</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>
                                    Value of transaction (included in value given in column 3) entered into the Course of Business by the
                                    assessee
                                </Text>
                                <Text style={styles.tableCell}>(5)</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>
                                    Securities transaction tax collected on value of transaction given in column 5
                                </Text>
                                <Text style={styles.tableCell}>(6)</Text>
                            </View>
                        </View>

                        {
                            data?.tableDetails?.map((record, index) => {
                                return (
                                    <View style={styles.tableRow} key={index}>
                                        <View style={styles.tableCol}>
                                            <Text style={styles.tableCell}>{data?.common?.CLIENT_ID || ""}</Text>
                                        </View>
                                        <View style={styles.tableCol}>
                                            <Text style={styles.tableCell}>{record?.TRANS_CODE || ""}</Text>
                                        </View>
                                        <View style={styles.tableCol}>
                                            <Text style={styles.tableCell}>
                                                {record?.TOTAL_EXCHANGE_VALUE ? Number.parseFloat(record.TOTAL_EXCHANGE_VALUE).toFixed(2) : "0.00"}
                                            </Text>
                                        </View>
                                        <View style={styles.tableCol}>
                                            <Text style={styles.tableCell}>
                                                {record?.TOTAL_EXCHANGE_STT ? Number.parseFloat(record.TOTAL_EXCHANGE_STT).toFixed(2) : "0.00"}
                                            </Text>
                                        </View>
                                        <View style={styles.tableCol}>
                                            <Text style={styles.tableCell}>
                                                {record?.TOTAL_ACCOUNT_VALUE ? Number.parseFloat(record.TOTAL_ACCOUNT_VALUE).toFixed(2) : "0.00"}
                                            </Text>
                                        </View>
                                        <View style={styles.tableCol}>
                                            <Text style={styles.tableCell}>
                                                {record?.TOTAL_ACCOUNT_STT ? Number.parseFloat(record.TOTAL_ACCOUNT_STT).toFixed(2) : "0.00"}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })
                        }


                        <View style={[styles.tableRow, styles.bgColor]}>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>** TOTAL **</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}></Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>{totalExchangeValue}</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>{totalExchangeSTT}</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>{totalAccountValue}</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>{totalAccountSTT}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.bgColor]}>
                        <View style={[styles.section]}>
                            <Text style={styles.textCenter}>VERIFICATION</Text>
                            <View style={styles.flexBetween}>
                                <Text>I, {data?.common?.CLIENT_NAME || ""}</Text>
                                <Text>, Son / Daughter of</Text>
                            </View>
                            <Text>
                                solemnly declare that to the best of my knowledge and belief the information given in this Form is correct
                                and complete and that the total amount of securities transaction tax shown therein is truly stated and is
                                in accordance with the provisions of Chapter VII of the Finance (No. 2) Act, 2004 and Securities
                                Transaction Tax Rules, 2004.
                            </Text>
                            <View style={styles.signatureSection}>
                                <View style={styles.leftColumn}>
                                    <Text>Date :</Text>
                                    <Text>Place :</Text>
                                </View>
                                <View style={styles.rightColumn}>
                                    <Text></Text>
                                    <Text>(Name & Signature of the Assessee)</Text>
                                </View>
                            </View>
                        </View>

                        <View style={[styles.section]}>
                            <View style={[styles.codeRow, { margin: "5 0" }]}>
                                <Text style={[styles.textCenter, { flex: 1 }]}>Codes in Respect Of Taxable Securities Transaction</Text>
                                <Text style={styles.codeValue}>Code</Text>
                            </View>

                            <View style={styles.codeRow}>
                                <Text style={styles.numberColumn}>1)</Text>
                                <Text style={styles.mainText}>
                                    Purchase of an equity share in a company of the unit of an equity oriented fund. Where
                                </Text>
                                <Text style={styles.codeValue}>01</Text>
                            </View>

                            <View style={styles.subPoint}>
                                <Text style={styles.subPointNumber}>(a)</Text>
                                <Text style={styles.subPointText}>
                                    the transaction of such purchase is enter into in the recognise stock exchange and
                                </Text>
                            </View>
                            <View style={styles.subPoint}>
                                <Text style={styles.subPointNumber}>(b)</Text>
                                <Text style={styles.subPointText}>
                                    the contract for purchase of such shares or unit is settled by actual delivery of transfer of such share
                                    or unit
                                </Text>
                            </View>

                            <View style={styles.codeRow}>
                                <Text style={styles.numberColumn}>2)</Text>
                                <Text style={styles.mainText}>
                                    Sale of an equity share in a company of a unit of an equity oriented fund. Where
                                </Text>
                                <Text style={styles.codeValue}>02</Text>
                            </View>

                            <View style={styles.subPoint}>
                                <Text style={styles.subPointNumber}>(a)</Text>
                                <Text style={styles.subPointText}>
                                    transaction of such sale is entered into recognized stock exchange and
                                </Text>
                            </View>
                            <View style={styles.subPoint}>
                                <Text style={styles.subPointNumber}>(b)</Text>
                                <Text style={styles.subPointText}>
                                    the contract for sale of such shares or unit is settled by actual delivery of transfer of such share or
                                    unit
                                </Text>
                            </View>

                            <View style={styles.codeRow}>
                                <Text style={styles.numberColumn}>3)</Text>
                                <Text style={styles.mainText}>
                                    Sale of an equity share in a company of a unit of an equity oriented fund. Where
                                </Text>
                                <Text style={styles.codeValue}>03</Text>
                            </View>

                            <View style={styles.subPoint}>
                                <Text style={styles.subPointNumber}>(a)</Text>
                                <Text style={styles.subPointText}>
                                    transaction of such sale is entered into recognized stock exchange and
                                </Text>
                            </View>
                            <View style={styles.subPoint}>
                                <Text style={styles.subPointNumber}>(b)</Text>
                                <Text style={styles.subPointText}>
                                    the contract for sale of such shares or units settled other than by the actual delivery of transfer of
                                    such share or unit
                                </Text>
                            </View>

                            <View style={styles.codeRow}>
                                <Text style={styles.numberColumn}>4)</Text>
                                <Text style={styles.mainText}>
                                    Sale of derivative being option in securities where in transaction of such sale is entered into an
                                    recognized stock exchange
                                </Text>
                                <Text style={styles.codeValue}>04</Text>
                            </View>

                            <View style={styles.codeRow}>
                                <Text style={styles.numberColumn}>5)</Text>
                                <Text style={styles.mainText}>
                                    Sales of derivatives being future, where the transaction of such sale is entered into a recognized stock
                                    exchange
                                </Text>
                                <Text style={styles.codeValue}>05</Text>
                            </View>
                        </View>

                        <View style={[styles.section]}>
                            <Text style={styles.textCenter}>Instructions:</Text>

                            <View style={styles.codeRow1}>
                                <Text style={styles.numberColumn1}>(i)</Text>
                                <Text style={styles.mainText1}>
                                    Where an assessee has entered into transactions in a stock exchange under different client code through
                                    the same stock broker, details in this Form be filled separately for each such client code.
                                </Text>
                            </View>

                            <View style={styles.codeRow1}>
                                <Text style={styles.numberColumn1}>(ii)</Text>
                                <Text style={styles.mainText1}>
                                    Separate Form be furnished in respect of transactions entered into in different stock exchanges and also
                                    for the transactions entered in same stock exchange through different stock brokers.
                                </Text>
                            </View>

                            <View style={styles.codeRow1}>
                                <Text style={styles.numberColumn1}>(iii)</Text>
                                <Text style={styles.mainText1}>
                                    In column 4 of Table of item 10, fill the details of securities transaction tax collected by the stock
                                    broker from the assessee.
                                </Text>
                            </View>

                            <View style={styles.codeRow1}>
                                <Text style={styles.numberColumn1}>(iv)</Text>
                                <Text style={styles.mainText1}>
                                    Where the assessee entering into a transaction is a stock broker on which securities transaction tax has
                                    to be paid by him, item 1 and item 7 shall be same and such assessee shall, in column 4 of the Table of
                                    item 10, fill the details of securities transaction tax collected from him by the stock exchange.
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>


                {/* <View style={styles.footer} fixed>
            <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View> */}
            </Page>
        </Document >
    )
}

export default MainDocument