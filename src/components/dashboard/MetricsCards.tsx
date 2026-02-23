import {
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  TrendingUp,
  ShoppingBag,
  AlertCircle,
  DollarSign,
} from 'lucide-react';
import { formatCompactNumber, formatNumber } from '../../utils/format';

interface MetricsCardsProps {
  metrics: {
    totalSales: number;
    transactionCount: number;
    lowStockCount: number;
    salesGrowth: number;
  };
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  const cards = [
    {
      label: 'Total Penjualan',
      value: `Rp ${formatCompactNumber(metrics.totalSales)}`,
      subValue:
        metrics.salesGrowth > 0
          ? `+${metrics.salesGrowth}% dari kemarin`
          : `${metrics.salesGrowth}% dari kemarin`,
      icon: DollarSign,
      color: 'from-bronze-500 to-bronze-700',
      trend: metrics.salesGrowth >= 0 ? 'up' : 'down',
      shadow: 'shadow-bronze-200/40',
    },
    {
      label: 'Total Transaksi',
      value: formatNumber(metrics.transactionCount),
      subValue: 'Aktivitas hari ini',
      icon: ShoppingBag,
      color: 'from-slate-800 to-slate-900',
      trend: 'neutral',
      shadow: 'shadow-slate-200',
    },
    {
      label: 'Pertumbuhan',
      value: `${metrics.salesGrowth}%`,
      subValue: 'Estimasi performa',
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-600',
      trend: metrics.salesGrowth >= 0 ? 'up' : 'down',
      shadow: 'shadow-emerald-100',
    },
    {
      label: 'Stok Menipis',
      value: metrics.lowStockCount,
      subValue: 'Butuh restock segera',
      icon: AlertCircle,
      color:
        metrics.lowStockCount > 5 ? 'from-rose-500 to-red-600' : 'from-amber-500 to-orange-600',
      trend: 'warning',
      shadow: metrics.lowStockCount > 5 ? 'shadow-rose-100' : 'shadow-amber-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, idx) => (
        <div key={card.label} className="group relative">
          {/* Background Highlight on Hover */}
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
              {card.trend !== 'neutral' && (
                <div
                  className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black tracking-tighter uppercase ${
                    card.trend === 'up'
                      ? 'bg-emerald-50 text-emerald-600'
                      : card.trend === 'down'
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-amber-50 text-amber-600'
                  }`}
                >
                  {card.trend === 'up' ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : card.trend === 'down' ? (
                    <ArrowDownRight className="h-3 w-3" />
                  ) : null}
                  {card.trend === 'up' ? 'Naik' : card.trend === 'down' ? 'Turun' : 'Perlu Cek'}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                {card.label}
              </p>
              <h3 className="text-2xl font-black tracking-tight text-slate-900">{card.value}</h3>
              <p className="text-xs font-medium text-slate-500">{card.subValue}</p>
            </div>

            {/* Micro-sparkle for Primary Card */}
            {idx === 0 && (
              <Sparkles className="text-bronze-300 absolute right-4 bottom-4 h-4 w-4 opacity-20 transition-opacity group-hover:opacity-100" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
