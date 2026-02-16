// src/app/company/employees/[id]/page.js
import { mysql_getEmployeeById } from "@/context/mysqlConnection"; // <--- Fixed Import
import EmployeeClient from "./EmployeeClient";
import { notFound } from "next/navigation";
import { getAccessLevelOptions } from "../actions";

const accessLevelOptions = await getAccessLevelOptions();

// Force dynamic rendering so we always get fresh data (important for admin tools)
export const dynamic = 'force-dynamic';

export default async function EmployeeDetailPage({ params }) {
  // 1. Await params (Required in Next.js 15+)
  const { id } = await params;

  // 2. Fetch employee data
  const employee = await mysql_getEmployeeById(id);

  // 3. Handle record not found (404)
  if (!employee) {
    notFound();
  }

  return (
    <div className="animate-in fade-in duration-500">
      {/* Pass the data to the Client Component */}
      <EmployeeClient employee={employee} accessLevelOptions={accessLevelOptions} />
    </div>
  );
}