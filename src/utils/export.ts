import { useStore } from '../store';

export const getProjectFileName = (extension: string): string => {
  const state = useStore.getState();
  const safeClientName = state.clientName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_') || 'Client';
  const safeProjectName = state.projectName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_') || 'Project';
  const safeVersion = state.projectVersion.replace(/[^a-zA-Z0-9\u4e00-\u9fa5.-]/g, '_') || 'v0';
  return `${safeClientName}_${safeProjectName}_${safeVersion}.${extension}`;
};

export const exportProjectData = async (): Promise<boolean> => {
  const state = useStore.getState();
  const projectData = {
    clientName: state.clientName,
    projectName: state.projectName,
    projectVersion: state.projectVersion,
    tasks: state.tasks.map(t => ({
      ...t,
      ColorCode: state.groups.find(g => g.id === t.groupId)?.color || '#94a3b8'
    })),
    groups: state.groups,
    versions: state.versions,
    viewMode: state.viewMode,
    zoomLevel: state.zoomLevel
  };

  const fileName = getProjectFileName('gantt');

  // Try to use File System Access API (showSaveFilePicker)
  // Skip if in an iframe as it's restricted in cross-origin subframes
  const isIframe = window.self !== window.top;
  if ('showSaveFilePicker' in window && !isIframe) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [{
          description: 'Gantt Project File',
          accept: { 'application/json': ['.gantt', '.json'] },
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(projectData, null, 2));
      await writable.close();
      return true;
    } catch (err: any) {
      // If user cancels, just return false
      if (err.name === 'AbortError' || err.name === 'SecurityError') return false;
      // Fall back silently to traditional download method
    }
  }

  // Fallback to traditional download method
  const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
};
