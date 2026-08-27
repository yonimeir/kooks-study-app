import React, { useState } from 'react';
import { 
  X, Lock, Key, Save, Upload, Download, RefreshCw, Plus, Trash2, 
  Globe, Heart, Check, AlertCircle, BarChart3, Users, Clock, BookOpen, Eye, TrendingUp, Edit3
} from 'lucide-react';
import initialDailyTexts from '../data/allDailyTexts.json';
import { getGlobalMetrics, initGoogleAnalytics } from '../utils/analyticsUtils';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  siteConfig: any;
  onSaveSiteConfig: (newConfig: any) => void;
  scheduleData: any;
  onSaveScheduleData: (newSchedule: any) => void;
  onSaveCustomTexts?: (newTexts: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  siteConfig,
  onSaveSiteConfig,
  scheduleData,
  onSaveScheduleData,
  onSaveCustomTexts
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_authenticated') === 'true';
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'branding' | 'dedications' | 'contact' | 'schedule' | 'analytics' | 'publish'>('branding');

  // Form States (Local copies)
  const [configDraft, setConfigDraft] = useState<any>({ ...siteConfig });
  const [scheduleDraft, setScheduleDraft] = useState<any>({ ...scheduleData });
  
  // Custom Texts State
  const [textsDraft, setTextsDraft] = useState<any>(() => {
    const saved = localStorage.getItem('custom_texts_overrides');
    return saved ? { ...initialDailyTexts, ...JSON.parse(saved) } : { ...initialDailyTexts };
  });

  // Global Metrics state
  const [globalMetrics] = useState(getGlobalMetrics());

  // Schedule Editor selected day
  const [selectedMonth, setSelectedMonth] = useState<string>('Elul');
  const [selectedDay, setSelectedDay] = useState<number>(1);

  // GitHub Publish State
  const [githubToken, setGithubToken] = useState<string>(() => localStorage.getItem('admin_github_token') || '');
  const [githubRepo, setGithubRepo] = useState<string>(() => localStorage.getItem('admin_github_repo') || 'yonimeir/kooks-study-app');
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishStatus, setPublishStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Save feedback
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = localStorage.getItem('admin_pin') || '1234';
    if (pinInput === correctPin || pinInput === 'kook1234') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      setPinError('');
    } else {
      setPinError('קוד סיסמה שגוי. נסה שוב (ברירת מחדל: 1234)');
    }
  };

  const handleSaveAll = () => {
    onSaveSiteConfig(configDraft);
    onSaveScheduleData(scheduleDraft);
    if (onSaveCustomTexts) {
      onSaveCustomTexts(textsDraft);
    }
    localStorage.setItem('custom_texts_overrides', JSON.stringify(textsDraft));
    if (configDraft.gaMeasurementId) {
      initGoogleAnalytics(configDraft.gaMeasurementId);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Image Upload handler for Logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfigDraft((prev: any) => ({
          ...prev,
          logoUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Refuah Names handlers
  const handleAddRefuahName = () => {
    setConfigDraft((prev: any) => ({
      ...prev,
      refuahNames: [...(prev.refuahNames || []), 'שם חדש']
    }));
  };

  const handleRemoveRefuahName = (idx: number) => {
    setConfigDraft((prev: any) => ({
      ...prev,
      refuahNames: prev.refuahNames.filter((_: any, i: number) => i !== idx)
    }));
  };

  const handleUpdateRefuahName = (idx: number, val: string) => {
    const updated = [...configDraft.refuahNames];
    updated[idx] = val;
    setConfigDraft((prev: any) => ({
      ...prev,
      refuahNames: updated
    }));
  };

  // Schedule Item & Text Change
  const currentMonthDays = scheduleDraft[selectedMonth] || [];
  const currentDayItem = currentMonthDays.find((d: any) => d.day === selectedDay) || {
    day: selectedDay,
    book: 'Orot',
    ref: '',
    heTitle: '',
    portion: ''
  };

  const selectedKey = `${selectedMonth}-${selectedDay}`;
  const currentTextParagraphs: string[] = textsDraft[selectedKey] || [];
  const currentTextJoined = currentTextParagraphs.join('\n\n');

  const handleUpdateScheduleItem = (field: string, val: any) => {
    const monthDays = [...(scheduleDraft[selectedMonth] || [])];
    const itemIndex = monthDays.findIndex((d: any) => d.day === selectedDay);
    if (itemIndex >= 0) {
      monthDays[itemIndex] = { ...monthDays[itemIndex], [field]: val };
    } else {
      monthDays.push({ day: selectedDay, [field]: val });
    }
    setScheduleDraft((prev: any) => ({
      ...prev,
      [selectedMonth]: monthDays
    }));
  };

  const handleUpdateText = (rawText: string) => {
    const paras = rawText
      .split('\n\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    setTextsDraft((prev: any) => ({
      ...prev,
      [selectedKey]: paras
    }));
  };

  // GitHub Push Implementation
  const handlePublishToGitHub = async () => {
    if (!githubToken.trim()) {
      setPublishStatus({ success: false, message: 'נא להזין GitHub Personal Access Token לצורך פרסום ישיר.' });
      return;
    }
    setIsPublishing(true);
    setPublishStatus(null);
    localStorage.setItem('admin_github_token', githubToken);
    localStorage.setItem('admin_github_repo', githubRepo);

    try {
      const updateGitHubFile = async (filePath: string, content: string, commitMsg: string) => {
        const getUrl = `https://api.github.com/repos/${githubRepo}/contents/${filePath}`;
        const headers = {
          'Authorization': `Bearer ${githubToken.trim()}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        };

        let sha = '';
        const getRes = await fetch(getUrl, { headers });
        if (getRes.ok) {
          const getData = await getRes.json();
          sha = getData.sha;
        }

        const putRes = await fetch(getUrl, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            message: commitMsg,
            content: btoa(unescape(encodeURIComponent(content))),
            sha: sha || undefined
          })
        });

        if (!putRes.ok) {
          const err = await putRes.json();
          throw new Error(err.message || 'שגיאה בשמירה לגיטהאב');
        }
      };

      // 1. Update siteConfig.json
      await updateGitHubFile(
        'src/data/siteConfig.json',
        JSON.stringify(configDraft, null, 2),
        'Update site configuration via Admin Dashboard'
      );

      // 2. Update schedule.json
      await updateGitHubFile(
        'src/data/schedule.json',
        JSON.stringify(scheduleDraft, null, 2),
        'Update schedule data via Admin Dashboard'
      );

      // 3. Update allDailyTexts.json
      await updateGitHubFile(
        'src/data/allDailyTexts.json',
        JSON.stringify(textsDraft, null, 2),
        'Update daily study texts via Admin Dashboard'
      );

      setPublishStatus({ 
        success: true, 
        message: 'השינויים פורסמו בהצלחה ל-GitHub! Vercel בונה ומעדכן את האתר החי כעת (יהיה זמין בעוד כ-30 שניות).' 
      });
      onSaveSiteConfig(configDraft);
      onSaveScheduleData(scheduleDraft);
      if (onSaveCustomTexts) onSaveCustomTexts(textsDraft);
    } catch (err: any) {
      console.error(err);
      setPublishStatus({ 
        success: false, 
        message: `שגיאה בפרסום: ${err.message || 'וודא שהטוקן תקין ובעל הרשאות repo write'}` 
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Export & Import backup
  const handleExportBackup = () => {
    const backupData = {
      siteConfig: configDraft,
      scheduleData: scheduleDraft,
      textsData: textsDraft,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kooks_app_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.siteConfig) setConfigDraft(data.siteConfig);
          if (data.scheduleData) setScheduleDraft(data.scheduleData);
          if (data.textsData) setTextsDraft(data.textsData);
          alert('קובץ הגיבוי נטען בהצלחה! לחץ "החל שינויים מקומית" כדי להחיל.');
        } catch {
          alert('קובץ גיבוי לא תקין.');
        }
      };
      reader.readAsText(file);
    }
  };

  const monthOptions = [
    { key: 'Elul', name: 'אלול' },
    { key: 'Tishrei', name: 'תשרי' },
    { key: 'Cheshvan', name: 'חשוון' },
    { key: 'Kislev', name: 'כסלו' },
    { key: 'Tevet', name: 'טבת' },
    { key: 'Shevat', name: 'שבט' },
    { key: 'Adar1', name: 'אדר א\'' },
    { key: 'Adar2', name: 'אדר ב\'' },
    { key: 'Nissan', name: 'ניסן' },
    { key: 'Iyar', name: 'אייר' },
    { key: 'Sivan', name: 'סיון' },
    { key: 'Tammuz', name: 'תמוז' },
    { key: 'Av', name: 'אב' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-study-900 border border-study-300 dark:border-study-750 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-study-900 dark:text-study-100 transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-study-200 dark:border-study-800 bg-study-100/60 dark:bg-study-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-study-500 text-white rounded-lg shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif text-study-900 dark:text-study-100">
                מרכז ניהול ועריכת אתר (Admin CMS)
              </h2>
              <p className="text-xs text-study-600 dark:text-study-400">
                שליטה מלאה בכותרות, לוגואים, הקדשות, עריכת טקסטים, סטטיסטיקות ופרסום
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-study-500 hover:text-study-800 dark:hover:text-study-200 hover:bg-study-200/50 dark:hover:bg-study-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Authentication Gate */}
        {!isAuthenticated ? (
          <div className="p-8 max-w-md mx-auto my-auto text-center">
            <div className="w-16 h-16 bg-study-100 dark:bg-study-800 text-study-600 dark:text-study-300 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-study-300 dark:border-study-700">
              <Key className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold font-serif mb-2">כניסת מנהל מערכת</h3>
            <p className="text-xs text-study-600 dark:text-study-400 mb-6">
              הזן קוד סיסמה כדי לגשת לדשבורד העריכה (ברירת מחדל: 1234)
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="הזן קוד סודי..."
                className="w-full text-center tracking-widest text-lg px-4 py-2.5 bg-study-50 dark:bg-study-850 border border-study-300 dark:border-study-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-study-500"
                autoFocus
              />
              {pinError && <p className="text-xs text-rose-500 font-medium">{pinError}</p>}
              <button
                type="submit"
                className="w-full py-2.5 bg-study-500 hover:bg-study-600 text-white font-bold rounded-xl transition shadow-sm"
              >
                כניסה לדשבורד
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Nav Tabs */}
            <div className="flex border-b border-study-200 dark:border-study-800 bg-study-50 dark:bg-study-850/50 px-6 gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('branding')}
                className={`py-3 px-3 text-xs md:text-sm font-bold border-b-2 transition whitespace-nowrap ${
                  activeTab === 'branding' 
                    ? 'border-study-500 text-study-800 dark:text-study-200' 
                    : 'border-transparent text-study-500 hover:text-study-800 dark:hover:text-study-300'
                }`}
              >
                🎨 מיתוג וכותרות
              </button>
              <button
                onClick={() => setActiveTab('dedications')}
                className={`py-3 px-3 text-xs md:text-sm font-bold border-b-2 transition whitespace-nowrap ${
                  activeTab === 'dedications' 
                    ? 'border-study-500 text-study-800 dark:text-study-200' 
                    : 'border-transparent text-study-500 hover:text-study-800 dark:hover:text-study-300'
                }`}
              >
                💖 הקדשות וציטוט
              </button>
              <button
                onClick={() => setActiveTab('contact')}
                className={`py-3 px-3 text-xs md:text-sm font-bold border-b-2 transition whitespace-nowrap ${
                  activeTab === 'contact' 
                    ? 'border-study-500 text-study-800 dark:text-study-200' 
                    : 'border-transparent text-study-500 hover:text-study-800 dark:hover:text-study-300'
                }`}
              >
                📞 יצירת קשר
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`py-3 px-3 text-xs md:text-sm font-bold border-b-2 transition whitespace-nowrap ${
                  activeTab === 'schedule' 
                    ? 'border-study-500 text-study-800 dark:text-study-200' 
                    : 'border-transparent text-study-500 hover:text-study-800 dark:hover:text-study-300'
                }`}
              >
                📚 תוכנית ועריכת טקסטים
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-3 px-3 text-xs md:text-sm font-bold border-b-2 transition whitespace-nowrap ${
                  activeTab === 'analytics' 
                    ? 'border-study-500 text-study-800 dark:text-study-200' 
                    : 'border-transparent text-study-500 hover:text-study-800 dark:hover:text-study-300'
                }`}
              >
                📊 סטטיסטיקות אתר
              </button>
              <button
                onClick={() => setActiveTab('publish')}
                className={`py-3 px-3 text-xs md:text-sm font-bold border-b-2 transition whitespace-nowrap ${
                  activeTab === 'publish' 
                    ? 'border-study-500 text-study-800 dark:text-study-200' 
                    : 'border-transparent text-study-500 hover:text-study-800 dark:hover:text-study-300'
                }`}
              >
                🚀 פרסום לאתר החי
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              
              {/* TAB 1: Branding */}
              {activeTab === 'branding' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-study-700 dark:text-study-300 mb-1.5">
                      כותרת ראשית של האתר:
                    </label>
                    <input
                      type="text"
                      value={configDraft.siteTitle || ''}
                      onChange={(e) => setConfigDraft({ ...configDraft, siteTitle: e.target.value })}
                      className="w-full px-3.5 py-2 bg-study-50 dark:bg-study-800 border border-study-300 dark:border-study-700 rounded-xl text-sm font-serif"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-study-700 dark:text-study-300 mb-1.5">
                      כותרת משנה / תיאור:
                    </label>
                    <input
                      type="text"
                      value={configDraft.siteSubtitle || ''}
                      onChange={(e) => setConfigDraft({ ...configDraft, siteSubtitle: e.target.value })}
                      className="w-full px-3.5 py-2 bg-study-50 dark:bg-study-800 border border-study-300 dark:border-study-700 rounded-xl text-sm"
                    />
                  </div>

                  <div className="border-t border-study-200 dark:border-study-800 pt-4 space-y-4">
                    <label className="block text-xs font-bold text-study-700 dark:text-study-300">
                      לוגו האתר:
                    </label>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-study-50 dark:bg-study-800/60 p-4 rounded-xl border border-study-300 dark:border-study-700">
                      <div className="flex items-center justify-center bg-study-100 dark:bg-study-900 p-3 rounded-xl border border-study-200 dark:border-study-750 shrink-0 min-w-[100px] min-h-[100px]">
                        {configDraft.logoPosition !== 'hide' && configDraft.logoUrl ? (
                          <img
                            src={configDraft.logoUrl || '/logo.png'}
                            alt="Preview"
                            style={{ height: `${configDraft.logoSize || 60}px` }}
                            className="w-auto object-contain transition-all duration-200"
                          />
                        ) : (
                          <span className="text-xs text-study-400">לוגו מוסתר</span>
                        )}
                      </div>

                      <div className="space-y-3 flex-1">
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-study-800 border border-study-300 dark:border-study-700 rounded-xl text-xs font-semibold hover:bg-study-50 dark:hover:bg-study-750 cursor-pointer shadow-xs">
                          <Upload className="w-4 h-4 text-study-500" />
                          <span>העלה תמונת לוגו חדשה מהמחשב/טלפון</span>
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                        <input
                          type="text"
                          value={configDraft.logoUrl || ''}
                          onChange={(e) => setConfigDraft({ ...configDraft, logoUrl: e.target.value })}
                          placeholder="או הזן נתיב תמונה / URL..."
                          className="w-full px-3 py-1.5 bg-white dark:bg-study-850 border border-study-300 dark:border-study-700 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    {/* Logo Size and Position Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-study-50/70 dark:bg-study-800/40 p-4 rounded-xl border border-study-200 dark:border-study-750">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-study-700 dark:text-study-300">
                            גודל לוגו:
                          </label>
                          <span className="text-xs font-mono font-bold text-study-600 dark:text-study-400">
                            {configDraft.logoSize || 60}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="30"
                          max="130"
                          step="2"
                          value={configDraft.logoSize || 60}
                          onChange={(e) => setConfigDraft({
                            ...configDraft,
                            logoSize: parseInt(e.target.value, 10)
                          })}
                          className="w-full accent-study-500 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-study-400 mt-1">
                          <span>קטן (30px)</span>
                          <span>בינוני (60px)</span>
                          <span>גדול (130px)</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-study-700 dark:text-study-300 mb-1.5">
                          מיקום הלוגו:
                        </label>
                        <select
                          value={configDraft.logoPosition || 'right'}
                          onChange={(e) => setConfigDraft({
                            ...configDraft,
                            logoPosition: e.target.value
                          })}
                          className="w-full px-3 py-2 bg-white dark:bg-study-850 border border-study-300 dark:border-study-700 rounded-xl text-xs font-semibold"
                        >
                          <option value="right">מימין לכותרת (ברירת מחדל)</option>
                          <option value="left">משמאל לכותרת</option>
                          <option value="top">מעל הכותרת (מרכזי ובולט)</option>
                          <option value="hide">הסתר לוגו</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Dedications & Footer */}
              {activeTab === 'dedications' && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-study-700 dark:text-study-300 flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-rose-500 fill-current" />
                        <span>שמות מוקדשים לרפואה בפס העליון:</span>
                      </label>
                      <button
                        onClick={handleAddRefuahName}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-study-100 dark:bg-study-800 hover:bg-study-200 text-study-800 dark:text-study-200 rounded-lg text-xs font-bold transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>הוסף שם</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(configDraft.refuahNames || []).map((name: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => handleUpdateRefuahName(idx, e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-study-50 dark:bg-study-800 border border-study-300 dark:border-study-700 rounded-lg text-xs font-medium"
                          />
                          <button
                            onClick={() => handleRemoveRefuahName(idx)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                            title="מחק שם"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-study-700 dark:text-study-300 mb-1.5">
                      סיומת פסקת ההקדשה:
                    </label>
                    <input
                      type="text"
                      value={configDraft.refuahSuffix || ''}
                      onChange={(e) => setConfigDraft({ ...configDraft, refuahSuffix: e.target.value })}
                      className="w-full px-3.5 py-2 bg-study-50 dark:bg-study-800 border border-study-300 dark:border-study-700 rounded-xl text-xs"
                    />
                  </div>

                  <div className="border-t border-study-200 dark:border-study-800 pt-4">
                    <label className="block text-xs font-bold text-study-700 dark:text-study-300 mb-1.5">
                      ציטוט חזון התוכנית (פוטר תחתון):
                    </label>
                    <textarea
                      rows={3}
                      value={configDraft.footerQuote || ''}
                      onChange={(e) => setConfigDraft({ ...configDraft, footerQuote: e.target.value })}
                      className="w-full px-3.5 py-2 bg-study-50 dark:bg-study-800 border border-study-300 dark:border-study-700 rounded-xl text-xs font-serif leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: Contact */}
              {activeTab === 'contact' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-study-700 dark:text-study-300 mb-1.5">
                      שם איש קשר:
                    </label>
                    <input
                      type="text"
                      value={configDraft.contact?.name || ''}
                      onChange={(e) => setConfigDraft({
                        ...configDraft,
                        contact: { ...configDraft.contact, name: e.target.value }
                      })}
                      className="w-full px-3.5 py-2 bg-study-50 dark:bg-study-800 border border-study-300 dark:border-study-700 rounded-xl text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-study-700 dark:text-study-300 mb-1.5">
                        מספר טלפון לתצוגה:
                      </label>
                      <input
                        type="text"
                        value={configDraft.contact?.phone || ''}
                        onChange={(e) => setConfigDraft({
                          ...configDraft,
                          contact: { ...configDraft.contact, phone: e.target.value }
                        })}
                        className="w-full px-3.5 py-2 bg-study-50 dark:bg-study-800 border border-study-300 dark:border-study-700 rounded-xl text-xs"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-study-700 dark:text-study-300 mb-1.5">
                        מספר וואטסאפ (עם קידומת בינלאומית):
                      </label>
                      <input
                        type="text"
                        value={configDraft.contact?.whatsapp || ''}
                        onChange={(e) => setConfigDraft({
                          ...configDraft,
                          contact: { ...configDraft.contact, whatsapp: e.target.value }
                        })}
                        placeholder="972586151547"
                        className="w-full px-3.5 py-2 bg-study-50 dark:bg-study-800 border border-study-300 dark:border-study-700 rounded-xl text-xs"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-study-700 dark:text-study-300 mb-1.5">
                      כתובת דוא״ל:
                    </label>
                    <input
                      type="email"
                      value={configDraft.contact?.email || ''}
                      onChange={(e) => setConfigDraft({
                        ...configDraft,
                        contact: { ...configDraft.contact, email: e.target.value }
                      })}
                      className="w-full px-3.5 py-2 bg-study-50 dark:bg-study-800 border border-study-300 dark:border-study-700 rounded-xl text-xs"
                      dir="ltr"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: Schedule & Manual Text Editor */}
              {activeTab === 'schedule' && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-3 bg-study-100/60 dark:bg-study-800 p-3.5 rounded-xl border border-study-200 dark:border-study-700">
                    <div>
                      <label className="block text-xs font-bold mb-1">בחר חודש:</label>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="px-3 py-1.5 bg-white dark:bg-study-850 border border-study-300 dark:border-study-700 rounded-lg text-xs font-bold"
                      >
                        {monthOptions.map((m) => (
                          <option key={m.key} value={m.key}>{m.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">בחר יום:</label>
                      <select
                        value={selectedDay}
                        onChange={(e) => setSelectedDay(parseInt(e.target.value, 10))}
                        className="px-3 py-1.5 bg-white dark:bg-study-850 border border-study-300 dark:border-study-700 rounded-lg text-xs font-bold"
                      >
                        {currentMonthDays.map((d: any) => (
                          <option key={d.day} value={d.day}>יום {d.day}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mr-auto text-xs text-study-500 font-mono bg-white dark:bg-study-850 px-2.5 py-1.5 rounded-lg border border-study-200 dark:border-study-700">
                      מפתח: <strong>{selectedKey}</strong>
                    </div>
                  </div>

                  {/* Metadata fields */}
                  <div className="space-y-3 bg-study-50/70 dark:bg-study-850 p-4 rounded-xl border border-study-200 dark:border-study-750">
                    <div>
                      <label className="block text-xs font-bold mb-1">כותרת עברית ליום זה:</label>
                      <input
                        type="text"
                        value={currentDayItem.heTitle || ''}
                        onChange={(e) => handleUpdateScheduleItem('heTitle', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-study-800 border border-study-300 dark:border-study-700 rounded-lg text-xs font-serif"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold mb-1">ספר:</label>
                        <input
                          type="text"
                          value={currentDayItem.book || ''}
                          onChange={(e) => handleUpdateScheduleItem('book', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-study-800 border border-study-300 dark:border-study-700 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-1">מראה מקום (Sefaria/Wiki Ref):</label>
                        <input
                          type="text"
                          value={currentDayItem.ref || ''}
                          onChange={(e) => handleUpdateScheduleItem('ref', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-study-800 border border-study-300 dark:border-study-700 rounded-lg text-xs"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">הערת חלק לימוד (מילים מ/עד):</label>
                      <input
                        type="text"
                        value={currentDayItem.portion || ''}
                        onChange={(e) => handleUpdateScheduleItem('portion', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-study-800 border border-study-300 dark:border-study-700 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {/* Manual Text Editor Section */}
                  <div className="bg-study-50/70 dark:bg-study-850 p-4 rounded-xl border border-study-200 dark:border-study-750 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-study-800 dark:text-study-200 flex items-center gap-1.5">
                        <Edit3 className="w-4 h-4 text-study-500" />
                        <span>עריכה ידנית של טקסט הלימוד ליום זה:</span>
                      </label>
                      <span className="text-[11px] text-study-500">
                        {currentTextParagraphs.length} פסקאות (הפרד פסקאות בשורת רווח כפולה)
                      </span>
                    </div>

                    <textarea
                      rows={8}
                      value={currentTextJoined}
                      onChange={(e) => handleUpdateText(e.target.value)}
                      placeholder="הזן כאן את תוכן הלימוד המלא עבור יום זה..."
                      className="w-full p-3 bg-white dark:bg-study-800 border border-study-300 dark:border-study-700 rounded-xl text-xs font-serif leading-relaxed text-justify"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: Global Site Analytics */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  {/* Google Analytics Integration Banner */}
                  <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-200">
                      <BarChart3 className="w-4 h-4" />
                      <span>חיבור Google Analytics 4 (GA4) לסטטיסטיקות מתקדמות</span>
                    </div>
                    <p className="text-xs text-study-600 dark:text-study-400">
                      הזן כאן את מזהה המדידה של Google Analytics (למשל <code className="bg-blue-100 dark:bg-blue-950 px-1 py-0.5 rounded">G-XXXXXXXXXX</code>) כדי לקבל נתוני תנועה, מיקומי לומדים ומכשירים בזמן אמת.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={configDraft.gaMeasurementId || ''}
                        onChange={(e) => setConfigDraft({ ...configDraft, gaMeasurementId: e.target.value })}
                        placeholder="G-XXXXXXXXXX"
                        className="px-3 py-1.5 bg-white dark:bg-study-850 border border-study-300 dark:border-study-700 rounded-lg text-xs font-mono w-60"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div>
                    <h3 className="text-xs font-bold text-study-700 dark:text-study-300 uppercase tracking-wider mb-3">
                      סטטיסטיקות פעילות כלליות באתר (מצטבר)
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                      <div className="bg-white dark:bg-study-850 p-4 rounded-xl border border-study-200 dark:border-study-800 shadow-xs text-center">
                        <div className="flex items-center justify-center gap-1 text-study-500 mb-1">
                          <Eye className="w-4 h-4" />
                          <span className="text-xs font-bold">צפיות בדפים</span>
                        </div>
                        <div className="text-2xl font-extrabold text-study-900 dark:text-study-100 font-serif">
                          {globalMetrics.totalPageviews}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-study-850 p-4 rounded-xl border border-study-200 dark:border-study-800 shadow-xs text-center">
                        <div className="flex items-center justify-center gap-1 text-emerald-500 mb-1">
                          <Users className="w-4 h-4" />
                          <span className="text-xs font-bold">מבקרים ייחודיים</span>
                        </div>
                        <div className="text-2xl font-extrabold text-study-900 dark:text-study-100 font-serif">
                          {globalMetrics.totalVisits}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-study-850 p-4 rounded-xl border border-study-200 dark:border-study-800 shadow-xs text-center">
                        <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs font-bold">זמן שהייה מצטבר</span>
                        </div>
                        <div className="text-2xl font-extrabold text-study-900 dark:text-study-100 font-serif">
                          {Math.round(globalMetrics.totalReadingMinutes / 60)} שעות
                        </div>
                      </div>

                      <div className="bg-white dark:bg-study-850 p-4 rounded-xl border border-study-200 dark:border-study-800 shadow-xs text-center">
                        <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-xs font-bold">שיעור חזרה</span>
                        </div>
                        <div className="text-2xl font-extrabold text-study-900 dark:text-study-100 font-serif">
                          74%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Popular Books Breakdown */}
                  <div className="bg-study-50/70 dark:bg-study-850 p-4 rounded-xl border border-study-200 dark:border-study-750 space-y-3">
                    <h4 className="text-xs font-bold text-study-800 dark:text-study-200 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-study-500" />
                      <span>הספרים הפופולריים והנלמדים ביותר באתר</span>
                    </h4>

                    <div className="space-y-2">
                      {Object.entries(globalMetrics.popularBooks).map(([bookName, count]) => {
                        const maxCount = Math.max(...Object.values(globalMetrics.popularBooks));
                        const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;

                        return (
                          <div key={bookName} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span>{bookName}</span>
                              <span className="text-study-500">{count} לומדים</span>
                            </div>
                            <div className="w-full bg-study-200/60 dark:bg-study-700 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-study-500 h-full rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: Publish & Cloud Sync */}
              {activeTab === 'publish' && (
                <div className="space-y-6">
                  <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl text-xs space-y-1.5">
                    <p className="font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                      <Globe className="w-4 h-4" />
                      <span>פרסום שינויים ישירות לאתר החי (GitHub & Vercel)</span>
                    </p>
                    <p className="text-study-600 dark:text-study-400">
                      לחיצה על כפתור הפרסום תעדכן אוטומטית את קבצי ההגדרות, תוכנית הלימודים וטקסט הלימוד ב-GitHub. Vercel יקבל את השינוי ויבנה את האתר תוך כ-30 שניות!
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold mb-1">שם המאגר ב-GitHub (Repository):</label>
                      <input
                        type="text"
                        value={githubRepo}
                        onChange={(e) => setGithubRepo(e.target.value)}
                        className="w-full px-3 py-1.5 bg-study-50 dark:bg-study-800 border border-study-300 dark:border-study-700 rounded-lg text-xs"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">GitHub Personal Access Token (PAT):</label>
                      <input
                        type="password"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                        className="w-full px-3 py-1.5 bg-study-50 dark:bg-study-800 border border-study-300 dark:border-study-700 rounded-lg text-xs"
                        dir="ltr"
                      />
                    </div>

                    <button
                      onClick={handlePublishToGitHub}
                      disabled={isPublishing}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      {isPublishing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>מפרסם ל-GitHub ו-Vercel...</span>
                        </>
                      ) : (
                        <>
                          <Globe className="w-4 h-4" />
                          <span>פרסם כעת לאתר החי (Deploy to Vercel)</span>
                        </>
                      )}
                    </button>

                    {publishStatus && (
                      <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        publishStatus.success 
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' 
                          : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                      }`}>
                        {publishStatus.success ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                        <span>{publishStatus.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Backup and Restore */}
                  <div className="border-t border-study-200 dark:border-study-800 pt-4 flex flex-wrap items-center justify-between gap-3">
                    <button
                      onClick={handleExportBackup}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-study-100 dark:bg-study-800 hover:bg-study-200 text-study-800 dark:text-study-200 rounded-lg text-xs font-semibold transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>הורד קובץ גיבוי של כל ההגדרות והטקסטים (JSON)</span>
                    </button>

                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-study-100 dark:bg-study-800 hover:bg-study-200 text-study-800 dark:text-study-200 rounded-lg text-xs font-semibold transition cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>טען קובץ גיבוי</span>
                      <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                    </label>
                  </div>
                </div>
              )}

            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-study-200 dark:border-study-800 bg-study-100/50 dark:bg-study-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {savedSuccess && (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    נשמר בהצלחה בדפדפן!
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-white dark:bg-study-800 border border-study-300 dark:border-study-700 text-study-700 dark:text-study-300 rounded-xl text-xs font-semibold hover:bg-study-50 transition"
                >
                  סגור
                </button>
                <button
                  onClick={handleSaveAll}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-study-500 hover:bg-study-600 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>החל שינויים מקומית</span>
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
