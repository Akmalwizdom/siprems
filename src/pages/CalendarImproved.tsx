import { useState, useEffect, useMemo } from 'react';
import { useStore, type CalendarEvent } from '../context/StoreContext';
import { API_BASE_URL } from '../config';
import { useToast } from '../components/ui/toast';
import { ConfirmDialog } from '../components/ui/confirmdialog';
import { useAuth } from '../context/AuthContext';

// Modular components
import { CalendarHeader, CalendarGrid, EventDetailModal } from '../components/calendar';

const eventTypeConfig: Record<string, { color: string; label: string }> = {
  promotion: { color: 'bg-blue-500', label: 'Promosi' },
  holiday: { color: 'bg-purple-500', label: 'Hari Libur' },
  'store-closed': { color: 'bg-red-500', label: 'Toko Tutup' },
  event: { color: 'bg-emerald-500', label: 'Acara' },
};

export function CalendarImproved() {
  const { events, refetchEvents } = useStore();
  const { getAuthToken } = useAuth();
  const { showToast } = useToast();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'promotion' as CalendarEvent['type'],
    description: '',
    impactDirection: 'increase' as 'increase' | 'decrease' | 'normal' | 'closed',
    impactIntensity: 50,
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [nationalHolidays, setNationalHolidays] = useState<any[]>([]);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  // Fetch holidays
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/holidays/${currentDate.getFullYear()}`);
        const data = await response.json();
        if (data.status === 'success') setNationalHolidays(data.holidays);
      } catch (error) {
        console.error('Failed to fetch holidays:', error);
      }
    };
    fetchHolidays();
  }, [currentDate.getFullYear()]);

  // AI Suggestions
  useEffect(() => {
    if (formData.title.length > 3 && showModal && !aiSuggestion) {
      const timer = setTimeout(async () => {
        setIsLoadingAI(true);
        try {
          const token = await getAuthToken();
          const response = await fetch(`${API_BASE_URL}/events/suggest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              title: formData.title,
              user_selected_type: formData.type,
              date: selectedDate?.toISOString().split('T')[0],
            }),
          });
          const data = await response.json();
          if (data.status === 'success') {
            setAiSuggestion(data.suggestion);
            setFormData((prev) => ({ ...prev, type: data.suggestion.suggested_category }));
          }
        } catch (e) {
          console.error('AI error:', e);
        } finally {
          setIsLoadingAI(false);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [formData.title]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDay; i++) days.push({ isEmpty: true });
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const holiday = nationalHolidays.find((h) => h.date === dateStr && h.is_national_holiday);
      days.push({
        date,
        events: events.filter((e) => e.date === dateStr),
        isToday: date.toDateString() === new Date().toDateString(),
        isHoliday: !!holiday,
        holidayName: holiday?.name,
      });
    }
    return days;
  }, [currentDate, events, nationalHolidays]);

  const handleConfirmEvent = async () => {
    try {
      const token = await getAuthToken();
      const impactWeight =
        formData.impactDirection === 'increase'
          ? 1 + formData.impactIntensity / 100
          : formData.impactDirection === 'decrease'
            ? 1 - formData.impactIntensity / 100
            : formData.impactDirection === 'closed'
              ? 0
              : 1;

      const payload = {
        date: selectedDate?.toISOString().split('T')[0],
        title: formData.title,
        type: formData.type,
        impact_weight: impactWeight,
        description: formData.description,
        ai_suggestion: aiSuggestion,
      };

      const res = await fetch(`${API_BASE_URL}/events/${isEditMode ? editingEventId : 'confirm'}`, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await refetchEvents();
        setShowModal(false);
        showToast(isEditMode ? 'Acara diperbarui' : 'Acara dibuat', 'success');
      }
    } catch (e) {
      showToast('Gagal menyimpan acara', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <CalendarHeader
        dateHeader={currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
        onNavigate={(dir) =>
          setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + dir, 1))
        }
        onToday={() => setCurrentDate(new Date())}
        onAddEvent={() => {
          setIsEditMode(false);
          setSelectedDate(new Date());
          setFormData({
            title: '',
            type: 'promotion',
            description: '',
            impactDirection: 'increase',
            impactIntensity: 50,
          });
          setShowModal(true);
        }}
      />

      <CalendarGrid
        days={calendarDays}
        eventTypeConfig={eventTypeConfig}
        onDateClick={(date) => {
          setSelectedDate(date);
          setIsEditMode(false);
          setFormData({
            title: '',
            type: 'promotion',
            description: '',
            impactDirection: 'increase',
            impactIntensity: 50,
          });
          setShowModal(true);
        }}
        onEditEvent={(event) => {
          setIsEditMode(true);
          setEditingEventId(event.id);
          setSelectedDate(new Date(event.date));
          setFormData({
            title: event.title,
            type: event.type,
            description: event.description || '',
            impactDirection:
              event.impact_weight > 1
                ? 'increase'
                : event.impact_weight < 1
                  ? event.impact_weight === 0
                    ? 'closed'
                    : 'decrease'
                  : 'normal',
            impactIntensity: Math.abs(event.impact_weight - 1) * 100,
          });
          setShowModal(true);
        }}
        onDeleteEvent={setEventToDelete}
        onViewHistory={() => {}}
      />

      <EventDetailModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        isEditMode={isEditMode}
        selectedDate={selectedDate}
        formData={formData}
        setFormData={setFormData}
        aiSuggestion={aiSuggestion}
        isLoadingAI={isLoadingAI}
        onAcceptSuggestion={() => {
          if (aiSuggestion)
            setFormData((prev) => ({
              ...prev,
              type: aiSuggestion.suggested_category,
              impactIntensity: Math.abs(aiSuggestion.suggested_impact - 1) * 100,
            }));
          setAiSuggestion(null);
        }}
        onEditSuggestion={() => setAiSuggestion(null)}
        onRejectSuggestion={() => setAiSuggestion(null)}
        onConfirm={handleConfirmEvent}
      />

      <ConfirmDialog
        open={!!eventToDelete}
        onOpenChange={(open) => !open && setEventToDelete(null)}
        title="Hapus Acara?"
        description="Apakah Anda yakin ingin menghapus acara ini? Ini akan mempengaruhi prediksi stok di masa depan."
        onConfirm={async () => {
          if (!eventToDelete) return;
          const token = await getAuthToken();
          await fetch(`${API_BASE_URL}/events/${eventToDelete}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          await refetchEvents();
          setEventToDelete(null);
          showToast('Acara dihapus', 'success');
        }}
        variant="destructive"
      />
    </div>
  );
}
