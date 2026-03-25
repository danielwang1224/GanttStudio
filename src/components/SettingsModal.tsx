import React, { useState } from 'react';
import { useStore } from '../store';
import { translations } from '../i18n';
import { X, Plus, Trash2 } from 'lucide-react';

const PRESET_COLORS = [
  '#f4a7b9', // Sakura (Cherry Blossom)
  '#e16b8c', // Momo (Peach)
  '#d71345', // Kurenai (Crimson)
  '#f8b500', // Yamabuki (Golden Yellow)
  '#f7d94c', // Nanohana (Rapeseed)
  '#a8c97f', // Moegi (Yellow Green)
  '#7b8d42', // Matcha (Green Tea)
  '#33a6b8', // Asagi (Pale Blue-Green)
  '#59b9c6', // Shinbashi (Vibrant Blue)
  '#274a78', // Ai (Indigo)
  '#9b90c4', // Fuji (Wisteria)
  '#8a8c60', // Rikyucha (Brownish Green)
  '#d3cbc6', // Shiracha (Light Beige)
  '#595857', // Sumi (Ink Black)
];

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
    dateFormat,
    setDateFormat,
    weekNumbering,
    setWeekNumbering,
    sidebarWidth,
    setSidebarWidth,
    groups,
    addGroup,
    updateGroup,
    deleteGroup,
    updateGroupColor
  } = useStore();

  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#3b82f6');

  if (!isSettingsModalOpen) return null;

  const t = translations[language];

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    
    addGroup({
      id: `g${Date.now()}`,
      name: newGroupName.trim(),
      color: newGroupColor
    });
    
    setNewGroupName('');
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
          </section>

          {/* Group Settings */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-2">
              {t.groupColors}
            </h3>
            
            <div className="space-y-3">
              {groups.map(group => (
                <div key={group.id} className="flex flex-col gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={group.color}
                      onChange={(e) => updateGroupColor(group.id, e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0 shrink-0"
                    />
                    <input
                      type="text"
                      value={group.name}
                      onChange={(e) => updateGroup(group.id, { name: e.target.value })}
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-700 px-2"
                    />
                    <button
                      onClick={() => deleteGroup(group.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title={t.delete}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pl-11">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => updateGroupColor(group.id, c)}
                        className={`w-4 h-4 rounded-full border ${group.color.toLowerCase() === c.toLowerCase() ? 'border-slate-800 scale-110 shadow-sm' : 'border-black/10 hover:scale-110'} transition-all`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 mt-4">
              <form onSubmit={handleAddGroup} className="flex items-center gap-3">
                <input
                  type="color"
                  value={newGroupColor}
                  onChange={(e) => setNewGroupColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0 shrink-0"
                />
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder={t.addGroup}
                  className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
                <button
                  type="submit"
                  disabled={!newGroupName.trim()}
                  className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus size={20} />
                </button>
              </form>
              <div className="flex flex-wrap items-center gap-1.5 pl-11">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewGroupColor(c)}
                    className={`w-4 h-4 rounded-full border ${newGroupColor.toLowerCase() === c.toLowerCase() ? 'border-slate-800 scale-110 shadow-sm' : 'border-black/10 hover:scale-110'} transition-all`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
