"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createManualExpense } from "@/lib/actions";
import { formatCurrency } from "@/lib/utils";

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

export function MileageForm({ reportId, onSave, onCancel }: MileageFormProps) {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<MileageResult | null>(null);
  const [error, setError] = useState("");

  const handleCalculate = async () => {
    if (!origin.trim() || !destination.trim()) {
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
        body: JSON.stringify({ origin, destination }),
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Starting Address"
          id="origin"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="e.g. 123 Main St, Boston, MA"
        />
        <Input
          label="Ending Address"
          id="destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
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

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

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
