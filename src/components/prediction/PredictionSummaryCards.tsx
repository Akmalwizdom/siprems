import { Brain, Zap, Target, TrendingUp } from 'lucide-react';
import { formatCompactNumber } from '../../utils/format';

interface PredictionSummaryCardsProps {
  metrics: {
    forecastAccuracy: number;
    predictedSales: number;
    growthFactor: number;
    confidenceInterval: number;
  };
}

export function PredictionSummaryCards({ metrics }: PredictionSummaryCardsProps) {
  const cards = [
    {
      label: 'Akurasi Prediksi',
      value: `${metrics.forecastAccuracy}%`,
      subValue: 'Berdasarkan data 30 hari',
      icon: Target,
      color: 'from-bronze-500 to-bronze-700',
      shadow: 'shadow-bronze-200/40',
    },
    {
      label: 'Estimasi Penjualan',
      value: `Rp ${formatCompactNumber(metrics.predictedSales)}`,
      subValue: 'Periode mendatang',
      icon: Brain,
      color: 'from-slate-800 to-slate-900',
      shadow: 'shadow-slate-200',
    },
    {
      label: 'Faktor Pertumbuhan',
      value: `x${metrics.growthFactor}`,
      subValue: 'Tren pasar saat ini',
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-100',
    },
    {
      label: 'Confidence Interval',
      value: `±${metrics.confidenceInterval}%`,
      subValue: 'Tingkat keandalan AI',
      icon: Zap,
      color: 'from-indigo-600 to-purple-700',
      shadow: 'shadow-indigo-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="group relative">
          <div
            className={`absolute -inset-0.5 bg-linear-to-br ${card.color} rounded-3xl opacity-0 blur transition duration-500 group-hover:opacity-20`}
          ></div>
          <div className="glass-card relative rounded-3xl p-6 transition-all duration-300 group-hover:translate-y-[-4px]">
            <div className="mb-4 flex items-start justify-between">
              <div
                className={`h-12 w-12 rounded-2xl bg-linear-to-br ${card.color} flex items-center justify-center text-white shadow-lg ${card.shadow}`}
              >
                <card.icon className="h-6 w-6" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                {card.label}
              </p>
              <h3 className="text-2xl font-black tracking-tight text-slate-900">{card.value}</h3>
              <p className="text-xs font-medium text-slate-500">{card.subValue}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
