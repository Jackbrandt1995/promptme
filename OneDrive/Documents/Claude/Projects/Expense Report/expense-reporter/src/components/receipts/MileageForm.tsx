"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createManualExpense, getHomeAddress, saveHomeAddress } from "@/lib/actions";
import { formatCurrency } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VLS_ADDRESS = "180 Canal St, Boston, MA 02114";

const CLINICS = [
  { name: "Quincy",  address: "1419 Hancock St, Quincy, MA 02169" },
  { name: "Bedford", address: "200 Springs Rd, Bedford, MA 01730" },
  { name: "Lawrence",address: "439 S Union St, Lawrence, MA 01843" },
  { name: "Chelsea", address: "100 Summit Ave, Chelsea, MA 02150" },
  { name: "NECHV",   address: "17 Court St, Boston, MA 02108" },
  { name: "Brockton",address: "940 Belmont St, Brockton, MA 02301" },
] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MileageResult {
  distanceMiles: number;
  amount: number;
  ratePerMile: number;
  origin: string;
  destination: string;
  durationText: string;
}

interface MileageFormProps {
  reportId?: string;
  onSave?: () => void;
  onCancel?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MileageForm({ reportId, onSave, onCancel }: MileageFormProps) {
  const router = useRouter();

  // address fields
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  // calculation
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<MileageResult | null>(null);
  const [error, setError] = useState("");

  // home address management
  const [homeAddress, setHomeAddress] = useState("");
  const [homeInput, setHomeInput] = useState("");
  const [editingHome, setEditingHome] = useState(false);
  const [savingHome, setSavingHome] = useState(false);
  const [homeError, setHomeError] = useState("");

  // load saved home address on mount
  useEffect(() => {
    getHomeAddress().then((addr) => {
      setHomeAddress(addr);
      setHomeInput(addr);
      if (!addr) setEditingHome(true); // open editor if never set
    });
  }, []);

  // -------------------------------------------------------------------------
  // Shortcut handler — fills fields and auto-calculates
  // -------------------------------------------------------------------------
  const applyShortcut = (from: string, to: string) => {
    setOrigin(from);
    setDestination(to);
    setResult(null);
    setError("");
    // auto-calculate after state settles
    setTimeout(() => calculateDistance(from, to), 0);
  };

  // -------------------------------------------------------------------------
  // Distance calculation
  // -------------------------------------------------------------------------
  const calculateDistance = async (
    fromAddr: string = origin,
    toAddr: string = destination
  ) => {
    if (!fromAddr.trim() || !toAddr.trim()) {
      setError("Please enter both a starting and ending address.");
      return;
    }
    setError("");
    setResult(null);
    setCalculating(true);

    try {
      const res = await fetch("/api/mileage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: fromAddr, destination: toAddr }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to calculate distance.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setCalculating(false);
    }
  };

  const handleCalculate = () => calculateDistance();

  // -------------------------------------------------------------------------
  // Save home address
  // -------------------------------------------------------------------------
  const handleSaveHome = async () => {
    if (!homeInput.trim()) {
      setHomeError("Please enter an address.");
      return;
    }
    setSavingHome(true);
    setHomeError("");
    const res = await saveHomeAddress(homeInput);
    setSavingHome(false);
    if (res.success) {
      setHomeAddress(homeInput.trim());
      setEditingHome(false);
    } else {
      setHomeError(res.error ?? "Failed to save.");
    }
  };

  // -------------------------------------------------------------------------
  // Add mileage expense
  // -------------------------------------------------------------------------
  const handleAddExpense = async () => {
    if (!result) return;
    setSaving(true);
    setError("");

    const description = `Mileage: ${result.origin} → ${result.destination} (${result.distanceMiles} mi @ $${result.ratePerMile}/mi)`;

    const res = await createManualExpense({
      merchant: "Mileage Reimbursement",
      description,
      amount: result.amount,
      currency: "USD",
      taxAmount: 0,
      transactionDate: new Date().toISOString().split("T")[0],
      category: "mileage",
      paymentMethod: "personal",
      reimbursable: true,
      billable: false,
      reportId,
    });

    setSaving(false);

    if (res.success) {
      onSave?.();
      router.refresh();
    } else {
      setError("Failed to save mileage expense.");
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-5">

      {/* ── Home Address ─────────────────────────────────────────────────── */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
        {editingHome ? (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Your Home Address
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={homeInput}
                onChange={(e) => setHomeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveHome()}
                placeholder="e.g. 12 Oak St, Somerville, MA 02143"
                className="flex-1 text-sm border border-slate-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSaveHome}
                disabled={savingHome}
                className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {savingHome ? "Saving…" : "Save"}
              </button>
              {homeAddress && (
                <button
                  onClick={() => { setHomeInput(homeAddress); setEditingHome(false); }}
                  className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
              )}
            </div>
            {homeError && <p className="text-xs text-red-600">{homeError}</p>}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base">🏠</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Home</p>
                <p className="text-sm text-slate-800 truncate">{homeAddress}</p>
              </div>
            </div>
            <button
              onClick={() => setEditingHome(true)}
              className="text-xs text-blue-600 hover:text-blue-800 whitespace-nowrap"
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* ── Quick Routes ─────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Quick Routes</p>

        {/* From Home row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-slate-500 mr-1 shrink-0">
            🏠 Home →
          </span>
          {CLINICS.map((clinic) => (
            <button
              key={`home-${clinic.name}`}
              onClick={() => {
                if (!homeAddress) {
                  setEditingHome(true);
                  setHomeError("Set your home address first.");
                  return;
                }
                applyShortcut(homeAddress, clinic.address);
              }}
              title={`${homeAddress || "Set home address first"} → ${clinic.address}`}
              className="px-2.5 py-1 text-xs font-medium rounded-full border border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              {clinic.name}
            </button>
          ))}
        </div>

        {/* From VLS row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-slate-500 mr-1 shrink-0">
            🏢 VLS →
          </span>
          {CLINICS.map((clinic) => (
            <button
              key={`vls-${clinic.name}`}
              onClick={() => applyShortcut(VLS_ADDRESS, clinic.address)}
              title={`${VLS_ADDRESS} → ${clinic.address}`}
              className="px-2.5 py-1 text-xs font-medium rounded-full border border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              {clinic.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Manual Address Inputs ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Starting Address"
          id="origin"
          value={origin}
          onChange={(e) => { setOrigin(e.target.value); setResult(null); }}
          placeholder="e.g. 123 Main St, Boston, MA"
        />
        <Input
          label="Ending Address"
          id="destination"
          value={destination}
          onChange={(e) => { setDestination(e.target.value); setResult(null); }}
          placeholder="e.g. 456 Elm St, Cambridge, MA"
        />
      </div>

      <Button
        type="button"
        variant="secondary"
        onClick={handleCalculate}
        loading={calculating}
        disabled={!origin.trim() || !destination.trim()}
      >
        Calculate Distance
      </Button>

      {/* ── Result ───────────────────────────────────────────────────────── */}
      {result && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-900">
                {result.distanceMiles} miles
                {result.durationText && (
                  <span className="font-normal text-blue-700">
                    {" "}· {result.durationText} drive
                  </span>
                )}
              </p>
              <p className="text-xs text-blue-600 mt-0.5">
                {result.distanceMiles} mi × ${result.ratePerMile}/mi
              </p>
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {formatCurrency(result.amount)}
            </p>
          </div>
          <p className="text-xs text-blue-500 truncate">
            {result.origin} → {result.destination}
          </p>
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Actions ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-1">
        {result && (
          <Button onClick={handleAddExpense} loading={saving}>
            Add Mileage Expense ({formatCurrency(result.amount)})
          </Button>
        )}
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
