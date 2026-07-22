"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getRecentReceipts } from "../actions/getReceipts";
import TextInvoiceModal from "./TextInvoiceModal";

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function RecentReceiptsPanel({ refreshKey }) {
  const [receipts, setReceipts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [textInvoiceTarget, setTextInvoiceTarget] = useState(null);
  const activeTriggerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      const response = await getRecentReceipts({ limit: 4 });
      if (cancelled) return;

      if (response.success) {
        setReceipts(response.receipts);
        setError("");
      } else {
        setError(response.error);
      }
      setIsLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <div className="flex w-full flex-col border-t border-slate-800 bg-slate-950 p-4 sm:p-5 lg:h-full lg:w-80 lg:border-l lg:border-t-0">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100">Recent Receipts</h2>
      </div>

      {isLoading && <p className="text-xs text-slate-500">Loading...</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
      {!isLoading && !error && receipts.length === 0 && (
        <p className="text-xs text-slate-500">No receipts yet.</p>
      )}

      <div className="flex flex-col gap-3">
        {receipts.map((receipt) => (
          <div
            key={receipt.id}
            className="rounded-xl border border-slate-800 bg-slate-900 p-3"
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                {initials(receipt.clientName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-100">
                  {receipt.clientName || "Unknown"}
                </p>
                <p className="truncate text-xs text-slate-500">{receipt.carDetails}</p>
              </div>
              <span className="shrink-0 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-400">
                PAID
              </span>
            </div>
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <span>{receipt.paymentMethod}</span>
              <span className="font-semibold text-slate-200">${receipt.totalAmount}</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                activeTriggerRef.current = e.currentTarget;
                setTextInvoiceTarget(receipt);
              }}
              className="w-full rounded border border-slate-700 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
            >
              💬 Text Invoice
            </button>
          </div>
        ))}
      </div>

      <Link
        href="/history"
        className="mt-4 w-full rounded-lg bg-blue-600 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        View history
      </Link>

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
