import { Trash2, Edit, ExternalLink, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Event } from '../../types';
import { AISuggestionBox } from './AISuggestionBox';

interface EventDetailModalProps {
  event: Event;
  onClose: () => void;
  onEdit: (event: Event) => void;
  onDelete: (id: string) => void;
  onApplyAISuggestion: (impact: number) => void;
}

export function EventDetailModal({
  event,
  onClose,
  onEdit,
  onDelete,
  onApplyAISuggestion,
}: EventDetailModalProps) {
  const isHoliday = event.type === 'holiday';

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="animate-in fade-in absolute inset-0 bg-slate-900/60 backdrop-blur-md duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="animate-in zoom-in-95 glass-morphism relative w-full max-w-lg overflow-hidden rounded-[32px] border border-white/40 bg-white shadow-2xl duration-300">
        <div
          className={`relative flex h-32 items-end px-8 pb-6 ${
            isHoliday ? 'bg-linear-to-br from-rose-500 to-orange-500' : 'bronze-gradient'
          }`}
        >
          <div className="absolute top-6 right-6 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/40"
              onClick={() => onEdit(event)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/40"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/30 bg-white/20 text-white shadow-inner backdrop-blur-md">
              {isHoliday ? <Sparkles className="h-7 w-7" /> : <CalendarIcon className="h-7 w-7" />}
            </div>
            <div>
              <p className="mb-1 text-[10px] leading-none font-black tracking-[0.2em] text-white/70 uppercase">
                Event Detail Information
              </p>
              <h2 className="line-clamp-1 text-2xl font-black tracking-tight text-white">
                {event.title}
              </h2>
            </div>
          </div>
        </div>

        <div className="space-y-8 p-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Execution Date
              </p>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
                  <CalendarIcon className="text-bronze-500 h-3.5 w-3.5" />
                </div>
                <p className="text-sm font-black text-slate-900">
                  {new Date(event.date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Activity Category
              </p>
              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-1.5 shadow-sm">
                <div
                  className={`h-2 w-2 rounded-full ${isHoliday ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-bronze-500 shadow-[0_0_8px_rgba(181,150,99,0.4)]'}`}
                />
                <span className="text-[10px] font-black tracking-widest text-slate-700 uppercase">
                  {event.type}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Strategic Description
            </p>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 text-xs leading-relaxed font-bold text-slate-600 italic">
              "
              {event.description ||
                'No additional description provided for this business intelligence entry.'}
              "
            </div>
          </div>

          {event.prediction && (
            <div className="pt-2">
              <AISuggestionBox
                impact={event.prediction.impact}
                title={event.prediction.title}
                description={event.prediction.description}
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-6">
            <Button
              variant="ghost"
              className="rounded-xl text-[10px] font-black tracking-widest text-rose-400 uppercase hover:bg-rose-50 hover:text-rose-600"
              onClick={() => onDelete(event.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove Entry
            </Button>
            <Button
              onClick={onClose}
              className="h-12 rounded-2xl bg-slate-900 px-10 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-slate-200 transition-all hover:scale-[1.02] hover:bg-slate-800 active:scale-95"
            >
              Close Record
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
