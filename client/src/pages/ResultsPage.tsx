import React, { useState } from 'react';
import type { TripPlanResponse, RouteStep } from '../types/trip';
import { RouteMap } from '../components/RouteMap/RouteMap';
import { HOSSummary } from '../components/HOSSummary/HOSSummary';
import { TripTimeline } from '../components/TripTimeline/TripTimeline';
import { ELDLog } from '../components/ELDLog/ELDLog';
import { ArrowLeft, Navigation, Compass, ChevronDown, ChevronUp } from 'lucide-react';

interface ResultsPageProps {
  plan: TripPlanResponse;
  onBack: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({ plan, onBack }) => {
  const [showInstructions, setShowInstructions] = useState(false);

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const formatDuration = (hours: number) => {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    const h = Math.floor(remainingHours);
    const m = Math.round((remainingHours - h) * 60);
    
    if (days > 0) {
      return `${days}d ${h}h ${m}m`;
    }
    return `${h}h ${m}m`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header and Back Button */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Planner
        </button>
        <span className="text-xs font-bold text-slate-400">HOS Route Analysis Complete</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 no-print">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Total Distance</p>
          <p className="text-xl font-black text-slate-800 mt-1">{plan.summary.total_distance_miles.toLocaleString()} mi</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Driving Time</p>
          <p className="text-xl font-black text-slate-800 mt-1">{formatHours(plan.summary.total_driving_hours)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Trip Duration</p>
          <p className="text-xl font-black text-slate-800 mt-1">{formatDuration(plan.summary.total_duration_hours)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Fuel Stops</p>
          <p className="text-xl font-black text-slate-800 mt-1">{plan.summary.fuel_stops_count}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Rest Stops</p>
          <p className="text-xl font-black text-slate-800 mt-1">{plan.summary.rest_stops_count}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Cycle Remaining</p>
          <p className="text-xl font-black text-slate-800 mt-1">{plan.summary.cycle_remaining_hours}h</p>
        </div>
      </div>

      {/* Main Grid: Map & Instructions */}
      <div className="grid lg:grid-cols-3 gap-6 items-start no-print">
        {/* Map (Wider) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50 mb-3">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-teal-600" /> Route Map
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">OSRM route overview</span>
            </div>
            <RouteMap route={plan.route} stops={plan.stops} />
          </div>
        </div>

        {/* Collapsible Turn-by-Turn Instructions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3 lg:col-span-1 h-full max-h-[570px] overflow-y-auto">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="w-full flex justify-between items-center pb-3 border-b border-slate-50 text-left"
          >
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-teal-600" /> Route Instructions
            </span>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
              <span>{plan.route.steps.length} steps</span>
              {showInstructions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {(!showInstructions || window.innerWidth >= 1024) && (
            <div className="space-y-3 mt-3 animate-fadeIn">
              {plan.route.steps.map((step: RouteStep, idx: number) => (
                <div key={idx} className="flex gap-3 text-xs border-b border-slate-50 pb-2.5 last:border-0 last:pb-0">
                  <div className="w-5 h-5 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-black text-slate-500 flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-700">{step.instruction}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded font-black">{step.leg}</span>
                      {step.distance_miles > 0 && <span>{step.distance_miles} miles</span>}
                      {step.duration_hours > 0 && <span>({formatHours(step.duration_hours)})</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* HOS Counters & Schedule Timeline */}
      <div className="grid md:grid-cols-5 gap-6 items-start no-print">
        <div className="md:col-span-2">
          <HOSSummary summary={plan.hos_summary} />
        </div>
        <div className="md:col-span-3">
          <TripTimeline events={plan.events} />
        </div>
      </div>

      {/* ELD Logs grid - Prints in full landscape page */}
      <ELDLog plan={plan} />
    </div>
  );
};
