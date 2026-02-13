// app/company/employees/[id]/page.js
import { mysql_getEmployeeById } from "../../../../../context/mysqlConnection";
import EmployeeClient from "./EmployeeClient";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function EmployeeDetailPage({ params }) {
  // 1. Await params in Next.js 15+
  const { id } = await params;

  // 2. Fetch employee data
  const employee = await mysql_getEmployeeById(id);

  // 3. Handle record not found
  if (!employee) {
    notFound();
  }

  return (
    <div className="animate-in fade-in duration-500">
      <EmployeeClient employee={employee} />
    </div>
  );
}