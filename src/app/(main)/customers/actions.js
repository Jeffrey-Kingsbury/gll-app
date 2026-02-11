"use server";
import { mysql_updateCustomer } from "../../../context/mysqlConnection";
import { revalidatePath } from "next/cache";

export async function updateCustomerAction(formData) {
    const id = formData.get("internalid");
    const name = formData.get("name");

    if (!id || !name) return { error: "Missing required fields" };

    try {
        await mysql_updateCustomer(id, name);
        // Refresh the data on the page so the user sees the update immediately
        revalidatePath(`/customers`);
        return { success: true };
    } catch (error) {
        return { error: "Failed to update customer" };
    }
}