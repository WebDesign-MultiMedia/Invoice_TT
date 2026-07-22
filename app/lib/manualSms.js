// Client-side helpers for the manual SMS workflow. Nothing here ever sends a
// message automatically - it only copies text and opens the device's own
// Messages app, which the user must review and personally press Send in.

// Copies text to the clipboard, with a fallback for browsers/contexts where
// navigator.clipboard is unavailable or permission is denied.
export async function copyTextToClipboard(text) {
  if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // fall through to the legacy fallback below
    }
  }

  if (typeof document === "undefined") return false;

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);
    return successful;
  } catch (err) {
    return false;
  }
}

// Opens the device's Messages app with the customer's number prefilled.
// `normalizedPhoneNumber` must already be a valid E.164 U.S. number
// (e.g. "+19292463822") - callers are responsible for validating first.
// Intentionally does not include a `body` query param: iOS Safari doesn't
// reliably support it, so the message is copied to the clipboard separately
// and the user pastes it themselves.
export function openManualSmsComposer(normalizedPhoneNumber) {
  if (typeof window === "undefined" || !normalizedPhoneNumber) return;
  // Not percent-encoded: the value is already a validated "+" + digits
  // string, and some Messages apps mis-handle an encoded "+" (%2B) in the
  // sms: URI, failing to prefill the recipient correctly.
  window.location.href = `sms:${normalizedPhoneNumber}`;
}
