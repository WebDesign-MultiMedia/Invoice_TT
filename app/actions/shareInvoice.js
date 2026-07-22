"use server";

import { createShareToken, resolveShareToken } from "../lib/shareToken";
import { getPublicBaseUrl } from "../lib/baseUrl";

async function findReceiptById(invoiceId) {
  const res = await fetch(process.env.SHEETDB_API_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`SheetDB fetch failed (${res.status})`);
  }
  const rows = await res.json();
  return rows.find((row) => row.id === invoiceId) || null;
}

// Generates (or re-derives, since tokens are deterministic per invoice) the
// public share URL for an invoice. Confirms the invoice actually exists
// before minting a link for it.
export async function getInvoiceShareUrl(invoiceId) {
  try {
    if (!invoiceId) {
      throw new Error("Missing invoice ID.");
    }

    const receipt = await findReceiptById(invoiceId);
    if (!receipt) {
      throw new Error("Invoice not found.");
    }

    const token = createShareToken(invoiceId);
    const baseUrl = getPublicBaseUrl();

    return { success: true, url: `${baseUrl}/invoice/${token}` };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function parseVehicleDetails(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Strips a raw SheetDB row down to only the fields safe to show on the
// public, unauthenticated invoice page - matches exactly what the emailed
// receipt already shows the customer (see buildReceiptEmailHtml). Excludes
// clientEmail/clientPhone since those aren't displayed as content on the
// existing customer-facing receipt either, only used as delivery channels.
function toPublicInvoice(row) {
  return {
    id: row.id,
    clientName: row.clientName || "",
    carDetails: row.carDetails || "",
    mileage: row.mileage || "",
    jobDetails: row.jobDetails || "",
    vin: row.vin || "",
    vehicleDetails: parseVehicleDetails(row.vehicleSpecifications),
    totalAmount: row.totalAmount || "",
    paymentMethod: row.paymentMethod || "",
    paymentStatus: row.paymentStatus || "PAID",
    dateCreated: row.dateCreated || "",
  };
}

// Resolves a public share token back to a customer-safe invoice snapshot.
// Never throws information about *why* a token failed (invalid token vs.
// invoice missing are both reported identically) so an unknown/garbage
// token can't be used to probe for valid invoice IDs.
export async function getPublicInvoiceByToken(token) {
  try {
    const invoiceId = resolveShareToken(token);
    if (!invoiceId) {
      return { success: false, reason: "not_found" };
    }

    const receipt = await findReceiptById(invoiceId);
    if (!receipt) {
      return { success: false, reason: "not_found" };
    }

    return { success: true, invoice: toPublicInvoice(receipt) };
  } catch (error) {
    return { success: false, reason: "server_error", error: error.message };
  }
}
