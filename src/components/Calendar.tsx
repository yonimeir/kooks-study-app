import React, { useState } from 'react';
import { Search, Calendar as CalendarIcon, CheckCircle2, ChevronLeft } from 'lucide-react';
import { getHebrewDayChar } from '../utils/dateUtils';
import scheduleData from '../data/schedule.json';

interface CalendarProps {
  activeMonth: string;
  activeDay: number;
  setDate: (month: string, day: number) => void;
  setCurrentTab: (tab: string) => void;
  completedPortions: { [key: string]: boolean };
}

export const Calendar: React.FC<CalendarProps> = ({
  activeMonth,
  activeDay,
  setDate,
  setCurrentTab,
  completedPortions
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(activeMonth);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const months = Object.keys(scheduleData);

  // Month Hebrew names
  const monthNames: { [key: string]: string } = {
    'Elul': 'אלול', 'Tishrei': 'תשרי', 'Cheshvan': 'חשוון', 'Kislev': 'כסלו',
    'Tevet': 'טבת', 'Shevat': 'שבט', 'Adar': 'אדר', 'Nissan': 'ניסן',
    'Iyar': 'אייר', 'Sivan': 'סיון', 'Tammuz': 'תמוז', 'Av': 'אב'
  };

  const handleDayClick = (month: string, day: number) => {
    setDate(month, day);
    setCurrentTab('today');
  };

  // Perform search across the entire year
  const searchResults: { month: string; day: number; item: any }[] = [];
  if (searchQuery.trim().length > 1) {
    const query = searchQuery.toLowerCase().trim();
    months.forEach((m) => {
      const days = (scheduleData as any)[m] || [];
      days.forEach((item: any) => {
        if (
          item.heTitle.toLowerCase().includes(query) ||
          item.portion.toLowerCase().includes(query) ||
          item.book.toLowerCase().includes(query)
        ) {
          searchResults.push({ month: m, day: item.day, item });
        }
      });
    });
  }

  const currentMonthDays = (scheduleData as any)[selectedMonth] || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 transition-colors duration-200">
      
      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-study-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="חפש נושא או ספר בלוח הלימוד (לדוגמה: אהבה, אורות התשובה)..."
          className="w-full pl-4 pr-10 py-3 bg-white dark:bg-study-850 border border-study-200 dark:border-study-800 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-study-400 text-study-800 dark:text-study-250 shadow-sm"
        />
      </div>

      {/* Search Results Mode */}
      {searchQuery.trim().length > 1 ? (
        <div className="bg-white dark:bg-study-850 rounded-2xl border border-study-200 dark:border-study-800 p-6 shadow-md">
          <h3 className="text-lg font-bold text-study-800 dark:text-study-200 font-serif mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-study-500" />
            <span>תוצאות חיפוש ({searchResults.length})</span>
          </h3>

          {searchResults.length === 0 ? (
            <p className="text-sm text-study-500 dark:text-study-400 text-center py-10">לא נמצאו התאמות לחיפוש שלך.</p>
          ) : (
            <div className="grid gap-3.5">
              {searchResults.map(({ month, day, item }) => {
                const portionKey = `${month}-${day}`;
                const isDone = completedPortions[portionKey] || false;
                return (
                  <button
                    key={portionKey}
                    onClick={() => handleDayClick(month, day)}
                    className="flex items-center justify-between p-4 bg-study-50 hover:bg-study-100 dark:bg-study-900/40 dark:hover:bg-study-900/80 rounded-xl border border-study-200/60 dark:border-study-800 text-right transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-xs font-bold text-study-500 bg-white dark:bg-study-800 border border-study-200 dark:border-study-700 px-2 py-1 rounded">
                        {monthNames[month]} - {getHebrewDayChar(day)}
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-study-500 block mb-0.5">{item.book}</span>
                        <span className="text-sm font-bold text-study-800 dark:text-study-200 group-hover:text-study-600 dark:group-hover:text-study-400">{item.heTitle}</span>
                        {item.portion && <span className="text-xs text-study-500 block mt-0.5">{item.portion}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isDone && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                      <ChevronLeft className="w-4 h-4 text-study-400 group-hover:translate-x-[-2px] transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Regular Calendar Mode */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Month Selector Column */}
          <div className="md:col-span-1 space-y-2">
            <h3 className="text-xs font-bold text-study-500 uppercase tracking-wider mb-3 px-2">חודשי השנה</h3>
            <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 gap-1.5 scrollbar-thin">
              {months.map((month) => {
                const isSelected = selectedMonth === month;
                const totalDays = (scheduleData as any)[month].length;
                const completedCount = (scheduleData as any)[month].filter((d: any) => completedPortions[`${month}-${d.day}`]).length;
                
                return (
                  <button
                    key={month}
                    onClick={() => setSelectedMonth(month)}
                    className={`flex-shrink-0 md:w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isSelected
                        ? 'bg-study-500 text-white shadow-sm'
                        : 'bg-white hover:bg-study-50 dark:bg-study-850 dark:hover:bg-study-800 text-study-700 dark:text-study-300 border border-study-200 dark:border-study-800'
                    }`}
                  >
                    <span>{monthNames[month]}</span>
                    <span className={`text-xxs px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-study-650 text-white' : 'bg-study-100 dark:bg-study-800 text-study-500 dark:text-study-400'
                    }`}>
                      {completedCount}/{totalDays}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Days Grid Column */}
          <div className="md:col-span-3 bg-white dark:bg-study-850 rounded-2xl border border-study-200 dark:border-study-800 p-6 shadow-md">
            <div className="border-b border-study-200 dark:border-study-800 pb-4 mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold font-serif text-study-800 dark:text-study-200 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-study-500" />
                <span>לימוד חודש {monthNames[selectedMonth]}</span>
              </h3>
              <span className="text-xs text-study-500">לחץ על יום למעבר ללימוד</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[500px] overflow-y-auto pr-1 select-none scrollbar-thin">
              {currentMonthDays.map((item: any) => {
                const portionKey = `${selectedMonth}-${item.day}`;
                const isDone = completedPortions[portionKey] || false;
                const isCurrent = activeMonth === selectedMonth && activeDay === item.day;

                return (
                  <button
                    key={item.day}
                    onClick={() => handleDayClick(selectedMonth, item.day)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border text-right transition-all group ${
                      isCurrent
                        ? 'bg-study-50/50 dark:bg-study-900/30 border-study-400 shadow-sm ring-1 ring-study-400'
                        : 'bg-study-50/30 hover:bg-study-50 dark:bg-study-900/10 dark:hover:bg-study-900/40 border-study-200/50 dark:border-study-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        isCurrent
                          ? 'bg-study-500 text-white'
                          : 'bg-white dark:bg-study-800 border border-study-200 dark:border-study-700 text-study-700 dark:text-study-300'
                      }`}>
                        {getHebrewDayChar(item.day).replace("'", "").replace('"', "")}
                      </div>
                      <div>
                        <span className="text-xxs font-bold text-study-400 block mb-0.5">{item.book}</span>
                        <span className="text-xs font-bold text-study-750 dark:text-study-300 group-hover:text-study-600 dark:group-hover:text-study-400">{item.heTitle}</span>
                      </div>
                    </div>
                    {isDone && <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
