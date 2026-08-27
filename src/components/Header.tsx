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
        <div className="flex items-center gap-3.5">
          <img 
            src="/logo.png" 
            alt="עיקרי משנת הראי״ה" 
            className="h-13 md:h-15 w-auto object-contain shrink-0" 
          />
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-study-800 dark:text-study-200 font-serif leading-tight">
              עיקרי משנת הראי"ה
            </h1>
            <p className="text-xs text-study-600 dark:text-study-400 mt-0.5">
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
              {todayHebDate.dayHebrew} ב{todayHebDate.monthHebrew} {todayHebDate.yearHebrew}
            </div>
          </div>

          {/* Theme Selector & Year Selection */}
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

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 bg-white dark:bg-study-850 border border-study-200 dark:border-study-800 rounded-lg text-study-600 dark:text-study-300 hover:bg-study-50 dark:hover:bg-study-800 transition shadow-sm"
              title={darkMode ? "עבור למצב יום" : "עבור למצב לילה"}
            >
              {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-study-700" />}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-6xl mx-auto px-4 mt-2">
        <nav className="flex space-x-1 space-x-reverse border-t border-study-200/60 dark:border-study-800/60 pt-2">
          <button
            onClick={() => setCurrentTab('today')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-bold text-sm transition-all border-b-2 ${
              currentTab === 'today'
                ? 'border-study-500 text-study-800 dark:text-study-100 bg-study-50/80 dark:bg-study-850'
                : 'border-transparent text-study-600 dark:text-study-400 hover:text-study-900 dark:hover:text-study-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>הלימוד היומי</span>
          </button>

          <button
            onClick={() => setCurrentTab('calendar')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-bold text-sm transition-all border-b-2 ${
              currentTab === 'calendar'
                ? 'border-study-500 text-study-800 dark:text-study-100 bg-study-50/80 dark:bg-study-850'
                : 'border-transparent text-study-600 dark:text-study-400 hover:text-study-900 dark:hover:text-study-200'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>לוח שנתי</span>
          </button>

          <button
            onClick={() => setCurrentTab('progress')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-bold text-sm transition-all border-b-2 ${
              currentTab === 'progress'
                ? 'border-study-500 text-study-800 dark:text-study-100 bg-study-50/80 dark:bg-study-850'
                : 'border-transparent text-study-600 dark:text-study-400 hover:text-study-900 dark:hover:text-study-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>ההתקדמות שלי</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
