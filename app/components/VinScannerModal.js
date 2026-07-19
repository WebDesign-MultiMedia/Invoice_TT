"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from "@zxing/library";

const isDev = process.env.NODE_ENV !== "production";

function devLog(...args) {
  if (isDev) {
    console.log(...args);
  }
}

// --- VIN normalization / validation / extraction helpers -----------------

// Cleans up raw scanner/manual input: uppercases, strips whitespace and
// control characters, and trims punctuation from the edges (e.g. "VIN:...").
function normalizeVinInput(rawValue) {
  if (rawValue === null || rawValue === undefined) return "";
  let value = String(rawValue).toUpperCase();
  value = value.replace(/[\s\x00-\x1F\x7F]/g, "");
  value = value.replace(/^[^A-Z0-9]+/, "").replace(/[^A-Z0-9]+$/, "");
  return value;
}

// VINs never contain I, O, or Q, so the valid alphabet excludes them.
function isValidVinFormat(vin) {
  return typeof vin === "string" && /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);
}

const VIN_TRANSLITERATION = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
  0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9,
};
const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

// Standard North American VIN check-digit algorithm (position 9). Used only
// to prefer the correct candidate among several possible 17-char substrings
// found in a larger barcode payload - not a hard requirement, since some
// valid VINs (e.g. non-North-American vehicles) may not follow it.
function calculateVinCheckDigit(vin) {
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const value = VIN_TRANSLITERATION[vin[i]];
    if (value === undefined) return null;
    sum += value * VIN_WEIGHTS[i];
  }
  const remainder = sum % 11;
  return remainder === 10 ? "X" : String(remainder);
}

function hasValidVinCheckDigit(vin) {
  if (!isValidVinFormat(vin)) return false;
  const expected = calculateVinCheckDigit(vin);
  return expected !== null && vin[8] === expected;
}

// Finds a VIN inside a raw barcode/manual-entry payload that may contain
// extra data (PDF417 registration payloads, "VIN:" prefixes, surrounding
// junk text, stray whitespace, etc.) rather than assuming the whole string
// is exactly the VIN.
function extractVinFromBarcode(rawText) {
  if (!rawText) return null;

  const normalized = normalizeVinInput(rawText);
  if (isValidVinFormat(normalized)) {
    return normalized;
  }

  const upper = String(rawText).toUpperCase();
  const runs = upper.match(/[A-HJ-NPR-Z0-9]+/g) || [];

  const candidates = [];
  for (const run of runs) {
    if (run.length < 17) continue;
    for (let i = 0; i <= run.length - 17; i++) {
      candidates.push(run.slice(i, i + 17));
    }
  }

  if (candidates.length === 0) return null;

  const checksumMatch = candidates.find((candidate) => hasValidVinCheckDigit(candidate));
  if (checksumMatch) return checksumMatch;

  // Only one structurally valid candidate but it fails the checksum - let
  // the NHTSA API make the final call rather than rejecting it outright.
  if (candidates.length === 1) {
    return candidates[0];
  }

  return null;
}

function getResultValue(results, variable) {
  const entry = results.find((r) => r.Variable === variable);
  const value = entry ? entry.Value : null;
  return value && value.trim() !== "" ? value.trim() : null;
}

export default function VinScannerModal({ onVehicleFound, onClose }) {
  const videoRef = useRef(null);
  const scannerControlsRef = useRef(null); // holds the active BrowserMultiFormatReader instance
  const isProcessingRef = useRef(false); // guards against duplicate decode calls from rapid frames
  const lastScannedVinRef = useRef(null); // last VIN already sent to decodeVin, from camera scanning
  const isMountedRef = useRef(true);

  const [manualVin, setManualVin] = useState("");
  const [status, setStatus] = useState("Requesting camera access...");
  const [isDecoding, setIsDecoding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    isMountedRef.current = true;

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_128,
      BarcodeFormat.DATA_MATRIX,
      BarcodeFormat.PDF_417,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const codeReader = new BrowserMultiFormatReader(hints);
    scannerControlsRef.current = codeReader;

    function handleScanResult(result) {
      if (!isMountedRef.current) return;
      if (isProcessingRef.current) return;
      if (!result) return; // no barcode in this frame - completely normal, not an error

      const rawText = result.getText();
      const format = result.getBarcodeFormat ? result.getBarcodeFormat() : undefined;

      devLog("Barcode detected", { format, length: rawText ? rawText.length : 0 });

      const candidate = extractVinFromBarcode(rawText);

      if (!candidate) {
        // Unrelated barcode - keep scanning silently, no red error.
        setStatus("Barcode detected. Looking for VIN...");
        return;
      }

      if (lastScannedVinRef.current === candidate) {
        return; // already processed this VIN, avoid duplicate NHTSA requests
      }

      devLog("Extracted VIN candidate", candidate);

      lastScannedVinRef.current = candidate;
      isProcessingRef.current = true;

      if (navigator.vibrate) navigator.vibrate(200);
      setManualVin(candidate);
      setStatus(`VIN found: ${candidate}`);
      setError("");

      decodeVinAndNotify(candidate).finally(() => {
        isProcessingRef.current = false;
      });
    }

    async function startScanning() {
      const supported =
        (navigator.mediaDevices && navigator.mediaDevices.getSupportedConstraints
          ? navigator.mediaDevices.getSupportedConstraints()
          : {}) || {};

      const preferredConstraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          ...(supported.focusMode ? { advanced: [{ focusMode: "continuous" }] } : {}),
        },
      };
      const simpleConstraints = { video: { facingMode: "environment" } };

      try {
        await codeReader.decodeFromConstraints(preferredConstraints, videoRef.current, handleScanResult);
        if (isMountedRef.current) setStatus("Scanning for VIN barcode...");
      } catch (err) {
        devLog("Preferred camera constraints failed, retrying with simpler constraints", err);
        try {
          await codeReader.decodeFromConstraints(simpleConstraints, videoRef.current, handleScanResult);
          if (isMountedRef.current) setStatus("Scanning for VIN barcode...");
        } catch (err2) {
          console.error("Camera error:", err2);
          if (isMountedRef.current) setStatus("Camera unavailable — enter the VIN manually.");
        }
      }
    }

    startScanning();

    return () => {
      isMountedRef.current = false;
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopScanning() {
    const reader = scannerControlsRef.current;
    if (reader) {
      try {
        reader.reset(); // stops decoding loop and all video tracks
      } catch (err) {
        devLog("Error stopping scanner", err);
      }
    }
    // Defensive fallback in case a stream is still attached to the element.
    const video = videoRef.current;
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    }
  }

  async function decodeVinAndNotify(vin) {
    setIsDecoding(true);
    setError("");
    setStatus("Decoding vehicle information...");
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

      if (!isMountedRef.current) return;

      stopScanning();
      onVehicleFound({ carDetails, vin, vehicleDetails });
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err.message || "Unable to decode this VIN.");
      setStatus("Scanning for VIN barcode...");
    } finally {
      if (isMountedRef.current) setIsDecoding(false);
    }
  }

  function handleManualScan() {
    const candidate = extractVinFromBarcode(manualVin);
    if (!candidate) {
      setError("No valid 17-character VIN was found.");
      return;
    }
    setManualVin(candidate);
    setError("");
    devLog("Manual VIN candidate", candidate);
    decodeVinAndNotify(candidate);
  }

  function handleClose() {
    stopScanning();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Scan VIN</h2>
          <button type="button" onClick={handleClose} className="text-sm text-slate-500">
            Close
          </button>
        </div>

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded bg-black">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />

          {/* Barcode alignment guide - helps position/size the barcode for a better scan */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-[26%] w-[88%] rounded-md border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
                Fill this box with the barcode
              </span>
              {/* Corner accents */}
              <div className="absolute -left-0.5 -top-0.5 h-3 w-3 border-l-2 border-t-2 border-white" />
              <div className="absolute -right-0.5 -top-0.5 h-3 w-3 border-r-2 border-t-2 border-white" />
              <div className="absolute -bottom-0.5 -left-0.5 h-3 w-3 border-b-2 border-l-2 border-white" />
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 border-b-2 border-r-2 border-white" />
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">{status}</p>

        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={manualVin}
            onChange={(e) => setManualVin(normalizeVinInput(e.target.value))}
            placeholder="Or enter VIN manually"
            className="flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={handleManualScan}
            disabled={isDecoding}
            className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Scan
          </button>
        </div>

        {isDecoding && <p className="mt-2 text-xs text-slate-500">Decoding vehicle information...</p>}
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
