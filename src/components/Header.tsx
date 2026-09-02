import React from 'react';
import { BookOpen, Calendar as CalendarIcon, Award, Sun, Moon, Settings } from 'lucide-react';
import type { HebrewDateInfo } from '../utils/dateUtils';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  todayHebDate: HebrewDateInfo;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  siteTitle: string;
  siteSubtitle: string;
  logoUrl: string;
  logoSize?: number;
  logoPosition?: 'right' | 'left' | 'top' | 'hide';
  onOpenAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  todayHebDate,
  darkMode,
  setDarkMode,
  siteTitle,
  siteSubtitle,
  logoUrl,
  logoSize = 60,
  logoPosition = 'left',
  onOpenAdmin
}) => {
  const showLogo = logoPosition !== 'hide' && !!logoUrl;

  const renderLogo = () => {
    if (!showLogo) return null;
    return (
      <img 
        src={logoUrl || "/logo_icon.png"} 
        alt={siteTitle} 
        style={{ height: `${logoSize}px`, width: 'auto' }}
        className="object-contain shrink-0 transition-all duration-200 block" 
      />
    );
  };

  const renderTitle = () => (
    <div className={logoPosition === 'top' ? 'text-center' : 'text-right'}>
      <h1 className="text-xl md:text-2xl font-bold text-study-850 dark:text-study-150 font-serif leading-tight">
        {siteTitle}
      </h1>
      {siteSubtitle && (
        <p className="text-xs text-study-600 dark:text-study-400 mt-0.5 font-normal">
          {siteSubtitle}
        </p>
      )}
    </div>
  );

  return (
    <header className="bg-study-100 dark:bg-study-900 border-b border-study-200 dark:border-study-800 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Title and Logo Container */}
        {logoPosition === 'top' ? (
          <div className="flex flex-col items-center justify-center text-center gap-2">
            {renderLogo()}
            {renderTitle()}
          </div>
        ) : logoPosition === 'right' ? (
          <div className="flex items-center gap-3.5">
            {renderLogo()}
            {renderTitle()}
          </div>
        ) : (
          /* Default: logoPosition === 'left' -> Title is flush right (aligned with the cards below), Logo sits freely to the left! */
          <div className="flex items-center gap-3.5">
            {renderTitle()}
            {renderLogo()}
          </div>
        )}

        {/* Date and Controls */}
        <div className="flex items-center justify-between md:justify-end gap-3">
          {/* Hebrew Date Display */}
          <div className="bg-white dark:bg-study-850 px-3.5 py-1.5 rounded-xl border border-study-200 dark:border-study-800 text-right shadow-xs">
            <div className="text-[10px] text-study-500 dark:text-study-400 font-medium">היום לומדים:</div>
            <div className="text-xs sm:text-sm font-bold text-study-800 dark:text-study-200 font-serif">
              {todayHebDate.dayHebrew} ב{todayHebDate.monthHebrew} {todayHebDate.yearHebrew}
            </div>
          </div>

          {/* Theme Selector, Year Selection & Admin Button */}
          <div className="flex items-center gap-1.5">
            <select 
              className="bg-white dark:bg-study-850 border border-study-200 dark:border-study-800 rounded-xl px-2.5 py-2 text-xs text-study-700 dark:text-study-300 font-semibold focus:outline-none focus:ring-1 focus:ring-study-400 shadow-xs"
              defaultValue="year1"
              disabled
            >
              <option value="year1">שנה א׳ (תשפ"ז)</option>
              <option value="year2" disabled>שנה ב׳ (תשפ"ח) - בקרוב</option>
              <option value="year3" disabled>שנה ג׳ (תשפ"ט) - בקרוב</option>
            </select>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 bg-white dark:bg-study-850 border border-study-200 dark:border-study-800 rounded-xl text-study-600 dark:text-study-300 hover:bg-study-50 dark:hover:bg-study-800 transition shadow-xs cursor-pointer"
              title={darkMode ? "עבור למצב יום" : "עבור למצב לילה"}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-study-700" />}
            </button>

            {/* Admin Settings Button */}
            <button
              onClick={onOpenAdmin}
              className="p-2 bg-white dark:bg-study-850 border border-study-200 dark:border-study-800 rounded-xl text-study-600 dark:text-study-300 hover:bg-study-50 dark:hover:bg-study-800 transition shadow-xs cursor-pointer"
              title="מרכז ניהול ועריכת אתר"
            >
              <Settings className="w-4 h-4 text-study-600 dark:text-study-300" />
            </button>
          </div>
        </div>

      </div>

      {/* Main Navigation Tabs Bar */}
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-start gap-2 border-t border-study-200/60 dark:border-study-800/80 pt-1">
        <button
          onClick={() => setCurrentTab('today')}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition cursor-pointer ${
            currentTab === 'today'
              ? 'border-study-500 text-study-850 dark:text-study-150 bg-white/60 dark:bg-study-850/60 rounded-t-xl'
              : 'border-transparent text-study-600 dark:text-study-400 hover:text-study-850 dark:hover:text-study-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>הלימוד היומי</span>
        </button>

        <button
          onClick={() => setCurrentTab('calendar')}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition cursor-pointer ${
            currentTab === 'calendar'
              ? 'border-study-500 text-study-850 dark:text-study-150 bg-white/60 dark:bg-study-850/60 rounded-t-xl'
              : 'border-transparent text-study-600 dark:text-study-400 hover:text-study-850 dark:hover:text-study-200'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>לוח שנתי</span>
        </button>

        <button
          onClick={() => setCurrentTab('progress')}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition cursor-pointer ${
            currentTab === 'progress'
              ? 'border-study-500 text-study-850 dark:text-study-150 bg-white/60 dark:bg-study-850/60 rounded-t-xl'
              : 'border-transparent text-study-600 dark:text-study-400 hover:text-study-850 dark:hover:text-study-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>ההתקדמות שלי</span>
        </button>
      </div>
    </header>
  );
};
