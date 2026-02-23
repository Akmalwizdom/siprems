import { RefreshCw, Calendar, Download, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { TimeRange } from '../../types';

interface DashboardHeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  onExport?: () => void;
  isAdmin: boolean;
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
}

export function DashboardHeader({
  onRefresh,
  isLoading,
  onExport,
  isAdmin,
  selectedRange,
  onRangeChange,
}: DashboardHeaderProps) {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const rangeLabels: Record<TimeRange, string> = {
    today: 'Hari Ini',
    week: 'Minggu Ini',
    month: 'Bulan Ini',
    year: 'Tahun Ini',
  };

  return (
    <div className="mb-8 flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 italic">
            Ringkasan <span className="text-bronze-600 not-italic">Bisnis.</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <Calendar className="h-4 w-4" />
          <p className="text-sm font-bold tracking-tight">{currentDate}</p>
          <span className="h-1 w-1 rounded-full bg-slate-300"></span>
          <p className="text-bronze-500/60 font-mono text-[10px] font-bold tracking-widest uppercase">
            Real-Time Data Extraction
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Time Range Selector */}
        <div className="flex rounded-2xl border border-white/40 bg-slate-100/50 p-1">
          {(Object.keys(rangeLabels) as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => onRangeChange(range)}
              className={`rounded-xl px-4 py-2 text-[10px] font-black tracking-tight whitespace-nowrap uppercase transition-all ${
                selectedRange === range
                  ? 'bronze-gradient text-white shadow-md'
                  : 'hover:text-bronze-600 text-slate-500'
              }`}
            >
              {rangeLabels[range]}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isLoading}
            className="glass-card h-11 rounded-2xl border-white/40 px-5 font-bold transition-all hover:bg-white/60 active:scale-95"
          >
            <RefreshCw
              className={`text-bronze-600 mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            Perbarui
          </Button>

          {isAdmin && (
            <Button
              onClick={onExport}
              className="bronze-gradient shadow-bronze-200/50 h-11 rounded-2xl px-6 text-xs font-black text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95"
            >
              <Download className="mr-2 h-4 w-4" />
              Ekspor
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
