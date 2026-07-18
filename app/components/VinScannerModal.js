"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from "@zxing/library";

function getResultValue(results, variable) {
  const entry = results.find((r) => r.Variable === variable);
  const value = entry ? entry.Value : null;
  return value && value.trim() !== "" ? value.trim() : null;
}

export default function VinScannerModal({ onVehicleFound, onClose }) {
  const videoRef = useRef(null);
  const [manualVin, setManualVin] = useState("");
  const [status, setStatus] = useState("Requesting camera access...");
  const [isDecoding, setIsDecoding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_39, BarcodeFormat.DATA_MATRIX]);
    const codeReader = new BrowserMultiFormatReader(hints);

    codeReader
      .decodeFromConstraints({ video: { facingMode: "environment" } }, videoRef.current, (result) => {
        if (result) {
          handleDetectedCode(result.getText());
        }
      })
      .then(() => setStatus("Scanning..."))
      .catch((err) => {
        console.error("Camera error:", err);
        setStatus("Camera unavailable - use manual entry below");
      });

    return () => {
      codeReader.reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDetectedCode(text) {
    if (navigator.vibrate) navigator.vibrate(200);
    if (text.length !== 17) {
      setError("Scanned code is not a valid 17-character VIN.");
      return;
    }
    await decodeVin(text);
  }

  async function decodeVin(vin) {
    setIsDecoding(true);
    setError("");
    try {
      const res = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${encodeURIComponent(vin)}?format=json`
      );
      if (!res.ok) throw new Error(`NHTSA API error (${res.status}).`);
      const data = await res.json();
      const results = data.Results || [];

      const errorCode = getResultValue(results, "Error Code");
      if (errorCode && errorCode !== "0") {
        const errorText = getResultValue(results, "Error Text");
        throw new Error(errorText || "This VIN could not be decoded.");
      }

      const year = getResultValue(results, "Model Year");
      const make = getResultValue(results, "Make");
      const model = getResultValue(results, "Model");

      if (!make || !model) {
        throw new Error("No vehicle data found for this VIN.");
      }

      const carDetails = [year, make, model].filter(Boolean).join(" ");

      const vehicleDetails = {
        manufacturer: getResultValue(results, "Manufacturer Name"),
        vehicleType: getResultValue(results, "Vehicle Type"),
        bodyClass: getResultValue(results, "Body Class"),
        series: getResultValue(results, "Series"),
        trim: getResultValue(results, "Trim"),
        driveType: getResultValue(results, "Drive Type"),
        gvwr: getResultValue(results, "Gross Vehicle Weight Rating From"),
        cylinders: getResultValue(results, "Engine Number of Cylinders"),
        displacement: getResultValue(results, "Displacement (L)"),
        engineModel: getResultValue(results, "Engine Model"),
        engineManufacturer: getResultValue(results, "Engine Manufacturer"),
        engineHp: getResultValue(results, "Engine Brake (hp) From"),
        electrificationLevel: getResultValue(results, "Electrification Level"),
        primaryFuel: getResultValue(results, "Fuel Type - Primary"),
        secondaryFuel: getResultValue(results, "Fuel Type - Secondary"),
        transmissionSpeeds: getResultValue(results, "Transmission Speeds"),
        transmissionStyle: getResultValue(results, "Transmission Style"),
        plantCity: getResultValue(results, "Plant City"),
        plantState: getResultValue(results, "Plant State"),
        plantCountry: getResultValue(results, "Plant Country"),
        airbagFront: getResultValue(results, "Front Air Bag Locations"),
        airbagKnee: getResultValue(results, "Knee Air Bag Locations"),
        airbagSide: getResultValue(results, "Side Air Bag Locations"),
        airbagCurtain: getResultValue(results, "Curtain Air Bag Locations"),
        airbagSeatCushion: getResultValue(results, "Seat Cushion Air Bag Locations"),
        otherRestraintInfo: getResultValue(results, "Other Restraint System Info"),
      };

      onVehicleFound({ carDetails, vin, vehicleDetails });
    } catch (err) {
      setError(err.message || "Unable to decode this VIN.");
    } finally {
      setIsDecoding(false);
    }
  }

  function handleManualScan() {
    const value = manualVin.trim();
    if (!value) return;
    handleDetectedCode(value);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Scan VIN</h2>
          <button type="button" onClick={onClose} className="text-sm text-slate-500">
            Close
          </button>
        </div>

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded bg-black">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        </div>
        <p className="mt-2 text-xs text-slate-500">{status}</p>

        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={manualVin}
            onChange={(e) => setManualVin(e.target.value)}
            placeholder="Or enter VIN manually"
            maxLength={17}
            className="flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={handleManualScan}
            className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white"
          >
            Scan
          </button>
        </div>

        {isDecoding && <p className="mt-2 text-xs text-slate-500">Decoding VIN...</p>}
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
