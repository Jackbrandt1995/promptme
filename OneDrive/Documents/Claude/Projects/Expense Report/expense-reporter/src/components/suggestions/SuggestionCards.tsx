"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { getCategoryIcon, getCategoryLabel, formatCurrency } from "@/lib/utils";

interface Suggestion {
  type: string;
  merchant: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  frequency: number;
  lastUsed: string;
  confidence: number;
}

interface SuggestionCardsProps {
  onSelect: (suggestion: Suggestion) => void;
}

export function SuggestionCards({ onSelect }: SuggestionCardsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/suggestions")
      .then((res) => res.json())
      .then((data) => {
        setSuggestions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-lg animate-shimmer" />
        ))}
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium text-slate-700">
          Based on your recent expenses
        </h3>
        <span className="text-xs text-slate-400">Quick add</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {suggestions.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => onSelect(suggestion)}
            className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-all text-left group"
          >
            <span className="text-xl flex-shrink-0 mt-0.5">
              {getCategoryIcon(suggestion.category)}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {suggestion.merchant || getCategoryLabel(suggestion.category)}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {suggestion.description}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {suggestion.amount > 0 && (
                  <span className="text-xs font-medium text-slate-700">
                    ~{formatCurrency(suggestion.amount)}
                  </span>
                )}
                <span className="text-xs text-slate-400">
                  {suggestion.frequency}x used
                </span>
              </div>
            </div>
            <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium mt-1">
              + Add
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
