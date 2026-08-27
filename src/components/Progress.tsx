import React, { useState, useEffect } from 'react';
import { Award, Book, Trash2, Flame, Clock, Calendar as CalendarIcon, CheckCircle2, Trophy, Star, TrendingUp } from 'lucide-react';
import { bookNameMap } from '../utils/dateUtils';
import { getPersonalStats } from '../utils/analyticsUtils';
import scheduleData from '../data/schedule.json';

interface ProgressProps {
  completedPortions: { [key: string]: boolean };
  resetProgress: () => void;
}

export const Progress: React.FC<ProgressProps> = ({ completedPortions, resetProgress }) => {
  const [personalStats, setPersonalStats] = useState(getPersonalStats());

  useEffect(() => {
    setPersonalStats(getPersonalStats());
  }, [completedPortions]);

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
  const remainingDays = Math.max(0, totalDays - completedDays);

  // Breakdown by book
  const bookStats: { [key: string]: { total: number; completed: number; color: string } } = {};
  
  const bookColors: { [key: string]: string } = {
    'Orot': 'from-amber-500 to-yellow-600',
    'Orot HaTorah': 'from-blue-500 to-indigo-600',
    'Orot HaTeshuvah': 'from-emerald-500 to-teal-600',
    'Musar Avikha': 'from-purple-500 to-violet-600',
    'Middot HaRa\'ayah': 'from-rose-500 to-pink-600',
    'Reish Millin': 'from-orange-500 to-amber-600'
  };

  allDays.forEach(({ month, day, item }) => {
    const book = item.book;
    if (!bookStats[book]) {
      bookStats[book] = { 
        total: 0, 
        completed: 0, 
        color: bookColors[book] || 'from-study-500 to-study-700' 
      };
    }
    bookStats[book].total += 1;
    if (completedPortions[`${month}-${day}`]) {
      bookStats[book].completed += 1;
    }
  });

  // Calculate Achievements
  const achievements = [
    {
      id: 'first_step',
      title: 'צעד ראשון',
      desc: 'השלמת יום הלימוד הראשון',
      icon: <Star className="w-5 h-5" />,
      unlocked: completedDays >= 1,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-300'
    },
    {
      id: 'streak_7',
      title: 'שבוע של קודש',
      desc: 'רצף לימוד של 7 ימים',
      icon: <Flame className="w-5 h-5" />,
      unlocked: personalStats.bestStreak >= 7 || personalStats.currentStreak >= 7,
      color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40 border-orange-300'
    },
    {
      id: 'month_complete',
      title: 'חודש שלם',
      desc: 'השלמת 30 ימי לימוד',
      icon: <CalendarIcon className="w-5 h-5" />,
      unlocked: completedDays >= 30,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300'
    },
    {
      id: 'halfway',
      title: 'חצי מסלול',
      desc: 'השלמת מעל 50% מהתוכנית',
      icon: <TrendingUp className="w-5 h-5" />,
      unlocked: completionPercentage >= 50,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300'
    },
    {
      id: 'master',
      title: 'סיום השנה הראשונה',
      desc: 'השלמת כל מחזור הלימוד השנתי',
      icon: <Trophy className="w-5 h-5" />,
      unlocked: completedDays >= totalDays && totalDays > 0,
      color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/40 border-yellow-300'
    }
  ];

  const handleReset = () => {
    if (window.confirm("האם אתה בטוח שברצונך לאפס את כל התקדמות הלימוד שלך? פעולה זו תאפס את הימים שסומנו.")) {
      resetProgress();
    }
  };

  const hours = Math.floor(personalStats.totalMinutes / 60);
  const mins = personalStats.totalMinutes % 60;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 transition-colors duration-200">
      
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-serif text-study-900 dark:text-study-100 flex items-center gap-2">
            <Award className="w-6 h-6 text-study-500" />
            <span>ההתקדמות והסטטיסטיקות האישיות שלי</span>
          </h2>
          <p className="text-xs text-study-600 dark:text-study-400 mt-1">
            מעקב אישי אחר רצף הלימוד, זמני העיון והשלמת ספרי הראי״ה
          </p>
        </div>

        <button
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 transition"
          title="אפס התקדמות"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>איפוס</span>
        </button>
      </div>

      {/* Highlights Grid (Streaks & Times) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Streak */}
        <div className="bg-white dark:bg-study-850 p-4 rounded-2xl border border-study-200 dark:border-study-800 shadow-xs text-center relative overflow-hidden">
          <div className="flex items-center justify-center gap-1.5 text-orange-500 mb-1">
            <Flame className="w-5 h-5 fill-current animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">רצף נוכחי</span>
          </div>
          <div className="text-2xl font-extrabold text-study-900 dark:text-study-100 font-serif">
            {personalStats.currentStreak} <span className="text-xs font-normal text-study-500">ימים</span>
          </div>
          <span className="text-[10px] text-study-400 block mt-0.5">שיא: {personalStats.bestStreak} ימים</span>
        </div>

        {/* Completed Days */}
        <div className="bg-white dark:bg-study-850 p-4 rounded-2xl border border-study-200 dark:border-study-800 shadow-xs text-center">
          <div className="flex items-center justify-center gap-1.5 text-emerald-500 mb-1">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">הושלמו</span>
          </div>
          <div className="text-2xl font-extrabold text-study-900 dark:text-study-100 font-serif">
            {completedDays} <span className="text-xs font-normal text-study-500">/ {totalDays}</span>
          </div>
          <span className="text-[10px] text-study-400 block mt-0.5">{remainingDays} ימים נותרו</span>
        </div>

        {/* Time Spent */}
        <div className="bg-white dark:bg-study-850 p-4 rounded-2xl border border-study-200 dark:border-study-800 shadow-xs text-center">
          <div className="flex items-center justify-center gap-1.5 text-blue-500 mb-1">
            <Clock className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">זמן לימוד</span>
          </div>
          <div className="text-2xl font-extrabold text-study-900 dark:text-study-100 font-serif">
            {hours > 0 ? `${hours} שעות` : `${mins || 15} דק'`}
          </div>
          <span className="text-[10px] text-study-400 block mt-0.5">מצטבר באפליקציה</span>
        </div>

        {/* Total Percent */}
        <div className="bg-white dark:bg-study-850 p-4 rounded-2xl border border-study-200 dark:border-study-800 shadow-xs text-center">
          <div className="flex items-center justify-center gap-1.5 text-amber-500 mb-1">
            <Trophy className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">אחוז שנתי</span>
          </div>
          <div className="text-2xl font-extrabold text-study-900 dark:text-study-100 font-serif">
            {completionPercentage}%
          </div>
          <span className="text-[10px] text-study-400 block mt-0.5">משנה ראשונה</span>
        </div>
      </div>

      {/* Main Overall Progress Card */}
      <div className="bg-white dark:bg-study-850 rounded-2xl border border-study-200 dark:border-study-800 p-6 shadow-md flex flex-col md:flex-row items-center gap-6">
        {/* Circle Progress Indicator */}
        <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="72"
              cy="72"
              r="58"
              className="stroke-study-100 dark:stroke-study-800"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="72"
              cy="72"
              r="58"
              className="stroke-study-500 transition-all duration-700"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={364}
              strokeDashoffset={364 - (364 * completionPercentage) / 100}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-3xl font-extrabold text-study-900 dark:text-study-100">{completionPercentage}%</span>
            <span className="text-[11px] text-study-500 block">נשלם מהמחזור</span>
          </div>
        </div>

        {/* Text Stats */}
        <div className="flex-1 space-y-3 text-center md:text-right">
          <h3 className="text-lg font-bold font-serif text-study-850 dark:text-study-150">
            קצב התקדמות בלימוד השנתי
          </h3>
          <p className="text-xs text-study-600 dark:text-study-400 leading-relaxed">
            השלמת עד כה <strong>{completedDays}</strong> מתוך <strong>{totalDays}</strong> קטעי לימוד בתוכנית השנתית (תשפ"ז).
            התמדה יומית של כ-10 דקות תאפשר לך לסיים את כל ששת ספרי היסוד של הראי״ה במועד!
          </p>

          <div className="w-full bg-study-100 dark:bg-study-800 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-study-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Progress Breakdown by Book */}
      <div className="bg-white dark:bg-study-850 rounded-2xl border border-study-200 dark:border-study-800 p-6 shadow-md space-y-4">
        <h3 className="text-base font-bold font-serif text-study-900 dark:text-study-100 flex items-center gap-2">
          <Book className="w-4 h-4 text-study-500" />
          <span>התקדמות לפי ספרי הלימוד</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(bookStats).map((bookKey) => {
            const { total, completed, color } = bookStats[bookKey];
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            const bookHebrew = bookNameMap[bookKey] || bookKey;

            return (
              <div 
                key={bookKey}
                className="bg-study-50/60 dark:bg-study-800/40 p-4 rounded-xl border border-study-200/80 dark:border-study-750 space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-study-850 dark:text-study-150 font-serif text-sm">
                    {bookHebrew}
                  </span>
                  <span className="font-semibold text-study-600 dark:text-study-300">
                    {completed} / {total} ימים ({pct}%)
                  </span>
                </div>

                <div className="w-full bg-study-200/60 dark:bg-study-700 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`bg-gradient-to-r ${color} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements & Milestones */}
      <div className="bg-white dark:bg-study-850 rounded-2xl border border-study-200 dark:border-study-800 p-6 shadow-md space-y-4">
        <h3 className="text-base font-bold font-serif text-study-900 dark:text-study-100 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>תגי הישג ואבני דרך</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {achievements.map((ach) => (
            <div 
              key={ach.id}
              className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                ach.unlocked 
                  ? `${ach.color} shadow-xs` 
                  : 'bg-study-50/40 dark:bg-study-900/20 border-study-200 dark:border-study-800 opacity-50 grayscale'
              }`}
            >
              <div className="p-2 bg-white/80 dark:bg-study-800 rounded-lg shadow-xs shrink-0">
                {ach.icon}
              </div>
              <div>
                <h4 className="text-xs font-bold text-study-900 dark:text-study-100">{ach.title}</h4>
                <p className="text-[10px] text-study-600 dark:text-study-400 mt-0.5">{ach.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
