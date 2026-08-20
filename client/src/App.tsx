import { useState } from 'react';
import { PlannerPage } from './pages/PlannerPage';
import { ResultsPage } from './pages/ResultsPage';
import { planTrip } from './services/api';
import type { PlanTripParams } from './services/api';
import type { TripPlanResponse } from './types/trip';
import { ShieldCheck, Truck, AlertTriangle } from 'lucide-react';
import axios from 'axios';

type Page = 'planner' | 'results';

interface ErrorState {
  type: string;
  message: string;
  cycleRemaining?: number;
  requiredAdditional?: number;
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('planner');
  const [plan, setPlan] = useState<TripPlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);

  // Simulated loading steps for premium loader effect
  const [loadingStep, setLoadingStep] = useState(0);

  const triggerLoaderAnimation = () => {
    setLoadingStep(0);
    const intervals = [1000, 2000, 3500];
    intervals.forEach((delay, idx) => {
      setTimeout(() => {
        setLoadingStep(idx + 1);
      }, delay);
    });
  };

  const handlePlanSubmit = async (params: PlanTripParams) => {
    setLoading(true);
    setError(null);
    triggerLoaderAnimation();

    try {
      const result = await planTrip(params);
      setPlan(result);
      setCurrentPage('results');
    } catch (err: any) {
      console.error(err);
      
      let errorState: ErrorState = {
        type: 'SERVER_ERROR',
        message: 'Unable to calculate the route right now. Please check if the backend service is running and try again.'
      };

      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data;
        if (data && data.error) {
          errorState = {
            type: data.error_type || 'BAD_REQUEST',
            message: data.error,
            cycleRemaining: data.cycle_remaining_hours,
            requiredAdditional: data.required_additional_hours
          };
        }
      }
      
      setError(errorState);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPlanner = () => {
    setError(null);
    setCurrentPage('planner');
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      {/* Premium Navigation Header */}
      <header className="bg-white border-b border-slate-100 py-4 px-6 sticky top-0 z-50 shadow-sm no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleBackToPlanner}>
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/10">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-sm text-slate-800 tracking-tight">Antigravity LogiRoute</span>
              <span className="block text-[9px] text-teal-600 font-bold tracking-widest uppercase">ELD Planner</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 border border-teal-100 rounded-xl text-[10px] font-bold text-teal-700">
            <ShieldCheck className="w-3.5 h-3.5" /> HOS v1.0 engine
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow">
        {/* Error Alert Display */}
        {error && (
          <div className="max-w-3xl mx-auto px-4 mt-6 no-print">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-2 flex-grow">
                <h4 className="text-sm font-bold text-red-800 uppercase tracking-wide">
                  {error.type === 'CYCLE_EXCEEDED' ? 'HOS Cycle Exceeded' : error.type === 'LOCATION_NOT_FOUND' ? 'Location Not Found' : 'Planning Failed'}
                </h4>
                <p className="text-xs text-red-700 font-medium leading-relaxed">{error.message}</p>
                {error.type === 'CYCLE_EXCEEDED' && (
                  <div className="pt-2 grid grid-cols-2 gap-4 max-w-sm">
                    <div className="bg-white/60 p-2.5 rounded-lg border border-red-200/50 text-center">
                      <p className="text-[9px] text-red-500 font-bold uppercase">Cycle Remaining</p>
                      <p className="text-sm font-black text-red-800">{error.cycleRemaining} hrs</p>
                    </div>
                    <div className="bg-white/60 p-2.5 rounded-lg border border-red-200/50 text-center">
                      <p className="text-[9px] text-red-500 font-bold uppercase">Extra Time Needed</p>
                      <p className="text-sm font-black text-red-800">+{error.requiredAdditional} hrs</p>
                    </div>
                  </div>
                )}
                <div className="pt-1">
                  <button
                    onClick={handleBackToPlanner}
                    className="text-xs font-bold text-red-800 hover:text-red-900 underline underline-offset-4"
                  >
                    Adjust details and try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading overlay spinner and steps */}
        {loading && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full border border-slate-100 shadow-xl text-center space-y-6">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                <div className="absolute inset-0 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-slate-800 text-lg">Planning Compliant Route</h3>
                <p className="text-xs text-slate-400 font-medium">Please wait while we crunch numbers</p>
              </div>

              {/* Progress Steps */}
              <div className="space-y-2 text-left bg-slate-50 p-4 border border-slate-100 rounded-xl">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span className={loadingStep >= 0 ? 'text-teal-600 font-bold' : ''}>Finding locations</span>
                  <span>{loadingStep >= 0 ? '✓' : '...'}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span className={loadingStep >= 1 ? 'text-teal-600 font-bold' : ''}>Calculating OSRM route</span>
                  <span>{loadingStep >= 1 ? '✓' : '...'}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span className={loadingStep >= 2 ? 'text-teal-600 font-bold' : ''}>Scheduling HOS stops</span>
                  <span>{loadingStep >= 2 ? '✓' : '...'}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span className={loadingStep >= 3 ? 'text-teal-600 font-bold' : ''}>Generating daily ELD logs</span>
                  <span>{loadingStep >= 3 ? '✓' : '...'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page Routing */}
        {currentPage === 'planner' && (
          <PlannerPage onSubmit={handlePlanSubmit} loading={loading} />
        )}
        
        {currentPage === 'results' && plan && (
          <ResultsPage plan={plan} onBack={handleBackToPlanner} />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-100 bg-white text-center text-xs text-slate-400 font-medium no-print">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Antigravity Route Planner. Developed for compliant fleet operations.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-600 transition-colors">Documentation</a>
            <a href="#" className="hover:text-slate-600 transition-colors">HOS Rules Summary</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
