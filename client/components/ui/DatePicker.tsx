'use client';

import { forwardRef, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  label?: string;
  error?: string;
  placeholder?: string;
  min?: string;
  max?: string;
}

const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ value, onChange, label, error, placeholder = 'Select date', min, max }, ref) => {
    const [showCalendar, setShowCalendar] = useState(false);
    const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setShowCalendar(false);
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const selectDate = (day: number) => {
      const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
      onChange(formatDate(selected));
      setShowCalendar(false);
    };

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return (
      <div className="space-y-1" ref={containerRef}>
        {label && (
          <label className="block text-sm font-medium text-[var(--color-text-primary)]">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type="text"
            readOnly
            value={value ? new Date(value + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
            placeholder={placeholder}
            onClick={() => setShowCalendar(!showCalendar)}
            className={cn(
              'w-full bg-[var(--color-surface)] border rounded-[var(--radius-input)] px-3 py-2 text-sm cursor-pointer transition-all',
              error
                ? 'border-[var(--color-danger)]'
                : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]',
              'focus:outline-none'
            )}
          />
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        {showCalendar && (
          <div className="absolute z-50 mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] shadow-[var(--shadow-dialog)] p-3 w-72 animate-scale-in">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))}
                className="p-1 rounded hover:bg-[var(--color-border-light)]"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-medium">
                {months[viewDate.getMonth()]} {viewDate.getFullYear()}
              </span>
              <button
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))}
                className="p-1 rounded hover:bg-[var(--color-border-light)]"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <div key={d} className="text-center text-[10px] font-medium text-[var(--color-text-muted)] py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {blanks.map((b) => (
                <div key={`blank-${b}`} />
              ))}
              {days.map((day) => {
                const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                const isToday = date.getTime() === today.getTime();
                const isSelected = value === formatDate(date);
                const isDisabled = Boolean((min && formatDate(date) < min) || (max && formatDate(date) > max));

                return (
                  <button
                    key={day}
                    onClick={() => !isDisabled && selectDate(day)}
                    disabled={isDisabled}
                    className={cn(
                      'w-8 h-8 text-xs rounded-lg flex items-center justify-center transition-colors',
                      isSelected && 'bg-[var(--color-primary)] text-white',
                      isToday && !isSelected && 'font-bold text-[var(--color-primary)]',
                      !isSelected && !isDisabled && 'hover:bg-[var(--color-border-light)]',
                      isDisabled && 'opacity-30 cursor-not-allowed'
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';

export default DatePicker;
