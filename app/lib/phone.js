// Reusable U.S. phone number utilities - no external dependency, since the
// project doesn't already use a phone-number library.

function stripFormatting(value) {
  return String(value ?? "").replace(/[\s().-]/g, "");
}

function toTenDigits(rawValue) {
  const stripped = stripFormatting(rawValue).replace(/^\+/, "");
  if (!/^\d+$/.test(stripped)) return null;
  if (stripped.length === 10) return stripped;
  if (stripped.length === 11 && stripped.startsWith("1")) return stripped.slice(1);
  return null;
}

export function isValidUSPhoneNumber(rawValue) {
  return toTenDigits(rawValue) !== null;
}

// Normalizes a valid U.S. number to E.164 form, e.g. "+19292463822".
// Returns null if the input isn't a valid U.S. number.
export function normalizeUSPhoneNumber(rawValue) {
  const tenDigits = toTenDigits(rawValue);
  return tenDigits ? `+1${tenDigits}` : null;
}

// Formats a valid U.S. number for display, e.g. "(929) 246-3822".
// Returns the original input unchanged if it isn't a valid U.S. number.
export function formatUSPhoneNumber(rawValue) {
  const tenDigits = toTenDigits(rawValue);
  if (!tenDigits) return rawValue ?? "";
  return `(${tenDigits.slice(0, 3)}) ${tenDigits.slice(3, 6)}-${tenDigits.slice(6)}`;
}

// Masks a valid U.S. number for display in activity logs, e.g. "(***) ***-3822".
// Returns an empty string if the input isn't a valid U.S. number.
export function maskUSPhoneNumber(rawValue) {
  const tenDigits = toTenDigits(rawValue);
  if (!tenDigits) return "";
  return `(***) ***-${tenDigits.slice(6)}`;
}
