"use client";

import { useState } from "react";
import { processReceiptAndNotify } from "./actions/receipt";
import VinScannerModal from "./components/VinScannerModal";

const DEMO_DATA = {
  clientName: "Jane Smith",
  clientEmail: "jane@example.com",
  clientPhone: "+15550192831",
  carDetails: "2019 Toyota RAV4",
  vin: "1HGCM82633A004352",
  vehicleDetails: {
    manufacturer: "TOYOTA MOTOR MANUFACTURING",
    vehicleType: "MULTIPURPOSE PASSENGER VEHICLE (MPV)",
    bodyClass: "Sport Utility Vehicle (SUV)",
    series: "XLE",
    trim: "XLE Premium",
    driveType: "AWD",
    gvwr: "Class 1D: 5,001 - 6,000 lb",
    cylinders: "4",
    displacement: "2.5",
    engineModel: "2AR-FE",
    engineManufacturer: "Toyota",
    engineHp: "203",
    electrificationLevel: "",
    primaryFuel: "Gasoline",
    secondaryFuel: "",
    transmissionSpeeds: "8",
    transmissionStyle: "Automatic",
    plantCity: "Georgetown",
    plantState: "Kentucky",
    plantCountry: "United States (USA)",
    airbagFront: "1st Row (Driver and Passenger)",
    airbagKnee: "",
    airbagSide: "1st Row (Driver and Passenger)",
    airbagCurtain: "All Rows",
    airbagSeatCushion: "",
    otherRestraintInfo: "Seat Belt (Rear center position).",
  },
  mileage: "42,300",
  jobDetails: "Alternator Replacement & Battery Maintenance",
  totalAmount: "420.00",
  paymentMethod: "Zelle",
};

const EMPTY_FORM = {
  clientName: "",
  clientEmail: "",
  clientPhone: "",
  carDetails: "",
  vin: "",
  vehicleDetails: null,
  mileage: "",
  jobDetails: "",
  totalAmount: "",
  paymentMethod: "Cash",
};

function VehicleDetailsCard({ vin, vehicleDetails }) {
  const vd = vehicleDetails || {};
  const plantLocation = [vd.plantCity, vd.plantState, vd.plantCountry].filter(Boolean).join(", ");

  const specs = [
    ["Manufacturer", vd.manufacturer],
    ["Vehicle Type", vd.vehicleType],
    ["Body Class", vd.bodyClass],
    ["Series", vd.series],
    ["Trim", vd.trim],
    ["GVWR", vd.gvwr],
    ["Drive Type", vd.driveType],
    ["Cylinders", vd.cylinders],
    ["Primary Fuel Type", vd.primaryFuel],
    ["Electrification Level", vd.electrificationLevel],
    ["Secondary Fuel Type", vd.secondaryFuel],
    ["Engine Model", vd.engineModel],
    ["Engine Brake (HP)", vd.engineHp],
    ["Engine Manufacturer", vd.engineManufacturer],
    ["Displacement (L)", vd.displacement],
    ["Transmission Speeds", vd.transmissionSpeeds],
    ["Transmission Style", vd.transmissionStyle],
    ["Plant Location", plantLocation],
  ].filter(([, value]) => value);

  const airbags = [
    ["Front", vd.airbagFront],
    ["Knee", vd.airbagKnee],
    ["Side", vd.airbagSide],
    ["Curtain", vd.airbagCurtain],
    ["Seat Cushion", vd.airbagSeatCushion],
    ["Other Restraint Info", vd.otherRestraintInfo],
  ].filter(([, value]) => value);

  if (!vin && specs.length === 0 && airbags.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Full Vehicle Specifications
      </p>

      <div className="space-y-1 text-slate-700">
        {vin && (
          <p>
            <span className="text-slate-500">VIN:</span> {vin}
          </p>
        )}
        {specs.map(([label, value]) => (
          <p key={label}>
            <span className="text-slate-500">{label}:</span> {value}
          </p>
        ))}
      </div>

      {airbags.length > 0 && (
        <div className="mt-3 border-t border-slate-200 pt-2">
          <p className="mb-1 text-xs font-semibold text-slate-700">Airbags</p>
          <ul className="list-disc space-y-0.5 pl-4 text-slate-700">
            {airbags.map(([label, value]) => (
              <li key={label}>
                <span className="text-slate-500">{label}:</span> {value}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function loadDemoData() {
    setForm(DEMO_DATA);
    setResult(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setResult(null);

    const response = await processReceiptAndNotify(form);

    setResult(response);
    setIsSubmitting(false);

    if (response.success) {
      setForm(EMPTY_FORM);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 py-8 px-4 sm:py-12">
      <div className="mx-auto w-full max-w-lg">
        {/* Shop header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-500 text-xl">
            🔧
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Paid Receipt & Invoice Generator
            </h1>
            <p className="text-sm text-slate-500">Internal tool — front desk use only</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <button
              type="button"
              onClick={loadDemoData}
              className="w-full rounded-lg border border-dashed border-orange-300 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
            >
              ⚡ Load Demo Data
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-5 sm:p-6">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Scan VIN (optional)
            </button>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Customer Name
              </label>
              <input
                type="text"
                name="clientName"
                value={form.clientName}
                onChange={handleChange}
                required
                placeholder="John Doe"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  name="clientEmail"
                  value={form.clientEmail}
                  onChange={handleChange}
                  required
                  placeholder="john@example.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="clientPhone"
                  value={form.clientPhone}
                  onChange={handleChange}
                  required
                  placeholder="+15555550100"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Car Info (Year / Make / Model)
              </label>
              <input
                type="text"
                name="carDetails"
                value={form.carDetails}
                onChange={handleChange}
                required
                placeholder="2019 Toyota RAV4"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Mileage <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                type="text"
                name="mileage"
                value={form.mileage}
                onChange={handleChange}
                placeholder="42,300"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Job / Service Details
              </label>
              <textarea
                name="jobDetails"
                value={form.jobDetails}
                onChange={handleChange}
                required
                rows={3}
                placeholder="Alternator Replacement & Battery Maintenance"
                className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Total Amount ($)
              </label>
              <input
                type="number"
                name="totalAmount"
                value={form.totalAmount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="420.00"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
                {["Cash", "Zelle"].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, paymentMethod: method }))}
                    className={`rounded-md py-2 text-sm font-semibold transition ${
                      form.paymentMethod === method
                        ? "bg-slate-900 text-white shadow"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-lg bg-orange-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Sending Receipt...
                </span>
              ) : (
                "Generate & Send Paid Receipt"
              )}
            </button>

            <VehicleDetailsCard vin={form.vin} vehicleDetails={form.vehicleDetails} />

            {result?.success && (
              <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
                ✅ Receipt logged and sent — email & text delivered to the customer.
              </div>
            )}

            {result && !result.success && (
              <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                ❌ Failed to send receipt: {result.error}
              </div>
            )}
          </form>
        </div>
      </div>

      {isScannerOpen && (
        <VinScannerModal
          onVehicleFound={({ carDetails, vin, vehicleDetails }) => {
            setForm((prev) => ({ ...prev, carDetails, vin, vehicleDetails }));
            setIsScannerOpen(false);
          }}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
    </main>
  );
}
