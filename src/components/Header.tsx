import React from 'react';
import { BookOpen, Calendar as CalendarIcon, Award, Sun, Moon } from 'lucide-react';
import type { HebrewDateInfo } from '../utils/dateUtils';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  todayHebDate: HebrewDateInfo;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  todayHebDate,
  darkMode,
  setDarkMode
}) => {
  return (
    <header className="bg-study-100 dark:bg-study-900 border-b border-study-200 dark:border-study-800 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Title and Logo */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-study-500 text-white rounded-xl shadow-md">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-study-800 dark:text-study-200 font-serif">
              עיקרי משנת הראי"ה
            </h1>
            <p className="text-xs text-study-600 dark:text-study-400">
              תוכנית לימוד יומית תלת-שנתית בכתבי הרב קוק זצ"ל
            </p>
          </div>
        </div>

        {/* Date and Controls */}
        <div className="flex items-center justify-between md:justify-end gap-4">
          {/* Hebrew Date Display */}
          <div className="bg-white dark:bg-study-850 px-3.5 py-1.5 rounded-lg border border-study-200 dark:border-study-800 text-right shadow-sm">
            <div className="text-xs text-study-500 dark:text-study-400">היום לומדים:</div>
            <div className="text-sm font-semibold text-study-800 dark:text-study-200">
              {todayHebDate.dayHebrew} ב{todayHebDate.monthHebrew} {todayHebDate.year}
            </div>
          </div>

          {/* Theme Selector & Year Selection (Visual only for now) */}
          <div className="flex items-center gap-2">
            <select 
              className="bg-white dark:bg-study-850 border border-study-200 dark:border-study-800 rounded-lg px-2.5 py-1.5 text-xs text-study-700 dark:text-study-300 font-semibold focus:outline-none focus:ring-1 focus:ring-study-400"
              defaultValue="year1"
              disabled
            >
              <option value="year1">שנה ראשונה (תשפ"ז)</option>
              <option value="year2" disabled>שנה שנייה (תשפ"ח) - בקרוב</option>
              <option value="year3" disabled>שנה שלישית (תשפ"ט) - בקרוב</option>
            </select>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 bg-white dark:bg-study-850 border border-study-200 dark:border-study-800 rounded-lg text-study-600 dark:text-study-300 hover:bg-study-50 dark:hover:bg-study-800 shadow-sm transition-all"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="max-w-6xl mx-auto px-4">
        <nav className="flex gap-1 md:gap-2 -mb-px">
          {[
            { id: 'today', label: 'הלימוד היומי', icon: BookOpen },
            { id: 'calendar', label: 'לוח לימוד שנתי', icon: CalendarIcon },
            { id: 'progress', label: 'התקדמות ומעקב', icon: Award }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                  isActive
                    ? 'border-study-500 text-study-700 dark:text-study-300 bg-study-50 dark:bg-study-850/50'
                    : 'border-transparent text-study-500 hover:text-study-700 dark:text-study-400 dark:hover:text-study-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
