import React from 'react';
import type { DailyLog } from '../../types/trip';
import { FileText, Printer } from 'lucide-react';

interface ELDLogProps {
  logs: DailyLog[];
}

export const ELDLog: React.FC<ELDLogProps> = ({ logs }) => {
  const [activeDayIdx, setActiveDayIdx] = React.useState(0);

  if (!logs || logs.length === 0) return null;
  const activeLog = logs[activeDayIdx];

  // SVG grid sizing constants
  const svgWidth = 840;
  const svgHeight = 220;
  
  const startX = 140; // Space for labels
  const endX = 780;   // Grid end
  const gridWidth = endX - startX; // 640px
  
  const rowY = {
    'OFF DUTY': 35,
    'SLEEPER BERTH': 75,
    'DRIVING': 115,
    'ON DUTY': 155
  };

  const getX = (minutes: number) => {
    return startX + (minutes / 1440) * gridWidth;
  };

  const getY = (status: keyof typeof rowY) => {
    return rowY[status] || 35;
  };

  // Generate SVG path for the continuous status lines
  const renderLogLines = () => {
    const paths: React.ReactNode[] = [];
    const segments = activeLog.segments;

    segments.forEach((seg, idx) => {
      const x1 = getX(seg.start_minutes);
      const x2 = getX(seg.end_minutes);
      const y = getY(seg.status);

      // Horizontal line for this status segment
      paths.push(
        <line
          key={`h-${idx}`}
          x1={x1}
          y1={y}
          x2={x2}
          y2={y}
          stroke="#ef4444" // Classic ELD red line
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      );

      // Draw vertical connector to next segment if not the last segment
      if (idx < segments.length - 1) {
        const nextSeg = segments[idx + 1];
        const nextY = getY(nextSeg.status);
        paths.push(
          <line
            key={`v-${idx}`}
            x1={x2}
            y1={y}
            x2={x2}
            y2={nextY}
            stroke="#ef4444"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        );
      }
    });

    return paths;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6 print-section">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 no-print">
        <div className="space-y-1">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            Daily ELD Logs
          </h3>
          <p className="text-xs text-slate-400">Generate, view, and print HOS daily log sheets</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3.5 py-2 rounded-xl transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Logs
          </button>
        </div>
      </div>

      {/* Tabs to select which day to display */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-print">
        {logs.map((log, idx) => (
          <button
            key={log.date}
            onClick={() => setActiveDayIdx(idx)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              activeDayIdx === idx
                ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/10'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Day {idx + 1} — {new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </button>
        ))}
      </div>

      {/* Grid Sheet Container */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden p-6 bg-slate-50/30 space-y-6">
        {/* Sheet metadata header */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-slate-700 pb-4 border-b border-slate-100">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Date</p>
            <p className="text-sm font-black text-slate-800">
              {new Date(activeLog.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Distance Driven</p>
            <p className="text-sm font-black text-slate-800">{activeLog.total_miles} miles</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Total Driving Hours</p>
            <p className="text-sm font-black text-slate-800">{activeLog.driving_hours} hrs</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">On-Duty Hours</p>
            <p className="text-sm font-black text-slate-800">{activeLog.on_duty_hours} hrs</p>
          </div>
        </div>

        {/* Scalable SVG Log Grid */}
        <div className="overflow-x-auto pb-2">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            width="100%"
            height="100%"
            className="min-w-[760px] bg-white border border-slate-200 rounded-xl select-none"
          >
            {/* Grid Outer Border */}
            <rect x={startX} y="15" width={gridWidth} height="160" fill="none" stroke="#94a3b8" strokeWidth="1.5" />

            {/* Grid Row separators */}
            {Object.keys(rowY).map((status, idx) => (
              <line
                key={`row-sep-${idx}`}
                x1={startX}
                y1={rowY[status as keyof typeof rowY]}
                x2={endX}
                y2={rowY[status as keyof typeof rowY]}
                stroke="#cbd5e1"
                strokeWidth="1"
              />
            ))}

            {/* Vertical Hour lines */}
            {Array.from({ length: 25 }).map((_, hr) => {
              const x = getX(hr * 60);
              const isNoonOrMidnight = hr === 0 || hr === 12 || hr === 24;
              
              return (
                <g key={`hour-line-${hr}`}>
                  {/* Grid hour line */}
                  <line
                    x1={x}
                    y1="15"
                    x2={x}
                    y2="175"
                    stroke={isNoonOrMidnight ? "#64748b" : "#e2e8f0"}
                    strokeWidth={isNoonOrMidnight ? "1.5" : "1"}
                  />
                  
                  {/* Half-hour tick */}
                  {hr < 24 && (
                    <line
                      x1={getX(hr * 60 + 30)}
                      y1="15"
                      x2={getX(hr * 60 + 30)}
                      y2="175"
                      stroke="#f1f5f9"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />
                  )}

                  {/* Hour label text at the top */}
                  {hr < 25 && (
                    <text
                      x={x}
                      y="10"
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="bold"
                      fill="#64748b"
                    >
                      {hr === 0 || hr === 24 ? 'M' : hr === 12 ? 'N' : hr > 12 ? hr - 12 : hr}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Row text labels on the left */}
            {Object.keys(rowY).map((status) => (
              <text
                key={`label-${status}`}
                x={startX - 15}
                y={rowY[status as keyof typeof rowY] + 4}
                textAnchor="end"
                fontSize="10"
                fontWeight="black"
                fill="#475569"
              >
                {status}
              </text>
            ))}

            {/* SVG Status Line graph */}
            {renderLogLines()}

            {/* Hour summary counts drawn on the right */}
            <text x={endX + 15} y="10" fontSize="9" fontWeight="bold" fill="#64748b">HOURS</text>
            
            <text x={endX + 25} y={rowY['OFF DUTY'] + 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1e293b">
              {activeLog.off_duty_hours}
            </text>
            <text x={endX + 25} y={rowY['SLEEPER BERTH'] + 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1e293b">
              {activeLog.sleeper_hours}
            </text>
            <text x={endX + 25} y={rowY['DRIVING'] + 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1e293b">
              {activeLog.driving_hours}
            </text>
            <text x={endX + 25} y={rowY['ON DUTY'] + 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1e293b">
              {activeLog.on_duty_hours}
            </text>

            <line x1={endX + 10} y1="15" x2={endX + 10} y2="175" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1={endX + 40} y1="15" x2={endX + 40} y2="175" stroke="#94a3b8" strokeWidth="1.5" />
            
            {/* Total check */}
            <text x={endX + 25} y="190" textAnchor="middle" fontSize="11" fontWeight="black" fill="#0f766e">
              {activeLog.off_duty_hours + activeLog.sleeper_hours + activeLog.driving_hours + activeLog.on_duty_hours}
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
};
