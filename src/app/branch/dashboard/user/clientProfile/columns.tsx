import { ColumnDef } from "@tanstack/react-table"

export type ClientProfile = {
    clientId: string
    name: string
    branchcode: string
    dpid: string
    boid: string
    depository: string
    poaStatus: string
    defaultAccount: string
    ddpiMasterId: string
    ddpiEnabled: string
    ddpiPledge: string
    ddpiBuyback: string
    ddpiMf: string
}

export const columns: ColumnDef<ClientProfile>[] = [
    {
        id: "clientId",
        accessorKey: "clientId",
        header: "Client ID",
        cell: ({ row }) => {
            const value = row.original.clientId ?? "-";
            return <div className="font-medium">{value}</div>;
        }
    },
    {
        id: "name",
        accessorKey: "name",
        header: "Client Name",
    },
    {
        id: "branchcode",
        accessorKey: "branchcode",
        header: "Branch Code",
    },
    {
        id: "dpid",
        accessorKey: "dpid",
        header: "DPID",
    },
    {
        id: "boid",
        accessorKey: "boid",
        header: "BOID",
    },
    {
        id: "depository",
        accessorKey: "depository",
        header: "Depository",
    },
    {
        id: "poaStatus",
        accessorKey: "poaStatus",
        header: "Poa Status",
    },
    {
        id: "defaultAccount",
        accessorKey: "defaultAccount",
        header: "Default Account",
    },
    {
        id: "ddpiMasterId",
        accessorKey: "ddpiMasterId",
        header: "DDPI Master ID",
    },
    {
        id: "ddpiEnabled",
        accessorKey: "ddpiEnabled",
        header: "DDPI Enabled",
    },
    {
        id: "ddpiPledge",
        accessorKey: "ddpiPledge",
        header: "DDPI Pledge",
    },
    {
        id: "ddpiBuyback",
        accessorKey: "ddpiBuyback",
        header: "DDPI Buyback",
    },
    {
        id: "ddpiMf",
        accessorKey: "ddpiMf",
        header: "DDPI MF",
    }

]