import React, { useState, useEffect } from 'react';
import { useStore, useGlobalStore, PRESET_COLORS, Task } from '../store';
import { translations } from '../i18n';
import { format, startOfDay, addDays } from 'date-fns';
import { X, Trash2, ChevronDown } from 'lucide-react';

export const TaskModal = () => {
  const { 
    isTaskModalOpen, 
    editingTaskId, 
    closeTaskModal, 
    tasks, 
    addTask, 
    updateTask, 
    deleteTask,
    language
  } = useStore();

  const { customColors } = useGlobalStore();

  const t = translations[language];

  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [progress, setProgress] = useState(0);
  const [isMilestone, setIsMilestone] = useState(false);
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);

  useEffect(() => {
    if (isTaskModalOpen) {
      if (editingTaskId) {
        const task = tasks.find(t => t.id === editingTaskId);
        if (task) {
          setName(task.name);
          setColor(task.color || PRESET_COLORS[0]);
          setStartDate(format(task.startDate, 'yyyy-MM-dd'));
          setEndDate(format(task.endDate, 'yyyy-MM-dd'));
          setProgress(task.progress || 0);
          setIsMilestone(task.isMilestone || false);
        }
      } else {
        const today = startOfDay(new Date());
        setName('');
        setColor(PRESET_COLORS[0]);
        setStartDate(format(today, 'yyyy-MM-dd'));
        setEndDate(format(addDays(today, 3), 'yyyy-MM-dd'));
        setProgress(0);
        setIsMilestone(false);
      }
    }
  }, [isTaskModalOpen, editingTaskId, tasks]);

  if (!isTaskModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !color || !startDate || (!isMilestone && !endDate)) {
      alert('Please fill in all fields');
      return;
    }

    const start = new Date(startDate + 'T00:00:00');
    const end = isMilestone ? start : new Date(endDate + 'T00:00:00');

    if (end < start) {
      alert('End date cannot be before start date');
      return;
    }

    if (editingTaskId) {
      updateTask(editingTaskId, {
        name: name.trim(),
        color,
        startDate: start,
        endDate: isMilestone ? start : end,
        progress,
        isMilestone,
      });
    } else {
      addTask({
        name: name.trim(),
        color,
        startDate: start,
        endDate: isMilestone ? start : end,
        progress,
        isMilestone,
      });
    }
    
    closeTaskModal();
  };

  const handleDelete = () => {
    if (editingTaskId && confirm('Are you sure you want to delete this task?')) {
      deleteTask(editingTaskId);
      closeTaskModal();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">
            {editingTaskId ? t.editTask : t.newTask}
          </h2>
          <button 
            onClick={closeTaskModal}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.taskName}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Design Homepage"
              autoFocus
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.groupColors || 'Color'}
            </label>
            <button
              type="button"
              onClick={() => setIsColorDropdownOpen(!isColorDropdownOpen)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between bg-white"
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: color }} />
                <span className="text-sm font-mono uppercase">{color}</span>
              </div>
              <ChevronDown size={16} className="text-slate-400" />
            </button>
            
            {isColorDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsColorDropdownOpen(false)} 
                />
                <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto p-3">
                  <div className="space-y-3">
                    <div className="grid grid-cols-10 gap-1.5">
                      {PRESET_COLORS.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setColor(c);
                            setIsColorDropdownOpen(false);
                          }}
                          className={`w-6 h-6 rounded-full border ${color.toLowerCase() === c.toLowerCase() ? 'border-slate-800 scale-110 shadow-sm' : 'border-black/10 hover:scale-110'} transition-all`}
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
                    
                    {customColors.length > 0 && (
                      <>
                        <div className="h-px bg-slate-100 w-full" />
                        <div className="flex flex-wrap gap-1.5">
                          {customColors.map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                setColor(c);
                                setIsColorDropdownOpen(false);
                              }}
                              className={`w-6 h-6 rounded-full border ${color.toLowerCase() === c.toLowerCase() ? 'border-slate-800 scale-110 shadow-sm' : 'border-black/10 hover:scale-110'} transition-all`}
                              style={{ backgroundColor: c }}
                              title={c}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="isMilestone"
              checked={isMilestone}
              onChange={(e) => setIsMilestone(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="isMilestone" className="text-sm font-medium text-slate-700">
              {language === 'zh' ? '設為里程碑 (Milestone)' : 'Set as Milestone'}
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {isMilestone ? (language === 'zh' ? '日期' : 'Date') : t.startDate}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {!isMilestone && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t.endDate}
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex justify-between">
              <span>{t.progress}</span>
              <span className="text-blue-600 font-medium">{progress}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-100 mt-6">
            {editingTaskId ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
                {t.delete}
              </button>
            ) : (
              <div /> // Spacer
            )}
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeTaskModal}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
              >
                {editingTaskId ? t.saveChanges : t.addTask}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
