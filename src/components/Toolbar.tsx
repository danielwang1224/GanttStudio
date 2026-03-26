import React, { useRef, useState, useEffect } from 'react';
import { useStore } from '../store';
import { translations } from '../i18n';
import { Settings, CalendarDays, CalendarRange, ZoomIn, ZoomOut, FolderOpen, Save, Undo, Redo, FileText, Image, Printer, ChevronDown, File } from 'lucide-react';
import { format } from 'date-fns';
import { exportProjectData, getProjectFileName } from '../utils/export';

export const Toolbar = ({ svgRef }: { svgRef: React.RefObject<SVGSVGElement | null> }) => {
  const { viewMode, setViewMode, zoomLevel, setZoomLevel, importProject, openVersionModal, language, openSettingsModal, undo, redo, past, future } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [showNewProjectConfirm, setShowNewProjectConfirm] = useState(false);
  
  const t = translations[language];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isFileMenuOpen) {
        setIsFileMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isFileMenuOpen]);

  const getExportSVG = () => {
    if (!svgRef.current) return null;
    const clonedSvg = svgRef.current.cloneNode(true) as SVGSVGElement;
    
    const storeState = useStore.getState();
    const SIDEBAR_WIDTH = storeState.sidebarWidth;
    const currentWidth = parseInt(clonedSvg.getAttribute('width') || '0');
    const currentHeight = parseInt(clonedSvg.getAttribute('height') || '0');
    
    clonedSvg.setAttribute('width', (currentWidth + SIDEBAR_WIDTH).toString());
    
    const chartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    chartGroup.setAttribute('transform', `translate(${SIDEBAR_WIDTH}, 0)`);
    
    while (clonedSvg.firstChild) {
      chartGroup.appendChild(clonedSvg.firstChild);
    }
    clonedSvg.appendChild(chartGroup);
    
    const sidebarGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', SIDEBAR_WIDTH.toString());
    bg.setAttribute('height', currentHeight.toString());
    bg.setAttribute('fill', '#f8fafc');
    sidebarGroup.appendChild(bg);
    
    const headerBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    headerBg.setAttribute('width', SIDEBAR_WIDTH.toString());
    headerBg.setAttribute('height', '56');
    headerBg.setAttribute('fill', '#ffffff');
    headerBg.setAttribute('stroke', '#e2e8f0');
    headerBg.setAttribute('stroke-width', '1');
    sidebarGroup.appendChild(headerBg);
    
    const headerText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    headerText.setAttribute('x', (SIDEBAR_WIDTH / 2).toString());
    headerText.setAttribute('y', '33');
    headerText.setAttribute('text-anchor', 'middle');
    headerText.setAttribute('font-size', '14');
    headerText.setAttribute('font-weight', '600');
    headerText.setAttribute('fill', '#1e293b');
    const FONT_FAMILY = '"Montserrat", "Noto Sans TC", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif';
    
    headerText.setAttribute('font-family', FONT_FAMILY);
    headerText.textContent = t.tasks;
    sidebarGroup.appendChild(headerText);
    
    const HEADER_HEIGHT = 56;
    
    const rowHeights = storeState.rowHeights;
    let currentY = 0;
    const taskPositions = storeState.tasks.map(task => {
      const height = rowHeights[task.id] || 48;
      const y = currentY;
      currentY += height;
      return { ...task, y, height };
    });
    
    taskPositions.forEach((task) => {
      const rowBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rowBg.setAttribute('x', '0');
      rowBg.setAttribute('y', (HEADER_HEIGHT + task.y).toString());
      rowBg.setAttribute('width', SIDEBAR_WIDTH.toString());
      rowBg.setAttribute('height', task.height.toString());
      rowBg.setAttribute('fill', task.color || '#cbd5e1');
      rowBg.setAttribute('stroke', '#f1f5f9');
      rowBg.setAttribute('stroke-width', '1');
      sidebarGroup.appendChild(rowBg);
      
      // Task name text
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('text-anchor', 'end');
      text.setAttribute('font-size', '14');
      text.setAttribute('font-weight', 'bold');
      text.setAttribute('fill', '#000000');
      text.setAttribute('font-family', FONT_FAMILY);
      
      // Handle long text by wrapping into tspans
      const getVisualLength = (str: string) => {
        let len = 0;
        for (let j = 0; j < str.length; j++) {
          len += str.charCodeAt(j) > 255 ? 2 : 1;
        }
        return len;
      };

      const maxVisualLength = Math.floor((SIDEBAR_WIDTH - 40) / 8); 
      let lines: string[] = [];
      let currentLine = '';
      let currentVisLen = 0;

      for (let j = 0; j < task.name.length; j++) {
        const char = task.name[j];
        const charVisLen = char.charCodeAt(0) > 255 ? 2 : 1;
        
        if (currentVisLen + charVisLen > maxVisualLength && currentLine.length > 0) {
          if (char !== ' ' && task.name[j+1] !== ' ' && charVisLen === 1) {
             const lastSpace = currentLine.lastIndexOf(' ');
             if (lastSpace > 0) {
               lines.push(currentLine.substring(0, lastSpace).trim());
               const remainder = currentLine.substring(lastSpace + 1);
               currentLine = remainder + char;
               currentVisLen = getVisualLength(currentLine);
               continue;
             }
          }
          lines.push(currentLine.trim());
          currentLine = char;
          currentVisLen = charVisLen;
        } else {
          currentLine += char;
          currentVisLen += charVisLen;
        }
      }
      if (currentLine) {
        lines.push(currentLine.trim());
      }

      // Limit lines based on available height
      const lineHeight = 18;
      const maxLines = Math.floor(task.height / lineHeight);
      if (lines.length > maxLines) {
        lines = lines.slice(0, maxLines);
        lines[maxLines - 1] = lines[maxLines - 1] + '...';
      }

      const startY = (HEADER_HEIGHT + task.y + task.height / 2) - ((lines.length - 1) * lineHeight) / 2 + 4;

      lines.forEach((line, lineIndex) => {
        const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan.setAttribute('x', (SIDEBAR_WIDTH - 16).toString());
        tspan.setAttribute('y', (startY + lineIndex * lineHeight).toString());
        tspan.textContent = line;
        text.appendChild(tspan);
      });
      
      sidebarGroup.appendChild(text);
    });
    
    clonedSvg.appendChild(sidebarGroup);
    return clonedSvg;
  };

  const handleExportSVG = () => {
    const svg = getExportSVG();
    if (!svg) return;

    // Embed font styles
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700&display=swap');
      svg {
        font-family: "Montserrat", "Noto Sans TC", ui-sans-serif, system-ui, sans-serif;
      }
    `;
    svg.insertBefore(style, svg.firstChild);

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = getProjectFileName('svg');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const svgElement = getExportSVG();
    if (!svgElement) return;

    // Use the main window for printing because iframes might block print()
    const printContainer = document.createElement('div');
    printContainer.id = 'print-container';
    printContainer.style.position = 'fixed';
    printContainer.style.top = '0';
    printContainer.style.left = '0';
    printContainer.style.width = '100vw';
    printContainer.style.height = '100vh';
    printContainer.style.backgroundColor = 'white';
    printContainer.style.zIndex = '999999';
    printContainer.style.display = 'flex';
    printContainer.style.justifyContent = 'center';
    printContainer.style.alignItems = 'center';

    svgElement.style.width = '100%';
    svgElement.style.height = '100%';
    svgElement.style.maxWidth = '100%';
    svgElement.style.maxHeight = '100%';

    printContainer.appendChild(svgElement);
    document.body.appendChild(printContainer);

    const style = document.createElement('style');
    style.id = 'print-style';
    style.textContent = `
      @media print {
        body > *:not(#print-container) {
          display: none !important;
        }
        #print-container {
          position: static !important;
          display: block !important;
          width: 100% !important;
          height: 100% !important;
        }
        @page {
          size: landscape;
          margin: 0;
        }
      }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
      try {
        const result = window.print();
        // If window.print() is completely blocked by iframe sandbox, it might just silently fail
      } catch (err) {
        console.error('Print failed:', err);
        alert('列印功能被瀏覽器阻擋，請嘗試「在新分頁開啟」應用程式後再試一次。');
      } finally {
        // Clean up after print dialog is closed
        document.body.removeChild(printContainer);
        document.head.removeChild(style);
      }
    }, 100);
  };

  const handleExportProject = async () => {
    await exportProjectData();
  };

  const handleNewProject = async () => {
    const storeState = useStore.getState();
    const isInitial = storeState.past.length === 0 && storeState.versions.length === 0 && storeState.clientName === 'Client A' && storeState.projectName === 'New Project';
    
    if (isInitial) {
      storeState.resetProject();
      storeState.openProjectInfoModal();
    } else {
      setShowNewProjectConfirm(true);
    }
  };

  const executeNewProject = async (saveFirst: boolean) => {
    setShowNewProjectConfirm(false);
    if (saveFirst) {
      const saved = await exportProjectData();
      if (!saved) return; // User cancelled save dialog
    }
    const storeState = useStore.getState();
    storeState.resetProject();
    storeState.openProjectInfoModal();
  };

  const [showOpenFileConfirm, setShowOpenFileConfirm] = useState(false);

  const handleOpenFileClick = () => {
    const storeState = useStore.getState();
    const isInitial = storeState.past.length === 0 && storeState.versions.length === 0 && storeState.clientName === 'Client A' && storeState.projectName === 'New Project';
    
    if (isInitial) {
      fileInputRef.current?.click();
    } else {
      setShowOpenFileConfirm(true);
    }
  };

  const executeOpenFile = async (saveFirst: boolean) => {
    setShowOpenFileConfirm(false);
    if (saveFirst) {
      const saved = await exportProjectData();
      if (!saved) return; // User cancelled save dialog
    }
    fileInputRef.current?.click();
  };

  const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.tasks) {
          const parsedTasks = data.tasks.map((t: any) => ({
            ...t,
            startDate: new Date(t.startDate),
            endDate: new Date(t.endDate)
          }));
          importProject({ ...data, tasks: parsedTasks });
        } else if (data.Tasks && Array.isArray(data.Tasks)) {
          const parsedTasks = data.Tasks.map((t: any) => {
            return {
              id: t.Id || Math.random().toString(36).substring(2, 9),
              name: t.Name,
              color: t.ColorCode || '#94a3b8',
              startDate: new Date(t.StartDate),
              endDate: new Date(t.EndDate),
              progress: t.Progress || 0
            };
          });

          importProject({
            clientName: 'Imported Client',
            projectName: 'Imported Project',
            projectVersion: 'v0',
            tasks: parsedTasks,
            viewMode: 'weekly',
            zoomLevel: 100
          });
        } else {
          setErrorMessage('Invalid project file format.');
        }
      } catch (err) {
        setErrorMessage('Failed to parse project file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 shadow-sm z-20 relative">
      {/* Error Modal */}
      {errorMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-red-600 mb-2">Error</h3>
            <p className="text-slate-600 mb-6">{errorMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setErrorMessage(null)}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors shadow-sm"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Project Confirm Modal */}
      {showNewProjectConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">{t.newProject}</h3>
            <p className="text-slate-600 mb-6">{t.saveBeforeClose}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNewProjectConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => executeNewProject(false)}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                {t.dontSave}
              </button>
              <button
                onClick={() => executeNewProject(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open File Confirm Modal */}
      {showOpenFileConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">{t.openFile}</h3>
            <p className="text-slate-600 mb-6">{t.saveBeforeClose}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowOpenFileConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => executeOpenFile(false)}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                {t.dontSave}
              </button>
              <button
                onClick={() => executeOpenFile(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Logo & Title Section */}
        <div className="flex items-center gap-3 pr-4 border-r border-slate-100">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-100">
            <CalendarDays className="text-white" size={20} />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-slate-900 leading-none tracking-tight">Visual</h1>
            <p className="text-[10px] font-semibold text-slate-400 leading-none mt-1 uppercase tracking-wider">Scheduler</p>
          </div>
        </div>

        {/* File Menu Dropdown */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFileMenuOpen(!isFileMenuOpen);
            }}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
          >
            <File size={16} className="text-slate-400" />
            <span>{t.file}</span>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${isFileMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isFileMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <button
                onClick={() => {
                  handleNewProject();
                  setIsFileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <FileText size={16} className="text-slate-400" />
                {t.newProject}
              </button>
              <button
                onClick={() => {
                  handleOpenFileClick();
                  setIsFileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <FolderOpen size={16} className="text-slate-400" />
                {t.openFile}
              </button>
              <button
                onClick={() => {
                  handleExportProject();
                  setIsFileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Save size={16} className="text-slate-400" />
                {t.saveFile}
              </button>
              <div className="h-px bg-slate-100 my-1 mx-2" />
              <button
                onClick={() => {
                  handleExportSVG();
                  setIsFileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Image size={16} className="text-slate-400" />
                {t.exportSvg}
              </button>
              <button
                onClick={() => {
                  handleExportPDF();
                  setIsFileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Printer size={16} className="text-slate-400" />
                {t.exportPdf}
              </button>
            </div>
          )}
          <input
            type="file"
            accept=".gantt,.json"
            ref={fileInputRef}
            onChange={handleImportProject}
            className="hidden"
          />
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* View Mode & Zoom Group */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
          <div className="flex bg-white rounded-lg shadow-sm border border-slate-200 p-0.5">
            <button
              onClick={() => setViewMode('daily')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                viewMode === 'daily'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <CalendarDays size={14} />
              <span className="hidden md:inline">{t.daily}</span>
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                viewMode === 'weekly'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <CalendarRange size={14} />
              <span className="hidden md:inline">{t.weekly}</span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          <div className="flex items-center gap-0.5 px-1">
            <button
              onClick={() => setZoomLevel(Math.max(10, zoomLevel - 10))}
              className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-sm rounded-lg transition-all"
              title={t.zoomOut}
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-[11px] font-bold text-slate-600 min-w-[44px] text-center tabular-nums">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel(zoomLevel + 10)}
              className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-sm rounded-lg transition-all"
              title={t.zoomIn}
            >
              <ZoomIn size={16} />
            </button>
          </div>
        </div>

        {/* History Group */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
          <button
            onClick={undo}
            disabled={past.length === 0}
            className={`p-1.5 rounded-lg transition-all ${
              past.length === 0 
                ? 'text-slate-200 cursor-not-allowed' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-sm'
            }`}
            title="Undo"
          >
            <Undo size={18} />
          </button>
          <button
            onClick={redo}
            disabled={future.length === 0}
            className={`p-1.5 rounded-lg transition-all ${
              future.length === 0 
                ? 'text-slate-200 cursor-not-allowed' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-sm'
            }`}
            title="Redo"
          >
            <Redo size={18} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 ml-4">
        {/* Status & Settings Group */}
        <div className="flex items-center gap-3">
          {lastSaved && (
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                {t.autoSaved} {format(lastSaved, 'HH:mm:ss')}
              </span>
            </div>
          )}

          <button
            onClick={openVersionModal}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            title={t.projectSettings}
          >
            <FileText size={18} className="text-slate-400" />
            <span className="hidden xl:inline">{t.projectSettings}</span>
          </button>

          <div className="h-6 w-px bg-slate-200" />

          <button
            onClick={openSettingsModal}
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            title={t.settings}
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
