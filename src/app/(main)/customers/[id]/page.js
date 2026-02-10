import { mysql_getCustomerById, mysql_getAllImages } from "../../../../context/mysqlConnection";
import CustomerClient from "./CustomerClient.js.js";
import { notFound } from "next/navigation";

export default async function CustomerPage({ params }) {
  const { id } = await params;
  
  // Parallel Data Fetching
  const customerData = mysql_getCustomerById(id);
  const imagesData = mysql_getAllImages();

  const [customer, allImages] = await Promise.all([customerData, imagesData]);

  if (!customer) {
    notFound();
  }

  return (
    <div className="p-6">
      <CustomerClient customer={customer} allImages={allImages} />
    </div>
  );
}