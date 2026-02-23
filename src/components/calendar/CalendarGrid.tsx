import { Edit3, Trash2, History, Sparkles } from 'lucide-react';
import { AdminOnly } from '../auth/RoleGuard';

interface CalendarGridProps {
  days: any[];
  onDateClick: (date: Date) => void;
  onEditEvent: (event: any) => void;
  onDeleteEvent: (id: string) => void;
  onViewHistory: (event: any) => void;
  eventTypeConfig: any;
}

export function CalendarGrid({
  days,
  onDateClick,
  onEditEvent,
  onDeleteEvent,
  onViewHistory,
  eventTypeConfig,
}: CalendarGridProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
        {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
          <div
            key={day}
            className="border-r border-slate-100 p-4 text-center text-[10px] font-bold tracking-widest text-slate-400 uppercase last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((dayObj, idx) => {
          if (dayObj.isEmpty) {
            return (
              <div
                key={`empty-${idx}`}
                className="min-h-32 border-r border-b border-slate-100 bg-slate-50/30"
              ></div>
            );
          }

          const { date, events, isToday, isHoliday, holidayName } = dayObj;
          const dayNum = date.getDate();

          return (
            <div
              key={date.toISOString()}
              onClick={() => onDateClick(date)}
              className={`group min-h-32 cursor-pointer border-r border-b border-slate-100 p-2 transition-all hover:bg-slate-50/50 ${
                isHoliday ? 'bg-rose-50/30' : 'bg-white'
              }`}
            >
              <div className="mb-2 flex items-start justify-between">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                    isToday
                      ? 'bg-indigo-600 text-white shadow-md'
                      : isHoliday
                        ? 'text-rose-600'
                        : 'text-slate-400'
                  }`}
                >
                  {dayNum}
                </span>
                {isHoliday && (
                  <span className="max-w-[60px] truncate text-right text-[9px] font-bold tracking-tighter text-rose-500 uppercase">
                    {holidayName}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {events.map((event: any) => {
                  const config = eventTypeConfig[event.type] || eventTypeConfig['event'];
                  return (
                    <div
                      key={event.id}
                      className={`${config.color} group/event relative overflow-hidden rounded-lg px-2 py-1.5 text-[10px] font-bold text-white`}
                    >
                      <div className="relative z-10 flex items-center justify-between gap-1">
                        <span
                          className="flex-1 truncate"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditEvent(event);
                          }}
                        >
                          {event.title}
                        </span>

                        <AdminOnly>
                          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/event:opacity-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditEvent(event);
                              }}
                              className="rounded p-1 transition-colors hover:bg-black/10"
                            >
                              <Edit3 className="h-3 w-3 text-white" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteEvent(event.id);
                              }}
                              className="rounded p-1 transition-colors hover:bg-black/10"
                            >
                              <Trash2 className="h-3 w-3 text-white" />
                            </button>
                          </div>
                        </AdminOnly>

                        {event.ai_confidence && (
                          <Sparkles className="ml-1 h-2.5 w-2.5 opacity-50" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
