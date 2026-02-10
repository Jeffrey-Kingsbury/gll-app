"use server";
import { revalidatePath } from "next/cache";
import { queryMySQL } from "../../../context/mysqlConnection"; // Assuming your generic query helper
// import { pool } from "../../../context/mysqlConnection"; // Assume this exists
export async function getProjectsAction() {
  try {
    // Fetching internalid and name as requested
    const projects = await queryMySQL("SELECT internalid, name, client_name FROM projects ORDER BY name ASC");
    return JSON.parse(JSON.stringify(projects));
  } catch (e) {
    console.error("Error fetching projects", e);
    // Fallback mock data if DB fails
    return [
      { internalid: 1, name: "Smith Kitchen Reno", client_name: "John Smith" },
      { internalid: 2, name: "Downtown Office", client_name: "TechCorp" },
    ];
  }
}
// MOCK DATA for demonstration (Replace with actual MySQL queries)
const MOCK_ESTIMATES = [
  { id: 101, project: "Smith Kitchen Reno", client: "John Smith", total: 45000.00, status: "Draft", date: "2026-02-08" },
  { id: 102, project: "Downtown Office", client: "TechCorp", total: 120000.00, status: "Sent", date: "2026-02-05" },
];


export async function getTemplatesAction() {
  return [
    { id: "default", name: "Standard Renovation" },
    { id: "kitchen", name: "Kitchen Remodel" },
    { id: "bathroom", name: "Bathroom Refresh" },
    { id: "deck", name: "Deck & Patio" },
  ];
}

export async function getTemplateItemsAction(templateId) {
  // Return different items based on ID
  const baseItems = [
    { code: "100", category: "Demolition", subcategory: "Site Prep", details: "Remove existing fixtures", labor: 0, material: 0 },
    { code: "200", category: "Framing", subcategory: "Lumber", details: "2x4 and 2x6 material", labor: 0, material: 0 },
    { code: "300", category: "Electrical", subcategory: "Rough-in", details: "Wiring and boxes", labor: 0, material: 0 },
  ];

  if (templateId === 'kitchen') {
      return [
          ...baseItems,
          { code: "400", category: "Cabinetry", subcategory: "Install", details: "Base and upper cabinets", labor: 0, material: 0 },
          { code: "401", category: "Cabinetry", subcategory: "Hardware", details: "Handles and pulls", labor: 0, material: 0 },
      ];
  }
  
  return baseItems;
}

export async function getEstimatesAction() {
  // await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
  return MOCK_ESTIMATES;
}

export async function getEstimateByIdAction(id) {
  // Return specific estimate data + line items
  return null; // Implement fetch logic
}

export async function saveEstimateAction(data) {
  console.log("Saving Estimate to DB:", data);
  // INSERT INTO estimates ...
  // INSERT INTO estimate_items ...
  revalidatePath("/estimates");
  return { success: true, newId: Math.floor(Math.random() * 1000) };
}

export async function getEstimateTemplateAction() {
    // This returns the default rows for a new estimate
    // You can move your `ESTIMATE_ITEMS` constant here
    return [
        { code: "100", category: "Demolition", subcategory: "Site Prep", details: "Remove existing fixtures", cost: 0 },
        { code: "101", category: "Demolition", subcategory: "Disposal", details: "Bin rental and fees", cost: 0 },
        { code: "200", category: "Framing", subcategory: "Lumber", details: "2x4 and 2x6 material", cost: 0 },
        { code: "201", category: "Framing", subcategory: "Labor", details: "Carpentry crew", cost: 0 },
        { code: "300", category: "Electrical", subcategory: "Rough-in", details: "Wiring and boxes", cost: 0 },
    ];
}