"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  formatUSPhoneNumber,
  isValidUSPhoneNumber,
  normalizeUSPhoneNumber,
} from "../lib/phone";
import { buildInvoiceSmsMessage } from "../lib/invoiceMessage";
import { copyTextToClipboard, openManualSmsComposer } from "../lib/manualSms";

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function formatInvoiceDate(dateValue) {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function TextInvoiceModal({ invoice, onClose, triggerRef }) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const phoneErrorId = useId();
  const statusRegionId = useId();

  const [phoneInput, setPhoneInput] = useState(invoice.clientPhone || "");
  const [message, setMessage] = useState(() =>
    buildInvoiceSmsMessage(invoice, { name: invoice.clientName, phone: invoice.clientPhone }, {})
  );
  const [phoneError, setPhoneError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    closeButtonRef.current?.focus();

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.disabled
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClose() {
    onClose();
    if (triggerRef && triggerRef.current) {
      triggerRef.current.focus();
    }
  }

  async function handleCopyMessage() {
    const copied = await copyTextToClipboard(message);
    setStatusMessage(
      copied ? "Message copied to clipboard." : "Copy the message manually, then open Messages."
    );
  }

  async function handleOpenMessages() {
    if (!isValidUSPhoneNumber(phoneInput)) {
      setPhoneError("Enter a valid U.S. phone number (10 digits, or 11 digits starting with 1).");
      return;
    }
    setPhoneError("");
    const normalized = normalizeUSPhoneNumber(phoneInput);

    const copied = await copyTextToClipboard(message);
    setStatusMessage(
      copied
        ? "Message copied and Messages opened. Paste the message, review it, and press Send."
        : "Copy the message manually, then open Messages."
    );

    openManualSmsComposer(normalized);
  }

  async function handleShare() {
    if (!canShare) return;
    try {
      await navigator.share({
        title: invoice.id ? `Invoice ${invoice.id}` : "Invoice",
        text: message,
      });
    } catch (err) {
      // User cancelled the share sheet, or sharing failed silently - this is
      // not an app error, so no failure message is shown.
    }
  }

  const invoiceDateLabel = formatInvoiceDate(invoice.dateCreated);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="text-invoice-title"
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="text-invoice-title" className="text-base font-semibold text-slate-900">
            💬 Text Invoice
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            Close
          </button>
        </div>

        <div className="mb-4 space-y-1 rounded-lg bg-slate-50 p-3 text-sm">
          <p>
            <span className="text-slate-500">Customer:</span>{" "}
            <span className="font-medium text-slate-900">{invoice.clientName || "—"}</span>
          </p>
          <p>
            <span className="text-slate-500">Invoice #:</span>{" "}
            <span className="font-medium text-slate-900">{invoice.id || "—"}</span>
          </p>
          <p>
            <span className="text-slate-500">Total:</span>{" "}
            <span className="font-medium text-slate-900">
              {invoice.totalAmount ? `$${invoice.totalAmount}` : "—"}
            </span>
          </p>
          <p>
            <span className="text-slate-500">Date:</span>{" "}
            <span className="font-medium text-slate-900">{invoiceDateLabel || "—"}</span>
          </p>
          {invoice.dueDate && (
            <p>
              <span className="text-slate-500">Due:</span>{" "}
              <span className="font-medium text-slate-900">{invoice.dueDate}</span>
            </p>
          )}
        </div>

        <div className="mb-3">
          <label htmlFor="text-invoice-phone" className="mb-1 block text-sm font-medium text-slate-700">
            Customer mobile number
          </label>
          <input
            id="text-invoice-phone"
            type="tel"
            value={phoneInput}
            onChange={(e) => {
              setPhoneInput(e.target.value);
              if (phoneError) setPhoneError("");
            }}
            aria-invalid={phoneError ? "true" : "false"}
            aria-describedby={phoneError ? phoneErrorId : undefined}
            placeholder="(929) 246-3822"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {isValidUSPhoneNumber(phoneInput) && (
            <p className="mt-1 text-xs text-slate-400">
              Will text: {formatUSPhoneNumber(phoneInput)}
            </p>
          )}
          {phoneError && (
            <p id={phoneErrorId} role="alert" className="mt-1 text-xs text-red-600">
              {phoneError}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label
            htmlFor="text-invoice-message"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Message preview (editable)
          </label>
          <textarea
            id="text-invoice-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full resize-none rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div>
            <button
              type="button"
              onClick={handleOpenMessages}
              className="w-full rounded bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Open Messages
            </button>
            <p className="mt-1 text-[11px] text-slate-500">
              Copies the prepared invoice message and opens your Messages app with the
              customer&apos;s phone number.
            </p>
          </div>

          {canShare && (
            <div>
              <button
                type="button"
                onClick={handleShare}
                className="w-full rounded border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Share Invoice
              </button>
              <p className="mt-1 text-[11px] text-slate-500">
                Opens your device&apos;s share menu so you can choose Messages or another
                application.
              </p>
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={handleCopyMessage}
              className="w-full rounded border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Copy Message
            </button>
            <p className="mt-1 text-[11px] text-slate-500">
              Copies the complete invoice message without opening another application.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-full rounded py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>

        <p id={statusRegionId} aria-live="polite" className="mt-3 min-h-[1rem] text-xs text-slate-600">
          {statusMessage}
        </p>

        <p className="mt-2 text-[11px] text-slate-400">
          This app cannot confirm whether the text was sent - it only opens your Messages app.
          You must review and press Send yourself.
        </p>
      </div>
    </div>
  );
}
