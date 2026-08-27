import { Award, Book, Trash2 } from 'lucide-react';
import { bookNameMap } from '../utils/dateUtils';
import scheduleData from '../data/schedule.json';

interface ProgressProps {
  completedPortions: { [key: string]: boolean };
  resetProgress: () => void;
}

export const Progress: React.FC<ProgressProps> = ({ completedPortions, resetProgress }) => {
  const months = Object.keys(scheduleData);
  
  // Flatten all days in the schedule
  const allDays: { month: string; day: number; item: any }[] = [];
  months.forEach((m) => {
    const days = (scheduleData as any)[m] || [];
    days.forEach((item: any) => {
      allDays.push({ month: m, day: item.day, item });
    });
  });

  const totalDays = allDays.length;
  const completedDays = allDays.filter((d) => completedPortions[`${d.month}-${d.day}`]).length;
  const completionPercentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  // Breakdown by book
  const bookStats: { [key: string]: { total: number; completed: number } } = {};
  allDays.forEach(({ month, day, item }) => {
    const book = item.book;
    if (!bookStats[book]) {
      bookStats[book] = { total: 0, completed: 0 };
    }
    bookStats[book].total += 1;
    if (completedPortions[`${month}-${day}`]) {
      bookStats[book].completed += 1;
    }
  });

  const handleReset = () => {
    if (window.confirm("האם אתה בטוח שברצונך לאפס את כל התקדמות הלימוד שלך? פעולה זו אינה ניתנת לביטול.")) {
      resetProgress();
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 transition-colors duration-200">
      
      {/* Overview Card */}
      <div className="bg-white dark:bg-study-850 rounded-2xl border border-study-200 dark:border-study-800 p-6 shadow-md mb-6 flex flex-col md:flex-row items-center gap-6">
        
        {/* Circle Progress Indicator */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="72"
              cy="72"
              r="60"
              className="stroke-study-100 dark:stroke-study-800"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="72"
              cy="72"
              r="60"
              className="stroke-study-500 transition-all duration-500"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={377}
              strokeDashoffset={377 - (377 * completionPercentage) / 100}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-3xl font-extrabold text-study-850 dark:text-study-150">{completionPercentage}%</span>
            <span className="text-xxs text-study-500 block">נשלם מהמחזור</span>
          </div>
        </div>

        {/* Text Stats */}
        <div className="flex-1 text-right">
          <h3 className="text-xl font-bold font-serif text-study-800 dark:text-study-200 mb-2 flex items-center gap-2">
            <Award className="w-6 h-6 text-study-500" />
            <span>התקדמות הלימוד השנתית</span>
          </h3>
          <p className="text-sm text-study-600 dark:text-study-400 mb-4">
            מתוך <b>{totalDays} ימי הלימוד</b> של שנה ראשונה במחזור (תשפ"ז), למדת כבר <b>{completedDays} ימים</b>. כל הכבוד!
          </p>

          <div className="w-full bg-study-100 dark:bg-study-800 rounded-full h-3 overflow-hidden shadow-inner">
            <div 
              className="bg-study-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Book Breakdown Grid */}
      <div className="bg-white dark:bg-study-850 rounded-2xl border border-study-200 dark:border-study-800 p-6 shadow-md mb-6">
        <h3 className="text-lg font-bold font-serif text-study-800 dark:text-study-200 mb-4 pb-2 border-b border-study-200 dark:border-study-800">
          חלוקה לפי ספרים
        </h3>
        
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.keys(bookStats).map((book) => {
            const { total, completed } = bookStats[book];
            const pct = Math.round((completed / total) * 100);
            
            return (
              <div key={book} className="bg-study-50/50 dark:bg-study-900/10 p-4 rounded-xl border border-study-200/50 dark:border-study-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Book className="w-4 h-4 text-study-500" />
                    <span className="text-sm font-bold text-study-850 dark:text-study-250">{bookNameMap[book] || book}</span>
                  </div>
                  <span className="text-xs font-semibold text-study-600 dark:text-study-400">{completed} / {total} ימים ({pct}%)</span>
                </div>
                
                <div className="w-full bg-study-100 dark:bg-study-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-study-450 h-full rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset Section */}
      <div className="flex justify-end">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-xl font-bold text-sm transition-all shadow-sm"
        >
          <Trash2 className="w-4.5 h-4.5" />
          <span>איפוס כל התקדמות הלימוד</span>
        </button>
      </div>

    </div>
  );
};
