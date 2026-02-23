import { TrendingUp, TrendingDown, Clock, MessageSquare } from 'lucide-react';

interface TrendAnalysisProps {
  growthPercentage: number;
  accuracy: number | null;
  hasHolidaySpike: boolean;
  holidayName?: string;
}

export function TrendAnalysis({
  growthPercentage,
  accuracy,
  hasHolidaySpike,
  holidayName,
}: TrendAnalysisProps) {
  const isPositive = growthPercentage >= 0;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
        <MessageSquare className="h-5 w-5 text-indigo-600" />
        Analisis Tren & Wawasan
      </h2>

      <div className="space-y-6">
        <div className="flex gap-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}
          >
            {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Pola Pertumbuhan</h4>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Permintaan diprediksi akan {isPositive ? 'meningkat' : 'menurun'} sebesar{' '}
              {Math.abs(growthPercentage).toFixed(1)}% dibandingkan periode sebelumnya.
            </p>
          </div>
        </div>

        {hasHolidaySpike && (
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Dampak Acara Khusus</h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Terdeteksi lonjakan permintaan signifikan menjelang{' '}
                <span className="font-bold text-indigo-600">{holidayName}</span>. Kami menyarankan
                restock 3-4 hari sebelumnya.
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Keandalan Model
            </span>
            <span className="text-xs font-bold text-indigo-600">{accuracy}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
              style={{ width: `${accuracy || 0}%` }}
            ></div>
          </div>
          <p className="mt-3 text-center text-[10px] text-slate-400 italic">
            Berdasarkan validasi riwayat data 90 hari terakhir
          </p>
        </div>
      </div>
    </div>
  );
}
