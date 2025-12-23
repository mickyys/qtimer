"use client";

import { useState, useRef, useEffect } from "react";
import dayjs, { Dayjs } from "dayjs";

interface DatePickerProps {
  label?: string;
  value: Dayjs | null;
  onChange: (date: Dayjs | null) => void;
  placeholder?: string;
}

export default function DatePicker({
  label,
  value,
  onChange,
  placeholder = "Seleccionar fecha",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || dayjs());
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const handlePrevMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, "month"));
  };

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.add(1, "month"));
  };

  const handleSelectDate = (date: Dayjs) => {
    onChange(date);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setIsOpen(false);
  };

  // Generate calendar days
  const daysInMonth = currentMonth.daysInMonth();
  const firstDayOfMonth = currentMonth.startOf("month").day();
  const days = [];

  // Empty cells for days before month starts
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }

  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const dayNames = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <label className="block text-xs font-medium text-slate-600">
          {label}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">📅</span>
          <button
            ref={buttonRef}
            onClick={() => setIsOpen(!isOpen)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400
              focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition
              text-left flex justify-between items-center"
          >
            <span className="text-slate-400">
              {value ? value.format("DD/MM/YYYY") : placeholder}
            </span>
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""
                }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-[9999] p-4 w-full sm:w-[360px]"
        >
          {/* Header with month/year and navigation */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-slate-100 rounded transition"
            >
              <svg
                className="w-5 h-5 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <span className="font-semibold text-slate-800">
              {monthNames[currentMonth.month()]} {currentMonth.year()}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-slate-100 rounded transition"
            >
              <svg
                className="w-5 h-5 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-slate-600 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {weeks.map((week, weekIdx) => (
              week.map((day, dayIdx) => (
                <button
                  key={`${weekIdx}-${dayIdx}`}
                  onClick={() => {
                    if (day) {
                      handleSelectDate(currentMonth.date(day));
                    }
                  }}
                  disabled={!day}
                  className={`h-8 rounded text-sm transition ${!day
                    ? "invisible"
                    : day === value?.date() &&
                      currentMonth.month() === value?.month() &&
                      currentMonth.year() === value?.year()
                      ? "bg-emerald-500 text-white font-semibold"
                      : "text-slate-700 hover:bg-slate-100"
                    }`}
                >
                  {day}
                </button>
              ))
            ))}
          </div>

          {/* Clear button */}
          {value && (
            <button
              onClick={handleClear}
              className="w-full px-3 py-2 text-sm text-slate-600 bg-slate-100 rounded hover:bg-slate-200 transition font-medium"
            >
              Limpiar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
