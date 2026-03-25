import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { translations } from '../i18n';
import { X } from 'lucide-react';

export const ProjectInfoModal = () => {
  const { 
    isProjectInfoModalOpen, 
    closeProjectInfoModal, 
    clientName, 
    projectName, 
    projectVersion,
    setProjectInfo,
    language 
  } = useStore();

  const t = translations[language];

  const [localClientName, setLocalClientName] = useState(clientName);
  const [localProjectName, setLocalProjectName] = useState(projectName);

  useEffect(() => {
    if (isProjectInfoModalOpen) {
      setLocalClientName(clientName === 'New Client' ? '' : clientName);
      setLocalProjectName(projectName === 'New Project' ? '' : projectName);
    }
  }, [isProjectInfoModalOpen, clientName, projectName]);

  if (!isProjectInfoModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProjectInfo(
      localClientName.trim() || 'New Client', 
      localProjectName.trim() || 'New Project', 
      projectVersion
    );
    closeProjectInfoModal();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">{t.newProject}</h2>
          <button onClick={closeProjectInfoModal} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.clientName}</label>
            <input
              type="text"
              value={localClientName}
              onChange={(e) => setLocalClientName(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.projectName}</label>
            <input
              type="text"
              value={localProjectName}
              onChange={(e) => setLocalProjectName(e.target.value)}
              placeholder="e.g. Website Redesign"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={closeProjectInfoModal}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
              {t.confirm}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
