import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, Circle, RefreshCw, ZoomIn, ZoomOut, ExternalLink, Type } from 'lucide-react';
import { fetchSefariaText, fetchWikisourceText, getHebrewDayChar, getHebrewNumber, getParagraphStartingIndex, bookNameMap } from '../utils/dateUtils';
import { recordStudyActivity } from '../utils/analyticsUtils';
import scheduleData from '../data/schedule.json';
import allDailyTextsData from '../data/allDailyTexts.json';

interface TodayViewProps {
  activeMonth: string;
  activeDay: number;
  setDate: (month: string, day: number) => void;
  completedPortions: { [key: string]: boolean };
  toggleComplete: (month: string, day: number) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  activeMonth,
  activeDay,
  setDate,
  completedPortions,
  toggleComplete
}) => {
  const [text, setText] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<number>(19); // Default font size in px
  const [fontFamily, setFontFamily] = useState<string>(() => {
    return localStorage.getItem('reader_font_family') || 'font-serif';
  });

  const monthSchedule = (scheduleData as any)[activeMonth] || [];
  const todayPortion = monthSchedule.find((item: any) => item.day === activeDay);

  // Completed status key
  const portionKey = `${activeMonth}-${activeDay}`;
  const isCompleted = completedPortions[portionKey] || false;

  useEffect(() => {
    let active = true;
    
    async function loadText() {
      if (!todayPortion) return;
      setLoading(true);
      setText([]);

      let loadedText: string[] = [];

      // 1. Check local pre-bundled database (all verified 13 months)
      const bundledParas = (allDailyTextsData as any)[portionKey];
      if (bundledParas && Array.isArray(bundledParas) && bundledParas.length > 0) {
        loadedText = bundledParas;
      } else if (todayPortion.book === "Reish Millin") {
        loadedText = await fetchWikisourceText(todayPortion.ref);
      } else {
        loadedText = await fetchSefariaText(todayPortion.ref);
      }

      if (active) {
        setText(loadedText);
        setLoading(false);
      }
    }

    loadText();
    return () => {
      active = false;
    };
  }, [activeMonth, activeDay, todayPortion, portionKey]);

  const handleNextDay = () => {
    const nextIdx = monthSchedule.findIndex((item: any) => item.day === activeDay) + 1;
    if (nextIdx < monthSchedule.length) {
      setDate(activeMonth, monthSchedule[nextIdx].day);
    } else {
      // Move to next month
      const months = Object.keys(scheduleData);
      const nextMonthIdx = months.indexOf(activeMonth) + 1;
      if (nextMonthIdx < months.length) {
        const nextMonth = months[nextMonthIdx];
        const nextMonthData = (scheduleData as any)[nextMonth] || [];
        if (nextMonthData.length > 0) {
          setDate(nextMonth, nextMonthData[0].day);
        }
      }
    }
  };

  const handlePrevDay = () => {
    const prevIdx = monthSchedule.findIndex((item: any) => item.day === activeDay) - 1;
    if (prevIdx >= 0) {
      setDate(activeMonth, monthSchedule[prevIdx].day);
    } else {
      // Move to previous month
      const months = Object.keys(scheduleData);
      const prevMonthIdx = months.indexOf(activeMonth) - 1;
      if (prevMonthIdx >= 0) {
        const prevMonth = months[prevMonthIdx];
        const prevMonthData = (scheduleData as any)[prevMonth] || [];
        if (prevMonthData.length > 0) {
          setDate(prevMonth, prevMonthData[prevMonthData.length - 1].day);
        }
      }
    }
  };

  const toggleFontFamily = () => {
    const fonts = ['font-serif', 'font-sans', 'font-alef'];
    const nextIdx = (fonts.indexOf(fontFamily) + 1) % fonts.length;
    const nextFont = fonts[nextIdx];
    setFontFamily(nextFont);
    localStorage.setItem('reader_font_family', nextFont);
  };

  const fontLabels: { [key: string]: string } = {
    'font-serif': 'פרנק-ריהל',
    'font-sans': 'אסיסטנט',
    'font-alef': 'אלף'
  };

  // Convert month key to Hebrew name
  const monthNameMap: { [key: string]: string } = {
    'Elul': 'אלול', 'Tishrei': 'תשרי', 'Cheshvan': 'חשוון', 'Kislev': 'כסלו',
    'Tevet': 'טבת', 'Shevat': 'שבט', 'Adar': 'אדר', 'Adar1': 'אדר א\'', 'Adar2': 'אדר ב\'',
    'Nissan': 'ניסן', 'Iyar': 'אייר', 'Sivan': 'סיון', 'Tammuz': 'תמוז', 'Av': 'אב'
  };

  if (!todayPortion) {
    return (
      <div className="p-8 text-center bg-white dark:bg-study-850 rounded-2xl shadow-sm border border-study-200 dark:border-study-800">
        <p className="text-study-600 dark:text-study-400">לא נמצא לימוד עבור יום זה.</p>
      </div>
    );
  }

  const startParagraphIndex = getParagraphStartingIndex(todayPortion.ref);

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4">
      {/* Top Navigation Control Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-study-850 p-4 rounded-2xl shadow-xs border border-study-200 dark:border-study-800 transition-colors">
        <button
          onClick={handlePrevDay}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-study-700 dark:text-study-300 hover:bg-study-100 dark:hover:bg-study-800 border border-study-300 dark:border-study-700 transition"
        >
          <ChevronRight className="w-4 h-4" />
          <span>יום קודם</span>
        </button>

        <div className="text-center">
          <span className="text-xs font-semibold text-study-500 dark:text-study-400 uppercase tracking-wider block">
            לוח הלימוד
          </span>
          <span className="text-lg font-bold font-serif text-study-800 dark:text-study-200">
            {getHebrewDayChar(activeDay)} ב{monthNameMap[activeMonth] || activeMonth}
          </span>
        </div>

        <button
          onClick={handleNextDay}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-study-700 dark:text-study-300 hover:bg-study-100 dark:hover:bg-study-800 border border-study-300 dark:border-study-700 transition"
        >
          <span>יום הבא</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Main Study Card */}
      <div className="bg-white dark:bg-study-850 rounded-2xl shadow-md border border-study-200 dark:border-study-800 overflow-hidden transition-colors">
        {/* Book & Title Header */}
        <div className="p-6 md:p-8 bg-study-50/70 dark:bg-study-900/50 border-b border-study-200/80 dark:border-study-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-block bg-study-500 text-white text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
              {bookNameMap[todayPortion.book] || todayPortion.book}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-study-800 dark:text-study-100 mt-1">
              {todayPortion.heTitle}
            </h2>
            {todayPortion.portion && (
              <p className="text-xs text-study-600 dark:text-study-400 mt-1">
                {todayPortion.portion}
              </p>
            )}
          </div>

          {/* Reading Controls */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* Font Family Switcher */}
            <button
              onClick={toggleFontFamily}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-study-800 border border-study-200 dark:border-study-700 rounded-lg text-xs font-semibold text-study-700 dark:text-study-300 hover:bg-study-50 dark:hover:bg-study-750 transition shadow-xs"
              title="החלף גופן (פונט)"
            >
              <Type className="w-3.5 h-3.5 text-study-500" />
              <span>{fontLabels[fontFamily] || 'גופן'}</span>
            </button>

            {/* Font Size Zoom Controls */}
            <div className="flex items-center bg-white dark:bg-study-800 border border-study-200 dark:border-study-700 rounded-lg p-1 shadow-xs">
              <button
                onClick={() => setFontSize(prev => Math.max(prev - 2, 14))}
                className="p-1.5 text-study-600 dark:text-study-400 hover:text-study-900 dark:hover:text-white rounded hover:bg-study-100 dark:hover:bg-study-700 transition"
                title="הקטן גופן"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setFontSize(prev => Math.min(prev + 2, 32))}
                className="p-1.5 text-study-600 dark:text-study-400 hover:text-study-900 dark:hover:text-white rounded hover:bg-study-100 dark:hover:bg-study-700 transition"
                title="הגדל גופן"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Text Reader Body */}
        <div className="p-6 md:p-10 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-study-500">
              <RefreshCw className="w-8 h-8 animate-spin text-study-500" />
              <p className="text-sm font-medium">טוען את תוכן הלימוד...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {text.map((paragraph, idx) => (
                <div 
                  key={idx} 
                  className="bg-study-50/40 dark:bg-study-900/30 p-5 rounded-xl border border-study-100 dark:border-study-800/80 hover:border-study-200 dark:hover:border-study-700/80 transition-all"
                >
                  <span className="inline-block text-xs font-bold text-study-600 dark:text-study-400 bg-study-200/50 dark:bg-study-800 px-2 py-0.5 rounded-md mb-2">
                    פסקה {getHebrewNumber(startParagraphIndex + idx)}
                  </span>
                  <p 
                    style={{ fontSize: `${fontSize}px` }}
                    className={`${fontFamily} text-study-850 dark:text-study-150 leading-[1.85] text-justify font-normal select-text`}
                  >
                    {paragraph}
                  </p>
                </div>
              ))}

              {text.length === 0 && (
                <p className="text-study-600 dark:text-study-400 text-center py-8">
                  לא נמצא טקסט עבור קטע זה.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Completion Footer */}
        <div className="p-6 bg-study-50 dark:bg-study-900/60 border-t border-study-200 dark:border-study-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-study-500 dark:text-study-400">
            {todayPortion.book !== "Reish Millin" && todayPortion.ref && (
              <a
                href={`https://www.sefaria.org/${todayPortion.ref}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-study-700 dark:hover:text-study-300 underline"
              >
                <span>פתח בספריא</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <button
            onClick={() => {
              if (!isCompleted) {
                recordStudyActivity(portionKey, todayPortion.book, 8);
              }
              toggleComplete(activeMonth, activeDay);
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition-all ${
              isCompleted
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-study-500 text-white hover:bg-study-600'
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle className="w-5 h-5 fill-current" />
                <span>הלימוד הושלם!</span>
              </>
            ) : (
              <>
                <Circle className="w-5 h-5" />
                <span>סמן כהושלם</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
