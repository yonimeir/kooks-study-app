import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, Circle, RefreshCw, ZoomIn, ZoomOut, ExternalLink, Type } from 'lucide-react';
import { fetchSefariaText, fetchWikisourceText, getHebrewDayChar, getHebrewNumber, getParagraphStartingIndex, bookNameMap } from '../utils/dateUtils';
import scheduleData from '../data/schedule.json';
import reishMillinData from '../data/reishMillin.json';

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
      if (todayPortion.book === "Reish Millin") {
        const localParas = (reishMillinData as any)[portionKey];
        if (localParas && localParas.length > 0) {
          loadedText = localParas;
        } else {
          loadedText = await fetchWikisourceText(todayPortion.ref);
        }
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
    'Tevet': 'טבת', 'Shevat': 'שבט', 'Adar': 'אדר', 'Nissan': 'ניסן',
    'Iyar': 'אייר', 'Sivan': 'סיון', 'Tammuz': 'תמוז', 'Av': 'אב'
  };

  if (!todayPortion) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-study-600 dark:text-study-400 font-serif">לא נמצא לימוד מתוזמן ליום זה.</p>
      </div>
    );
  }

  // External Reading link
  const getExternalLink = () => {
    if (todayPortion.book === "Reish Millin") {
      return `https://he.wikisource.org/wiki/ראש_מילין`;
    }
    return `https://www.sefaria.org/${todayPortion.ref}`;
  };

  const startingParagraphIndex = getParagraphStartingIndex(todayPortion.ref);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 transition-colors duration-200">
      {/* Date Navigation Header */}
      <div className="flex items-center justify-between bg-study-50 dark:bg-study-850 p-4 rounded-xl border border-study-200 dark:border-study-800 shadow-sm mb-6">
        <button
          onClick={handlePrevDay}
          className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-study-800 text-study-700 dark:text-study-300 border border-study-250 dark:border-study-700 rounded-lg hover:bg-study-100 dark:hover:bg-study-750 transition-all font-semibold text-sm shadow-sm"
        >
          <ChevronRight className="w-4 h-4" />
          <span>יום קודם</span>
        </button>

        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-study-500 dark:text-study-400 block mb-0.5">לוח הלימוד</span>
          <h2 className="text-lg md:text-xl font-bold font-serif text-study-800 dark:text-study-200">
            {getHebrewDayChar(activeDay)} ב{monthNameMap[activeMonth] || activeMonth}
          </h2>
        </div>

        <button
          onClick={handleNextDay}
          className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-study-800 text-study-700 dark:text-study-300 border border-study-250 dark:border-study-700 rounded-lg hover:bg-study-100 dark:hover:bg-study-750 transition-all font-semibold text-sm shadow-sm"
        >
          <span>יום הבא</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Main Reading Card */}
      <div className="bg-white dark:bg-study-850 rounded-2xl border border-study-200 dark:border-study-800 shadow-md overflow-hidden transition-all duration-200">
        
        {/* Card Header Info */}
        <div className="bg-study-100/50 dark:bg-study-900/50 border-b border-study-200 dark:border-study-800 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="inline-block px-2.5 py-0.5 bg-study-500 text-white rounded-full text-xs font-bold shadow-sm mb-1.5">
              {todayPortion.book === "Reish Millin" ? "ריש מילין" : (bookNameMap[todayPortion.book] || todayPortion.book)}
            </span>
            <h3 className="text-lg md:text-xl font-bold font-serif text-study-800 dark:text-study-200">
              {todayPortion.heTitle}
            </h3>
            {todayPortion.portion && (
              <p className="text-xs font-medium text-study-600 dark:text-study-400 mt-1">
                {todayPortion.portion}
              </p>
            )}
          </div>

          {/* Reading Customization Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFontFamily}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-study-800 border border-study-200 dark:border-study-700 rounded-lg text-study-700 dark:text-study-300 hover:bg-study-50 dark:hover:bg-study-700 transition shadow-xs text-xs font-semibold"
              title="החלף פונט קריאה"
            >
              <Type className="w-3.5 h-3.5 text-study-500" />
              <span>{fontLabels[fontFamily]}</span>
            </button>

            <button
              onClick={() => setFontSize(Math.max(14, fontSize - 2))}
              className="p-2 bg-white dark:bg-study-800 border border-study-200 dark:border-study-700 rounded-lg text-study-600 dark:text-study-300 hover:bg-study-50 dark:hover:bg-study-700 transition shadow-sm"
              title="הקטן גופן"
            >
              <ZoomOut className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => setFontSize(Math.min(28, fontSize + 2))}
              className="p-2 bg-white dark:bg-study-800 border border-study-200 dark:border-study-700 rounded-lg text-study-600 dark:text-study-300 hover:bg-study-50 dark:hover:bg-study-700 transition shadow-sm"
              title="הגדל גופן"
            >
              <ZoomIn className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Text Pane with Distinct Paragraphs */}
        <div className="p-5 md:p-8 min-h-[300px] flex flex-col justify-between">
          {loading ? (
            <div className="flex flex-col items-center justify-center flex-1 py-16">
              <RefreshCw className="w-8 h-8 text-study-500 animate-spin mb-3" />
              <p className="text-sm text-study-500 dark:text-study-400">טוען את הטקסט...</p>
            </div>
          ) : (
            <div 
              className={`${fontFamily} text-study-900 dark:text-study-100 space-y-5`}
              style={{ fontSize: `${fontSize}px`, direction: 'rtl' }}
            >
              {text.map((paragraph, index) => {
                const currentNum = startingParagraphIndex + index;
                const isReishMillin = todayPortion.book === "Reish Millin";
                const numHeb = getHebrewNumber(currentNum);

                return (
                  <div 
                    key={index} 
                    className="bg-study-50/70 dark:bg-study-900/40 p-5 md:p-6 rounded-2xl border border-study-200/80 dark:border-study-800 shadow-xs transition-all hover:border-study-300 dark:hover:border-study-700"
                  >
                    {!isReishMillin && (
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-study-200/60 dark:border-study-800/80">
                        <span className="inline-flex items-center justify-center font-bold text-study-800 dark:text-study-200 bg-study-200/90 dark:bg-study-800 px-3 py-0.5 rounded-lg text-xs font-serif shadow-xs">
                          פסקה {numHeb}
                        </span>
                      </div>
                    )}
                    <p className="leading-[1.85] text-justify select-text indent-1 tracking-normal font-normal">
                      {paragraph}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Action and Links */}
          <div className="border-t border-study-200 dark:border-study-800 mt-8 pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            
            {/* Mark as Completed */}
            <button
              onClick={() => toggleComplete(activeMonth, activeDay)}
              className={`flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl border font-bold text-sm transition-all shadow-sm ${
                isCompleted
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-400'
                  : 'bg-study-500 hover:bg-study-600 border-transparent text-white dark:bg-study-600 dark:hover:bg-study-700'
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle className="w-5 h-5 fill-current" />
                  <span>נלמד בהצלחה! (סמן כלא נלמד)</span>
                </>
              ) : (
                <>
                  <Circle className="w-5 h-5" />
                  <span>סמן כנלמד היום</span>
                </>
              )}
            </button>

            {/* Read External */}
            <a
              href={getExternalLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-study-600 hover:text-study-800 dark:text-study-400 dark:hover:text-study-200 transition-colors"
            >
              <span>קרא ב{todayPortion.book === "Reish Millin" ? "ויקיטקסט" : "ספריא"} המקורי</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

          </div>
        </div>

      </div>
    </div>
  );
};
