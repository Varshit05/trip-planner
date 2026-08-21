import React from 'react';
import { TripForm } from '../components/TripForm/TripForm';
import type { PlanTripParams } from '../services/api';
import { ShieldCheck, Truck, Map, ShieldAlert } from 'lucide-react';

interface PlannerPageProps {
  onSubmit: (params: PlanTripParams) => void;
  loading: boolean;
}

export const PlannerPage: React.FC<PlannerPageProps> = ({ onSubmit, loading }) => {
  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Premium background design gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-6xl mx-auto px-6 py-12 md:py-20 space-y-16 relative z-10">
        {/* Intro Header Section */}
        <div className="text-center space-y-5 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-50 border border-teal-100 rounded-full text-[10px] font-black text-teal-700 uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5 animate-pulse" /> HOS Compliant Core Engine
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-800 leading-tight">
            Logistics Route Planner & <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">ELD Generator</span>
          </h1>
          <p className="text-sm md:text-base text-slate-500 font-bold max-w-xl mx-auto leading-relaxed">
            Plan safe, compliant commercial transit. Input your endpoints and cycle hours to automatically map paths, schedule breaks, and export paper-log compliant sheets.
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid md:grid-cols-5 gap-12 items-start">
          {/* Left Side: Features Checklist */}
          <div className="md:col-span-2 space-y-8 py-2">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest border-b border-slate-100 pb-2">
              Compliance Rules
            </h3>
            
            <div className="space-y-6">
              
              {/* Feature 1 */}
              <div className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-100/50 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md hover:border-slate-200/50">
                <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 border border-teal-100 text-teal-600">
                  <Map className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-700">OSRM Geocoded Routing</h4>
                  <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                    Uses high-resolution OpenStreetMap data to extract full geometry paths, driving speeds, and geocoded coordinates.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-100/50 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md hover:border-slate-200/50">
                <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 border border-teal-100 text-teal-600">
                  <Truck className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-700">Federal HOS Scheduler</h4>
                  <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                    Evaluates the 11h driving, 14h window, 8h break, and 1000-mile fuel stops, placing stops directly on the coordinate paths.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-100/50 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md hover:border-slate-200/50">
                <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 border border-teal-100 text-teal-600">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-700">ELD Log sheets</h4>
                  <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                    Generates paper-replica daily logs. Computes full 70h/8d and 60h/7d recap records with complete landscape printing.
                  </p>
                </div>
              </div>
              
            </div>
          </div>

          {/* Right Side: The Form */}
          <div className="md:col-span-3">
            <TripForm onSubmit={onSubmit} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
};
