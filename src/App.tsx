/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { GanttChart } from './components/GanttChart';
import { Toolbar } from './components/Toolbar';
import { TaskModal } from './components/TaskModal';
import { VersionModal } from './components/VersionModal';
import { SettingsModal } from './components/SettingsModal';
import { ProjectInfoModal } from './components/ProjectInfoModal';
import { useStore } from './store';

export default function App() {
  const svgRef = useRef<SVGSVGElement>(null);
  const sidebarScrollRef = useRef<HTMLDivElement>(null);
  const ganttScrollRef = useRef<HTMLDivElement>(null);
  const { 
    undo, redo, 
    tasks, clientName, projectName, projectVersion, versions, viewMode, zoomLevel,
    language, showVerticalLines, showTodayHighlight, dateFormat, weekNumbering
  } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handleSidebarScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (ganttScrollRef.current) {
      ganttScrollRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleGanttScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (sidebarScrollRef.current) {
      sidebarScrollRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden font-sans text-slate-900">
      <Toolbar svgRef={svgRef} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar scrollRef={sidebarScrollRef} onScroll={handleSidebarScroll} />
        <GanttChart ref={svgRef} scrollRef={ganttScrollRef} onScroll={handleGanttScroll} />
      </div>
      <TaskModal />
      <VersionModal />
      <SettingsModal />
      <ProjectInfoModal />
    </div>
  );
}
