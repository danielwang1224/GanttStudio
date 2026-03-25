import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { X, Trash2, RotateCcw, Save, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { translations } from '../i18n';
import { exportProjectData } from '../utils/export';

export const VersionModal = () => {
  const { 
    isVersionModalOpen, 
    closeVersionModal, 
    versions, 
    saveVersion, 
    restoreVersion, 
    deleteVersion,
    clientName,
    projectName,
    projectVersion,
    setProjectInfo,
    language,
    resetProject
  } = useStore();
  
  const t = translations[language];

  const [localClientName, setLocalClientName] = useState(clientName);
  const [localProjectName, setLocalProjectName] = useState(projectName);
  const [newVersionDescription, setNewVersionDescription] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ type: 'restore' | 'delete' | 'newProject', id?: string } | null>(null);

  useEffect(() => {
    if (isVersionModalOpen) {
      setLocalClientName(clientName);
      setLocalProjectName(projectName);
      if (versions.length === 0 && !newVersionDescription) {
        setNewVersionDescription(t.initialRelease);
      }
    }
  }, [isVersionModalOpen, clientName, projectName, versions.length, t.initialRelease]);

  if (!isVersionModalOpen) return null;

  const handleSaveInfo = () => {
    setProjectInfo(localClientName, localProjectName, projectVersion);
  };

  const handleSaveVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionDescription.trim()) return;
    saveVersion(newVersionDescription.trim());
    setNewVersionDescription('');
  };

  const handleRestore = (id: string) => {
    setConfirmAction({ type: 'restore', id });
  };

  const handleDelete = (id: string) => {
    setConfirmAction({ type: 'delete', id });
  };

  const executeConfirmAction = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'restore' && confirmAction.id) {
      restoreVersion(confirmAction.id);
      closeVersionModal();
    } else if (confirmAction.type === 'delete' && confirmAction.id) {
      deleteVersion(confirmAction.id);
    } else if (confirmAction.type === 'newProject') {
      resetProject();
      closeVersionModal();
    }
    setConfirmAction(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {confirmAction.type === 'restore' ? 'Restore Version' : confirmAction.type === 'delete' ? 'Delete Version' : t.newProject}
            </h3>
            <p className="text-slate-600 mb-6">
              {confirmAction.type === 'restore' 
                ? 'Are you sure you want to restore this version? Current unsaved changes will be lost.' 
                : confirmAction.type === 'delete'
                ? 'Are you sure you want to delete this version? This action cannot be undone.'
                : t.newProjectConfirm}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={executeConfirmAction}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">{t.projectSettings}</h2>
          <button onClick={closeVersionModal} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 border-b border-slate-100 bg-white space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">{t.settings}</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.clientName}</label>
              <input
                type="text"
                value={localClientName}
                onChange={(e) => setLocalClientName(e.target.value)}
                onBlur={handleSaveInfo}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.projectName}</label>
              <input
                type="text"
                value={localProjectName}
                onChange={(e) => setLocalProjectName(e.target.value)}
                onBlur={handleSaveInfo}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.currentVersion}</label>
            <div className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-600 font-mono">
              {projectVersion}
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">{t.versionHistory}</h3>
          <form onSubmit={handleSaveVersion} className="flex gap-2">
            <input
              type="text"
              value={newVersionDescription}
              onChange={(e) => setNewVersionDescription(e.target.value)}
              placeholder={t.modificationPlaceholder}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!newVersionDescription.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <Save size={16} />
              {t.saveVersion}
            </button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {versions.length === 0 ? (
            <div className="text-center text-slate-500 py-8">{t.noVersions}</div>
          ) : (
            <div className="space-y-3">
              {versions.map(version => (
                <div key={version.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors bg-white">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-sm">
                        {version.version || version.name}
                      </span>
                      <span className="font-medium text-slate-800">{version.description || ''}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{format(version.timestamp, 'PP pp')}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRestore(version.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title={t.restoreVersion}
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(version.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title={t.deleteVersion}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
