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
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-16 space-y-12">
      {/* Intro Header Section */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-100 rounded-full text-xs font-bold text-teal-700 uppercase tracking-wide">
          <ShieldCheck className="w-3.5 h-3.5" /> HOS Compliant Engine
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-800 leading-tight">
          HOS Route Planner & <span className="text-teal-600">ELD Log Generator</span>
        </h1>
        <p className="text-base text-slate-500 font-medium">
          Plan safe, compliant freight transit. Enter your endpoints and current cycle hours to automatically plot the map, schedule rests/breaks, and generate daily SVG logs.
        </p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid md:grid-cols-5 gap-8 items-start">
        {/* Left Side: Features Checklist */}
        <div className="md:col-span-2 space-y-6 md:pr-4 py-2">
          <h3 className="text-lg font-bold text-slate-700">How it works</h3>
          
          <div className="space-y-5">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 border border-teal-100 text-teal-600">
                <Map className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-700">OSRM Smart Routing</h4>
                <p className="text-xs text-slate-400 font-medium">
                  We geocode your locations and fetch detailed geometries and driving speeds using public OpenStreetMap.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 border border-teal-100 text-teal-600">
                <Truck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-700">HOS Duty Calculation</h4>
                <p className="text-xs text-slate-400 font-medium">
                  Evaluates 11h driving, 14h duty, 30m break, and 1000-mile fuel intervals, scheduling stops along coordinate paths.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 border border-teal-100 text-teal-600">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-700">SVG Daily Logsheets</h4>
                <p className="text-xs text-slate-400 font-medium">
                  Outputs midnight-split logs mapped to the 24-hour grid. Fully landscape-ready for print or PDF.
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
  );
};
