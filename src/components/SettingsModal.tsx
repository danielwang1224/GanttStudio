import React, { useState } from 'react';
import { useStore, useGlobalStore, PRESET_COLORS } from '../store';
import { translations } from '../i18n';
import { X, Plus, Trash2 } from 'lucide-react';

export const SettingsModal = () => {
  const { 
    isSettingsModalOpen, 
    closeSettingsModal, 
    language, 
    setLanguage, 
    showVerticalLines, 
    setShowVerticalLines,
    showTodayHighlight,
    setShowTodayHighlight,
    showDependencies,
    setShowDependencies,
    dateFormat,
    setDateFormat,
    weekNumbering,
    setWeekNumbering,
    sidebarWidth,
    setSidebarWidth,
  } = useStore();

  const { customColors, addCustomColor, removeCustomColor } = useGlobalStore();

  const [newColorHex, setNewColorHex] = useState('#3b82f6');

  if (!isSettingsModalOpen) return null;

  const t = translations[language];

  const handleAddColor = (e: React.FormEvent) => {
    e.preventDefault();
    if (/^#[0-9A-F]{6}$/i.test(newColorHex)) {
      addCustomColor(newColorHex.toLowerCase());
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">
            {t.settings}
          </h2>
          <button 
            onClick={closeSettingsModal}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          {/* General Settings */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                {t.language}
              </label>
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    language === 'en' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage('zh')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    language === 'zh' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  中文
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                {t.sidebarWidth}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="200"
                  max="600"
                  step="10"
                  value={sidebarWidth}
                  onChange={(e) => setSidebarWidth(parseInt(e.target.value))}
                  className="w-32 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-sm font-mono text-slate-600 w-12 text-right">
                  {sidebarWidth}px
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700">
                  {t.dateFormat}
                </label>
                <span className="text-xs text-slate-500 mt-1">{t.dateFormatHint}</span>
              </div>
              <input
                type="text"
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 w-32 text-right"
                placeholder="d-MMM"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                {t.weekNumbering}
              </label>
              <select
                value={weekNumbering}
                onChange={(e) => setWeekNumbering(e.target.value as 'project' | 'calendar')}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 max-w-[200px]"
              >
                <option value="project">{t.weekNumberingProject}</option>
                <option value="calendar">{t.weekNumberingCalendar}</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                {t.showVerticalLines}
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={showVerticalLines}
                  onChange={(e) => setShowVerticalLines(e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                {t.showTodayHighlight}
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={showTodayHighlight}
                  onChange={(e) => setShowTodayHighlight(e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                {t.showDependencies}
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={showDependencies}
                  onChange={(e) => setShowDependencies(e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </section>

          {/* Color Settings */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-2">
              {t.groupColors || 'Colors'}
            </h3>
            
            <div className="space-y-4">
              {/* Preset Colors */}
              <div>
                <h4 className="text-xs font-medium text-slate-500 mb-2">
                  {language === 'zh' ? '預設顏色' : 'Preset Colors'}
                </h4>
                <div className="grid grid-cols-10 gap-1.5 p-2 bg-slate-50 rounded-lg border border-slate-100 w-fit">
                  {PRESET_COLORS.map(color => (
                    <div 
                      key={color}
                      className="w-6 h-6 rounded-full border border-slate-200 shadow-sm"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Custom Colors */}
              <div>
                <h4 className="text-xs font-medium text-slate-500 mb-2">
                  {language === 'zh' ? '自訂顏色' : 'Custom Colors'}
                </h4>
                <div className="flex flex-col gap-2 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                  <form onSubmit={handleAddColor} className="flex items-center gap-3">
                    <input
                      type="color"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0 shrink-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      placeholder="#000000"
                      className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white uppercase font-mono"
                      pattern="^#[0-9a-fA-F]{6}$"
                    />
                    <button
                      type="submit"
                      className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </form>
                </div>

                {customColors.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2 mt-2">
                    {customColors.map(color => (
                      <div key={color} className="relative group">
                        <div 
                          className="w-8 h-8 rounded-full border border-slate-200 shadow-sm"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                        <button
                          onClick={() => removeCustomColor(color)}
                          className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
