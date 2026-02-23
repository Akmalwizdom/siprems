import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { AdminOnly } from '../auth/RoleGuard';

interface CalendarHeaderProps {
  dateHeader: string;
  onNavigate: (dir: number) => void;
  onToday: () => void;
  onAddEvent: () => void;
}

export function CalendarHeader({
  dateHeader,
  onNavigate,
  onToday,
  onAddEvent,
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2">
        <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm"
            onClick={() => onNavigate(-1)}
          >
            <ChevronLeft className="h-4 w-4 text-slate-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm"
            onClick={() => onNavigate(1)}
          >
            <ChevronRight className="h-4 w-4 text-slate-600" />
          </Button>
        </div>
        <h1 className="min-w-[200px] text-center text-xl font-bold text-slate-900">{dateHeader}</h1>
        <Button
          variant="outline"
          size="sm"
          className="h-9 rounded-xl border-indigo-100 px-4 font-bold text-indigo-600 hover:bg-indigo-50"
          onClick={onToday}
        >
          Hari Ini
        </Button>
      </div>

      <AdminOnly>
        <Button
          onClick={onAddEvent}
          className="h-10 rounded-xl bg-indigo-600 px-6 font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Acara
        </Button>
      </AdminOnly>
    </div>
  );
}
