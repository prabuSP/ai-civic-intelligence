/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Ward, BudgetSuggestion } from '../types';
import { Coins, Sparkles, AlertCircle, RefreshCw, BarChart3, TrendingUp } from 'lucide-react';

interface BudgetPlannerProps {
  wards: Ward[];
  suggestions: BudgetSuggestion[];
  onRecalculateBudget: (wardName: string) => Promise<void>;
  userRole?: string;
}

export default function BudgetPlanner({ wards, suggestions, onRecalculateBudget, userRole }: BudgetPlannerProps) {
  const [selectedWard, setSelectedWard] = useState<string>(wards[0]?.name || 'Ward 1 - Downtown');
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeSuggestion = suggestions.find((s) => s.ward === selectedWard);
  const activeWardDetails = wards.find((w) => w.name === selectedWard);

  const handleAIReevaluate = async () => {
    setIsRecalculating(true);
    setErrorMsg(null);
    try {
      await onRecalculateBudget(selectedWard);
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to contact budget generation engine.");
    } finally {
      setIsRecalculating(false);
    }
  };

  const isAuthorized = userRole === 'Admin' || userRole === 'MLA' || userRole === 'Collector';

  // Sector config for beautiful color styling
  const sectors = [
    { key: 'road', name: 'Road Infrastructure', color: 'bg-amber-500', barColor: 'from-amber-400 to-amber-600', textColor: 'text-amber-600' },
    { key: 'water', name: 'Water Security', color: 'bg-blue-500', barColor: 'from-blue-400 to-blue-600', textColor: 'text-blue-600' },
    { key: 'garbage', name: 'Garbage & Sanitation', color: 'bg-emerald-500', barColor: 'from-emerald-400 to-emerald-600', textColor: 'text-emerald-600' },
    { key: 'health', name: 'Sewage & Health', color: 'bg-rose-500', barColor: 'from-rose-400 to-rose-600', textColor: 'text-rose-600' },
    { key: 'education', name: 'Government Schools', color: 'bg-violet-500', barColor: 'from-violet-400 to-violet-600', textColor: 'text-violet-600' },
  ];

  return (
    <div id="budget-planner-container" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-display font-semibold text-lg text-slate-800 flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500 animate-pulse" />
            AI Ward Budget Optimization Engine
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Prioritizes municipal fund allocation based on severity and density of local complaints</p>
        </div>

        {/* Ward switcher tabs */}
        <div id="budget-ward-tabs" className="flex flex-wrap gap-1 bg-slate-50 p-1 rounded-xl">
          {wards.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedWard(w.name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedWard === w.name
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {w.name.split(' - ')[1]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ward Stats Cards */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3.5">
            <h4 className="font-display font-semibold text-xs text-slate-600 uppercase tracking-wider">Ward Profile</h4>
            
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Selected Ward:</span>
                <span className="font-semibold text-slate-800">{selectedWard}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Population:</span>
                <span className="font-semibold text-slate-800">{activeWardDetails?.population.toLocaleString()} citizens</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Annual Base Budget:</span>
                <span className="font-semibold text-emerald-600">₹{activeWardDetails?.budget} Lakhs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">District Boundary:</span>
                <span className="font-semibold text-slate-800">{activeWardDetails?.district}</span>
              </div>
            </div>
          </div>

          {/* AI Comment panel */}
          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-2 relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 p-3 text-indigo-100 opacity-20 pointer-events-none">
              <Sparkles className="w-16 h-16" />
            </div>
            
            <h4 className="font-display font-semibold text-xs text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              AI Civic Analysis
            </h4>
            
            {activeSuggestion ? (
              <p id="budget-ai-justification" className="text-xs text-indigo-900 leading-relaxed font-sans font-medium">
                "{activeSuggestion.ai_comment}"
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">No allocation model calculated yet. Click optimization trigger.</p>
            )}
          </div>

          {/* Recalculate Trigger */}
          <div className="pt-2">
            {isAuthorized ? (
              <button
                id="recalculate-budget-btn"
                disabled={isRecalculating}
                onClick={handleAIReevaluate}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isRecalculating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Recalculating Splits...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Run AI Budget Recalculator</span>
                  </>
                )}
              </button>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-[11px] text-slate-500 leading-relaxed flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>Only <strong>MLAs</strong>, <strong>Collectors</strong>, or <strong>Admins</strong> can trigger Gemini budget optimizations. Switch role in user menu to run.</span>
              </div>
            )}
            {errorMsg && (
              <div className="mt-2 text-[11px] text-rose-500 bg-rose-50 p-2 rounded-lg border border-rose-100">
                {errorMsg}
              </div>
            )}
          </div>
        </div>

        {/* Visual Allocation split charts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-100 space-y-5">
            <h4 className="font-display font-semibold text-xs text-slate-600 uppercase tracking-wider flex items-center justify-between">
              <span>Optimized Percentage Allocations</span>
              <span className="text-[10px] text-slate-400 font-sans tracking-normal font-normal">Summing to 100%</span>
            </h4>

            {activeSuggestion ? (
              <div id="budget-split-bars-list" className="space-y-4">
                {sectors.map((sec) => {
                  const val = (activeSuggestion as any)[sec.key] || 0;
                  const lakhs = activeWardDetails ? Math.round((val / 100) * activeWardDetails.budget * 100) / 100 : 0;
                  
                  return (
                    <div key={sec.key} className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center font-medium">
                        <span className="text-slate-700">{sec.name}</span>
                        <div className="space-x-1">
                          <span className={`${sec.textColor} font-semibold font-display text-sm`}>{val}%</span>
                          <span className="text-slate-400">/ ₹{lakhs} Lakhs</span>
                        </div>
                      </div>
                      
                      {/* Progress Bar Container */}
                      <div className="h-4 w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200/50">
                        <div
                          className={`h-full bg-gradient-to-r ${sec.barColor} rounded-r-lg transition-all duration-1000`}
                          style={{ width: `${val}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-slate-400 text-center py-12">No data suggestion found for {selectedWard}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
