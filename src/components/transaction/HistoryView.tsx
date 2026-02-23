import {
  Search,
  Filter,
  Download,
  Calendar,
  ArrowRight,
  Eye,
  ChevronLeft,
  ChevronRight,
  Hash,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Transaction } from '../../types';
import { formatNumber } from '../../utils/format';

interface HistoryViewProps {
  transactions: Transaction[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: { start: string; end: string }) => void;
  onExport: () => void;
}

export function HistoryView({
  transactions,
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  onExport,
}: HistoryViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
        <div className="flex w-full flex-wrap items-center gap-4 lg:w-auto">
          <div className="group relative flex-1 sm:w-80">
            <Search className="group-focus-within:text-bronze-500 absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors" />
            <input
              type="text"
              placeholder="Cari ID transaksi atau nama kasir..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="focus:ring-bronze-400/20 w-full rounded-2xl border border-white/40 bg-white/60 py-3 pr-4 pl-11 text-sm font-bold text-slate-700 shadow-sm backdrop-blur-md outline-none focus:ring-2"
            />
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-white/40 bg-slate-100/50 p-1.5">
            <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-1.5 shadow-sm">
              <Calendar className="text-bronze-500 h-3.5 w-3.5" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
                className="border-none bg-transparent p-0 text-[11px] font-bold text-slate-600 outline-none focus:ring-0"
              />
            </div>
            <ArrowRight className="h-3 w-3 text-slate-300" />
            <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-1.5 shadow-sm">
              <Calendar className="text-bronze-500 h-3.5 w-3.5" />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
                className="border-none bg-transparent p-0 text-[11px] font-bold text-slate-600 outline-none focus:ring-0"
              />
            </div>
          </div>
        </div>

        <Button
          onClick={onExport}
          className="bronze-gradient shadow-bronze-200/50 h-12 w-full rounded-2xl px-6 font-black text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95 lg:w-auto"
        >
          <Download className="mr-2 h-4 w-4" />
          Ekspor Riwayat
        </Button>
      </div>

      <div className="glass-card shadow-bronze-100/10 overflow-hidden rounded-3xl border-white/40 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/40 bg-slate-50/50">
                <th className="px-6 py-5 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  ID Transaksi
                </th>
                <th className="px-6 py-5 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Tanggal & Waktu
                </th>
                <th className="px-6 py-5 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Item
                </th>
                <th className="px-6 py-5 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Total Pembayaran
                </th>
                <th className="px-6 py-5 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.map((t) => (
                <tr key={t.id} className="group transition-colors hover:bg-white/40">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="group-hover:bg-bronze-50 group-hover:text-bronze-500 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400 transition-colors">
                        <Hash className="h-4 w-4" />
                      </div>
                      <span className="font-mono text-xs font-black tracking-tighter text-slate-900">
                        {t.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-0.5">
                      <p className="text-xs font-black text-slate-900 italic">
                        {new Date(t.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400">
                        {new Date(t.created_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        WIB
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1">
                      <span className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-900">
                        {t.items.length}
                      </span>
                      <span className="ml-1 text-[10px] font-bold tracking-tighter text-slate-500 uppercase">
                        Items
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-bronze-600 text-sm font-black">
                      Rp {formatNumber(t.total_amount)}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-bronze-50 hover:text-bronze-600 h-9 w-9 rounded-xl text-slate-400"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
              <Search className="h-8 w-8 text-slate-200" />
            </div>
            <h3 className="text-sm font-black text-slate-900">Belum Ada Transaksi</h3>
            <p className="mt-1 p-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
              Coba sesuaikan filter pencarian atau rentang tanggal
            </p>
          </div>
        )}

        {/* Pagination - Premium Design */}
        <div className="flex items-center justify-between border-t border-slate-50 bg-slate-50/30 p-6">
          <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Halaman 1 dari 12
          </p>
          <div className="flex items-center rounded-xl border border-slate-100 bg-white p-1 shadow-sm">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-50">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex px-2">
              {[1, 2, 3].map((p) => (
                <button
                  key={p}
                  className={`h-8 w-8 rounded-lg text-xs font-black transition-all ${p === 1 ? 'bronze-gradient text-white shadow-md' : 'hover:text-bronze-600 text-slate-400'}`}
                >
                  {p}
                </button>
              ))}
              <span className="flex h-8 w-8 items-center justify-center text-slate-300">...</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-50">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
