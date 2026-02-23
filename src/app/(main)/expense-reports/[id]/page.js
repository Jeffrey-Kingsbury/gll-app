import { notFound } from "next/navigation";
import { getExpenseReportAction, getPendingTimeEntriesAction } from "../actions";
import ExpenseReportClient from "./ExpenseReportClient";

export const dynamic = 'force-dynamic';

export default async function ExpenseReportPage({ params }) {
    const { id } = await params;

    const data = await getExpenseReportAction(id);
    if (!data) return notFound();

    // Fetch pending time entries based on the project linked to this report
    const pendingEntries = await getPendingTimeEntriesAction(data.report.project_id);

    return (
        <ExpenseReportClient
            report={data.report}
            lines={data.lines}
            pendingEntries={pendingEntries || []}
        />
    );
}