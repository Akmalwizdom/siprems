import { Button } from '../ui/button';

interface PredictionHeaderProps {
  predictionRange: number;
  onRangeChange: (days: number) => void;
  date: string;
}

export function PredictionHeader({ predictionRange, onRangeChange, date }: PredictionHeaderProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hasil Prediksi AI</h1>
        <p className="text-sm font-medium text-slate-500">Prediksi dibuat pada {date}</p>
      </div>
      <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1 shadow-sm">
        {([7, 30, 90] as const).map((days) => (
          <Button
            key={days}
            onClick={() => onRangeChange(days)}
            variant={predictionRange === days ? 'default' : 'ghost'}
            size="sm"
            className={`h-8 rounded-lg px-4 text-xs font-bold transition-all ${
              predictionRange === days ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            {days} Hari
          </Button>
        ))}
      </div>
    </div>
  );
}
