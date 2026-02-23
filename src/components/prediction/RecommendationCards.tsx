import { AlertTriangle, TrendingUp, Info } from 'lucide-react';
import { RestockRecommendation } from '../../types';

interface RecommendationCardsProps {
  recommendations: RestockRecommendation[];
}

export function RecommendationCards({ recommendations }: RecommendationCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {recommendations.map((rec) => (
        <div key={rec.productId} className="group relative">
          {/* Urgency Highlight Border */}
          <div
            className={`absolute -inset-0.5 rounded-3xl opacity-0 blur transition duration-500 group-hover:opacity-20 ${
              rec.urgency === 'high'
                ? 'bg-rose-500'
                : rec.urgency === 'medium'
                  ? 'bg-amber-500'
                  : 'bg-bronze-500'
            }`}
          ></div>

          <div className="glass-card relative flex h-full flex-col rounded-3xl p-6 transition-all duration-300 hover:translate-y-[-4px]">
            <div className="mb-6 flex items-start justify-between">
              <div className="space-y-1">
                <span
                  className={`rounded-full border px-2.5 py-1 text-[9px] font-black tracking-widest uppercase ${
                    rec.urgency === 'high'
                      ? 'border-rose-100 bg-rose-50 text-rose-600'
                      : rec.urgency === 'medium'
                        ? 'border-amber-100 bg-amber-50 text-amber-600'
                        : 'border-emerald-100 bg-emerald-50 text-emerald-600'
                  }`}
                >
                  Prioritas{' '}
                  {rec.urgency === 'high'
                    ? 'Tinggi'
                    : rec.urgency === 'medium'
                      ? 'Sedang'
                      : 'Rendah'}
                </span>
                <h3 className="group-hover:text-bronze-700 text-sm leading-tight font-black text-slate-900 transition-colors">
                  {rec.productName}
                </h3>
              </div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  rec.urgency === 'high'
                    ? 'bg-rose-50 text-rose-500'
                    : rec.urgency === 'medium'
                      ? 'bg-amber-50 text-amber-500'
                      : 'bg-emerald-50 text-emerald-500'
                }`}
              >
                {rec.urgency === 'high' ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <TrendingUp className="h-5 w-5" />
                )}
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/50 bg-slate-50/50 p-3">
                <p className="mb-1 text-[9px] font-bold tracking-tighter text-slate-400 uppercase">
                  Stok Saat Ini
                </p>
                <p className="text-sm font-black text-slate-900">
                  {rec.currentStock} <span className="text-[10px] text-slate-400">PCS</span>
                </p>
              </div>
              <div className="bg-bronze-50/30 border-bronze-100/30 rounded-2xl border p-3">
                <p className="text-bronze-600/70 mb-1 text-[9px] font-bold tracking-tighter uppercase">
                  Estimasi Permintaan
                </p>
                <p className="text-bronze-700 text-sm font-black">
                  {Math.ceil(rec.predictedDemand)}{' '}
                  <span className="text-bronze-400 text-[10px]">PCS</span>
                </p>
              </div>
            </div>

            <div className="mt-auto border-t border-slate-50 pt-6">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Info className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold tracking-widest uppercase">
                    Rekomendasi Restock
                  </span>
                </div>
                <span className="text-lg font-black text-slate-900">+{rec.recommendedRestock}</span>
              </div>

              {/* Rational / AI Logic snippet */}
              <div className="rounded-xl border border-white/60 bg-white/40 p-3 text-[10px] font-medium text-slate-500 italic">
                "AI mendeteksi potensi lonjakan permintaan sebesar{' '}
                {rec.categoryGrowthFactor ? (rec.categoryGrowthFactor * 100).toFixed(0) : '15'}%
                pada kategori ini."
              </div>
            </div>
          </div>
        </div>
      ))}

      {recommendations.length === 0 && (
        <div className="glass-card col-span-full rounded-3xl py-20 text-center">
          <p className="text-sm font-bold tracking-widest text-slate-400 uppercase">
            Status stok dalam parameter aman.
          </p>
        </div>
      )}
    </div>
  );
}
