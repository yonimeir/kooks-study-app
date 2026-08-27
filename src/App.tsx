import React, { useState, useEffect } from 'react';
import { Phone, Mail, MessageCircle, Settings } from 'lucide-react';
import { Header } from './components/Header';
import { DedicationBanner } from './components/DedicationBanner';
import { TodayView } from './components/TodayView';
import { Calendar } from './components/Calendar';
import { Progress } from './components/Progress';
import { AdminDashboard } from './components/AdminDashboard';
import { getTodayHebrewDate } from './utils/dateUtils';
import type { HebrewDateInfo } from './utils/dateUtils';
import { initGoogleAnalytics } from './utils/analyticsUtils';
import initialSiteConfig from './data/siteConfig.json';
import initialScheduleData from './data/schedule.json';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('today');
  const [todayHebDate] = useState<HebrewDateInfo>(getTodayHebrewDate());
  
  // Site Configuration State (Hydrated from localStorage or JSON)
  const [siteConfig, setSiteConfig] = useState<any>(() => {
    const saved = localStorage.getItem('site_config_custom');
    return saved ? JSON.parse(saved) : initialSiteConfig;
  });

  // Schedule Data State (Hydrated from localStorage or JSON)
  const [scheduleData, setScheduleData] = useState<any>(() => {
    const saved = localStorage.getItem('schedule_data_custom');
    return saved ? JSON.parse(saved) : initialScheduleData;
  });

  // Admin Dashboard Modal State
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);

  // Set default active month and day to today's Hebrew date (if it is listed in the schedule, else fallback to Elul 3)
  const [activeMonth, setActiveMonth] = useState<string>('Elul');
  const [activeDay, setActiveDay] = useState<number>(3);

  // Completed portions tracking
  const [completedPortions, setCompletedPortions] = useState<{ [key: string]: boolean }>(() => {
    const saved = localStorage.getItem('completed_portions_year1');
    return saved ? JSON.parse(saved) : {};
  });

  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('dark_mode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    // If today's Hebrew month is in the schedule, default to it
    const validMonths = ['Elul', 'Tishrei', 'Cheshvan', 'Kislev', 'Tevet', 'Shevat', 'Adar', 'Adar1', 'Adar2', 'Nissan', 'Iyar', 'Sivan', 'Tammuz', 'Av'];
    if (validMonths.includes(todayHebDate.monthKey)) {
      setActiveMonth(todayHebDate.monthKey);
      setActiveDay(todayHebDate.day);
    }
  }, [todayHebDate]);

  useEffect(() => {
    localStorage.setItem('completed_portions_year1', JSON.stringify(completedPortions));
  }, [completedPortions]);

  useEffect(() => {
    localStorage.setItem('dark_mode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (siteConfig?.gaMeasurementId) {
      initGoogleAnalytics(siteConfig.gaMeasurementId);
    }
  }, [siteConfig?.gaMeasurementId]);

  const handleSaveSiteConfig = (newConfig: any) => {
    setSiteConfig(newConfig);
    localStorage.setItem('site_config_custom', JSON.stringify(newConfig));
  };

  const handleSaveScheduleData = (newSchedule: any) => {
    setScheduleData(newSchedule);
    localStorage.setItem('schedule_data_custom', JSON.stringify(newSchedule));
  };

  const toggleComplete = (month: string, day: number) => {
    const key = `${month}-${day}`;
    setCompletedPortions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const resetProgress = () => {
    setCompletedPortions({});
  };

  const setDate = (month: string, day: number) => {
    setActiveMonth(month);
    setActiveDay(day);
  };

  return (
    <div className="min-h-screen bg-study-50 dark:bg-study-950 text-study-900 dark:text-study-100 flex flex-col transition-colors duration-200">
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        todayHebDate={todayHebDate}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        siteTitle={siteConfig.siteTitle || "עיקרי משנת הראי״ה"}
        siteSubtitle={siteConfig.siteSubtitle || "תוכנית לימוד יומית תלת-שנתית בכתבי הרב קוק זצ״ל"}
        logoUrl={siteConfig.logoUrl || "/logo.png"}
        logoSize={siteConfig.logoSize || 60}
        logoPosition={siteConfig.logoPosition || "right"}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Dedication Banner for Refuah */}
      <DedicationBanner 
        names={siteConfig.refuahNames || []} 
        suffix={siteConfig.refuahSuffix || "בתוך שאר חולי עמו ישראל"} 
      />
      
      <main className="flex-1 w-full max-w-6xl mx-auto py-4">
        {currentTab === 'today' && (
          <TodayView
            activeMonth={activeMonth}
            activeDay={activeDay}
            setDate={setDate}
            completedPortions={completedPortions}
            toggleComplete={toggleComplete}
          />
        )}
        {currentTab === 'calendar' && (
          <Calendar
            activeMonth={activeMonth}
            activeDay={activeDay}
            setDate={setDate}
            setCurrentTab={setCurrentTab}
            completedPortions={completedPortions}
          />
        )}
        {currentTab === 'progress' && (
          <Progress
            completedPortions={completedPortions}
            resetProgress={resetProgress}
          />
        )}
      </main>

      {/* Admin Dashboard Modal */}
      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        siteConfig={siteConfig}
        onSaveSiteConfig={handleSaveSiteConfig}
        scheduleData={scheduleData}
        onSaveScheduleData={handleSaveScheduleData}
      />

      <footer className="py-8 border-t border-study-200 dark:border-study-800 bg-study-100/40 dark:bg-study-900/40 transition-colors">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
          <p className="text-xs text-study-700 dark:text-study-300 font-serif leading-relaxed max-w-2xl mx-auto">
            {siteConfig.footerQuote || "\"מטרת התוכנית היא ליצור היכרות רציפה עם עיקרי משנת הראי״ה, מתוך מפגש יומי עם לשונו ורעיונותיו. הלימוד מכוון להבנה פשוטה וישירה ככל האפשר, כפי כוחו של כל לומד, ולהתבסמות מאורם של הדברים.\""}
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-study-600 dark:text-study-400">
            <span className="font-medium">{siteConfig.siteTitle || "אפליקציית \"עיקרי משנת הראי\"ה\""}</span>
            <span className="hidden sm:inline">•</span>
            
            {/* Contact Details */}
            <div className="flex flex-wrap items-center justify-center gap-3 bg-white dark:bg-study-850 px-4 py-2 rounded-xl border border-study-200 dark:border-study-800 shadow-xs">
              <span className="font-bold text-study-800 dark:text-study-200">
                צור קשר: {siteConfig.contact?.name || "שי קלדרון"}
              </span>
              
              {siteConfig.contact?.phone && (
                <a 
                  href={`tel:${siteConfig.contact.phoneRaw || siteConfig.contact.phone}`} 
                  className="inline-flex items-center gap-1 text-study-600 hover:text-study-900 dark:text-study-300 dark:hover:text-white transition-colors"
                  title="חייג"
                >
                  <Phone className="w-3.5 h-3.5 text-study-500" />
                  <span dir="ltr">{siteConfig.contact.phone}</span>
                </a>
              )}

              {siteConfig.contact?.whatsapp && (
                <a 
                  href={`https://wa.me/${siteConfig.contact.whatsapp}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 transition-colors"
                  title="שלח הודעת וואטסאפ"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>וואטסאפ</span>
                </a>
              )}

              {siteConfig.contact?.email && (
                <a 
                  href={`mailto:${siteConfig.contact.email}`} 
                  className="inline-flex items-center gap-1 text-study-600 hover:text-study-900 dark:text-study-300 dark:hover:text-white transition-colors"
                  title="שלח מייל"
                >
                  <Mail className="w-3.5 h-3.5 text-study-500" />
                  <span>דוא״ל</span>
                </a>
              )}
            </div>

            {/* Discreet Admin Link */}
            <span className="hidden sm:inline">•</span>
            <button
              onClick={() => setIsAdminOpen(true)}
              className="inline-flex items-center gap-1 text-xs text-study-500 hover:text-study-800 dark:text-study-400 dark:hover:text-study-200 underline transition cursor-pointer"
            >
              <Settings className="w-3 h-3" />
              <span>ניהול אתר</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
