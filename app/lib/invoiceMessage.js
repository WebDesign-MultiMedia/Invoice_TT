// Builds the manual SMS message text for an invoice/receipt. Never includes
// VIN, vehicle specs, internal notes, or any URL that doesn't safely exist.

function getFirstName(fullName) {
  if (!fullName) return "there";
  const parts = String(fullName).trim().split(/\s+/);
  return parts[0] || "there";
}

function formatCurrency(amount) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return null;
  return `$${numeric.toFixed(2)}`;
}

function formatDate(dateValue) {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// invoice: { id, totalAmount, dateCreated, dueDate?, publicUrl? }
// customer: { name, phone }
// business: reserved for future use (e.g. shop name); not in the default templates.
export function buildInvoiceSmsMessage(invoice = {}, customer = {}, business = {}) {
  const firstName = getFirstName(customer.name);
  const invoiceNumber = invoice.id || null;
  const total = formatCurrency(invoice.totalAmount);
  const invoiceDate = formatDate(invoice.dateCreated);
  const dueDate = formatDate(invoice.dueDate);

  const parts = [`Hello ${firstName},`];

  if (invoiceNumber && total) {
    parts.push(`your invoice ${invoiceNumber} for ${total} is ready.`);
  } else if (total) {
    parts.push(`your invoice for ${total} is ready.`);
  } else if (invoiceNumber) {
    parts.push(`your invoice ${invoiceNumber} is ready.`);
  } else {
    parts.push("your invoice is ready.");
  }

  if (dueDate) {
    parts.push(`Due date: ${dueDate}.`);
  } else if (invoiceDate) {
    parts.push(`Invoice date: ${invoiceDate}.`);
  }

  if (invoice.publicUrl) {
    parts.push(invoice.publicUrl);
  }

  parts.push("Thank you.");

  return parts.join(" ");
}
