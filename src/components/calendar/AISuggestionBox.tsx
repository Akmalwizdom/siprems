import { Brain, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';

interface AISuggestionBoxProps {
  impact: number;
  title: string;
  description?: string;
}

export function AISuggestionBox({ impact, title, description }: AISuggestionBoxProps) {
  const isHighImpact = Math.abs(impact) > 20;

  return (
    <div className="group relative">
      {/* Animated Gradient Border */}
      <div className="from-bronze-500 to-bronze-600 absolute -inset-0.5 animate-pulse rounded-3xl bg-linear-to-r via-amber-400 opacity-20 blur transition duration-1000 group-hover:opacity-40 group-hover:duration-200"></div>

      <div className="glass-card shadow-bronze-100/20 relative rounded-2xl border-white/60 bg-white/60 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start gap-5">
          <div className="shrink-0">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner ${
                impact >= 0
                  ? 'bg-linear-to-br from-emerald-500 to-emerald-700 text-white shadow-emerald-200/50'
                  : 'from-bronze-500 to-bronze-700 shadow-bronze-200/50 bg-linear-to-br text-white'
              }`}
            >
              <Brain className="h-8 w-8" />
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-bronze-600/80 text-[10px] font-black tracking-[0.2em] uppercase">
                  AI Insight Intelligence
                </span>
                {isHighImpact && (
                  <span className="flex animate-bounce items-center gap-1 rounded-full bg-rose-500 px-2 py-0.5 text-[9px] font-black text-white uppercase">
                    <AlertCircle className="h-2.5 w-2.5" /> High Impact
                  </span>
                )}
              </div>
              <div
                className={`flex items-center gap-1 text-sm font-black ${impact >= 0 ? 'text-emerald-600' : 'text-slate-900'}`}
              >
                <TrendingUp className={`h-4 w-4 ${impact < 0 ? 'rotate-180' : ''}`} />
                {impact >= 0 ? `+${impact}%` : `${impact}%`}
              </div>
            </div>

            <h4 className="text-base leading-tight font-black text-slate-900">{title}</h4>

            <p className="max-w-[90%] text-xs leading-relaxed font-medium text-slate-500">
              {description ||
                'AI memprediksi perubahan signifikan pada pola pembelian selama periode ini. Disarankan untuk menyesuaikan tingkat ketersediaan stok.'}
            </p>

            <div className="pt-2">
              <Button className="bronze-gradient shadow-bronze-200/30 group/btn h-9 rounded-xl px-4 text-[10px] font-black tracking-widest text-white uppercase shadow-lg transition-all hover:scale-[1.02] active:scale-95">
                Aksi Cepat
                <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
