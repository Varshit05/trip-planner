import React, { useState } from 'react';
import type { TripPlanResponse, RouteStep } from '../types/trip';
import { RouteMap } from '../components/RouteMap/RouteMap';
import { HOSSummary } from '../components/HOSSummary/HOSSummary';
import { TripTimeline } from '../components/TripTimeline/TripTimeline';
import { ELDLog } from '../components/ELDLog/ELDLog';
import { 
  ArrowLeft, Navigation, Compass, ChevronDown, ChevronUp, 
  Milestone, Clock, Calendar, Fuel, Moon, Activity, CheckCircle2 
} from 'lucide-react';

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
    <div className="relative overflow-hidden min-h-screen">
      {/* Background gradient glowing blobs */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 relative z-10">
      {/* Header and Back Button */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 transition-all bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl shadow-sm hover:scale-[1.02]"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          Back to Planner
        </button>
        <span className="text-[10px] font-black text-teal-700 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
          HOS Route Analysis Complete
        </span>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 no-print">
        
        {/* Total Distance */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-between text-center transition-all hover:scale-[1.03] hover:shadow-md">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/50 mb-2">
            <Milestone className="w-4.5 h-4.5" />
          </div>
          <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Total Distance</span>
          <p className="text-lg font-black text-slate-800 mt-1">{plan.summary.total_distance_miles.toLocaleString()} mi</p>
        </div>

        {/* Driving Time */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-between text-center transition-all hover:scale-[1.03] hover:shadow-md">
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100/50 mb-2">
            <Clock className="w-4.5 h-4.5" />
          </div>
          <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Driving Time</span>
          <p className="text-lg font-black text-slate-800 mt-1">{formatHours(plan.summary.total_driving_hours)}</p>
        </div>

        {/* Trip Duration */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-between text-center transition-all hover:scale-[1.03] hover:shadow-md">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/50 mb-2">
            <Calendar className="w-4.5 h-4.5" />
          </div>
          <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Trip Duration</span>
          <p className="text-lg font-black text-slate-800 mt-1">{formatDuration(plan.summary.total_duration_hours)}</p>
        </div>

        {/* Fuel Stops */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-between text-center transition-all hover:scale-[1.03] hover:shadow-md">
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100/50 mb-2">
            <Fuel className="w-4.5 h-4.5" />
          </div>
          <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Fuel Stops</span>
          <p className="text-lg font-black text-slate-800 mt-1">{plan.summary.fuel_stops_count}</p>
        </div>

        {/* Rest Stops */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-between text-center transition-all hover:scale-[1.03] hover:shadow-md">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100/50 mb-2">
            <Moon className="w-4.5 h-4.5" />
          </div>
          <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Rest Stops</span>
          <p className="text-lg font-black text-slate-800 mt-1">{plan.summary.rest_stops_count}</p>
        </div>

        {/* Cycle Remaining */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-between text-center transition-all hover:scale-[1.03] hover:shadow-md">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50 mb-2">
            <Activity className="w-4.5 h-4.5" />
          </div>
          <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Cycle Remaining</span>
          <p className="text-lg font-black text-slate-800 mt-1">{plan.summary.cycle_remaining_hours}h</p>
        </div>
      </div>

      {/* Main Grid: Map & Instructions */}
      <div className="grid lg:grid-cols-3 gap-6 items-start no-print">
        {/* Map (Wider) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50 mb-4">
              <span className="text-xs font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                <Navigation className="w-4 h-4 text-teal-600" /> Route Map
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">OSRM route overview</span>
            </div>
            <RouteMap route={plan.route} stops={plan.stops} />
          </div>
        </div>

        {/* Collapsible Turn-by-Turn Instructions */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 lg:col-span-1 h-full max-h-[570px] overflow-y-auto hover:shadow-md transition-shadow scrollbar-thin scrollbar-thumb-slate-200">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="w-full flex justify-between items-center pb-3 border-b border-slate-50 text-left"
          >
            <span className="text-xs font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Compass className="w-4 h-4 text-teal-600" /> Turn-by-Turn
            </span>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span>{plan.route.steps.length} steps</span>
              {showInstructions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {(!showInstructions || window.innerWidth >= 1024) && (
            <div className="space-y-3 mt-4 animate-fadeIn">
              {plan.route.steps.map((step: RouteStep, idx: number) => (
                <div key={idx} className="flex gap-3 text-xs border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                  <div className="w-5 h-5 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-black text-slate-500 flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-700 leading-tight">{step.instruction}</p>
                    <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-black">{step.leg}</span>
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
  </div>
  );
};
