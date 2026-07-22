"use client";

import { useEffect, useRef, useState } from "react";
import { getRecentReceipts } from "../../actions/getReceipts";
import VehicleSpecsCard from "../../components/VehicleSpecsCard";
import TextInvoiceModal from "../../components/TextInvoiceModal";

function parseVehicleDetails(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function Field({ label, value }) {
  if (!value) return null;
  return (
    <p>
      <span className="text-slate-500">{label}:</span>{" "}
      <span className="text-slate-200">{value}</span>
    </p>
  );
}

export default function HistoryPage() {
  const [query, setQuery] = useState("");
  const [receipts, setReceipts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [textInvoiceTarget, setTextInvoiceTarget] = useState(null);
  const activeTriggerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const timeout = setTimeout(async () => {
      const response = await getRecentReceipts({ limit: null, search: query });
      if (cancelled) return;

      if (response.success) {
        setReceipts(response.receipts);
        setError("");
      } else {
        setError(response.error);
      }
      setIsLoading(false);
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-100">Receipt History</h1>
          <p className="text-sm text-slate-500">All paid receipts logged to SheetDB</p>
        </div>
      </div>

      <div className="relative mb-6">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
          <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by customer name, car, or VIN..."
          className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2.5 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {isLoading && <p className="text-sm text-slate-500">Loading...</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {!isLoading && !error && receipts.length === 0 && (
        <p className="text-sm text-slate-500">No matching receipts found.</p>
      )}

      <div className="flex flex-col gap-4">
        {receipts.map((receipt) => {
          const vehicleDetails = parseVehicleDetails(receipt.vehicleSpecifications);
          const formattedDate = receipt.dateCreated
            ? new Date(receipt.dateCreated).toLocaleString()
            : "";

          return (
            <div
              key={receipt.id}
              className="rounded-xl border border-slate-800 bg-slate-800/40 p-4 sm:p-5"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{receipt.clientName}</p>
                  <p className="text-xs text-slate-500">Receipt #{receipt.id}</p>
                </div>
                <span className="shrink-0 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-400">
                  {receipt.paymentStatus || "PAID"}
                </span>
              </div>

              <div className="mb-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2">
                <Field label="Customer Email" value={receipt.clientEmail} />
                <Field label="Customer Phone" value={receipt.clientPhone} />
                <Field label="Car Info" value={receipt.carDetails} />
                <Field label="Car VIN" value={receipt.vin} />
                <Field label="Car Mileage" value={receipt.mileage} />
                <Field label="Payment Method" value={receipt.paymentMethod} />
                <Field label="Total Amount" value={receipt.totalAmount ? `$${receipt.totalAmount}` : ""} />
                <Field label="Date" value={formattedDate} />
              </div>

              <div className="mb-3 text-xs">
                <p className="text-slate-500">Job / Service Details:</p>
                <p className="mt-0.5 text-slate-200">{receipt.jobDetails}</p>
              </div>

              <VehicleSpecsCard vehicleDetails={vehicleDetails} />

              <button
                type="button"
                onClick={(e) => {
                  activeTriggerRef.current = e.currentTarget;
                  setTextInvoiceTarget(receipt);
                }}
                className="mt-3 w-full rounded border border-slate-700 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
              >
                💬 Text Invoice
              </button>
            </div>
          );
        })}
      </div>

      {textInvoiceTarget && (
        <TextInvoiceModal
          invoice={textInvoiceTarget}
          onClose={() => setTextInvoiceTarget(null)}
          triggerRef={activeTriggerRef}
        />
      )}
    </div>
  );
}
