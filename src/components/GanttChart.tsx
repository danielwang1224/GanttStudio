import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import { translations } from '../i18n';
import { differenceInDays, addDays, format, startOfWeek, endOfWeek, isSameDay, startOfMonth, endOfMonth, addMonths } from 'date-fns';

const HEADER_HEIGHT = 56; // 14 * 4 = 56px to match Sidebar h-14

interface GanttChartProps {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

export const GanttChart = React.forwardRef<SVGSVGElement, GanttChartProps>(({ scrollRef, onScroll }, ref) => {
  const { 
    tasks, 
    groups, 
    viewMode, 
    zoomLevel, 
    setZoomLevel, 
    chartStartDate, 
    chartEndDate, 
    updateTaskDates,
    commitTaskDates,
    showVerticalLines,
    showTodayHighlight,
    language,
    dateFormat,
    weekNumbering,
    rowHeights
  } = useStore();
  
  const t = translations[language];

  const baseDayWidth = viewMode === 'daily' ? 24 : 7;
  const DAY_WIDTH = baseDayWidth * (zoomLevel / 100);
  
  let effectiveChartStartDate = chartStartDate;
  let effectiveChartEndDate = chartEndDate;
  
  if (viewMode === 'daily') {
    const lastMonthStart = startOfMonth(chartEndDate);
    const visibleLastMonthStart = chartStartDate > lastMonthStart ? chartStartDate : lastMonthStart;
    const daysInLastMonth = differenceInDays(chartEndDate, visibleLastMonthStart) + 1;
    const lastMonthWidth = daysInLastMonth * DAY_WIDTH;
    const requiredWidth = 80; // approx width for "MMM yyyy"
    if (lastMonthWidth < requiredWidth) {
      const extraDaysNeeded = Math.ceil((requiredWidth - lastMonthWidth) / DAY_WIDTH);
      effectiveChartEndDate = addDays(chartEndDate, extraDaysNeeded);
    }

    const firstMonthEnd = endOfMonth(chartStartDate);
    const visibleFirstMonthEnd = chartEndDate < firstMonthEnd ? chartEndDate : firstMonthEnd;
    const daysInFirstMonth = differenceInDays(visibleFirstMonthEnd, chartStartDate) + 1;
    const firstMonthWidth = daysInFirstMonth * DAY_WIDTH;
    if (firstMonthWidth < requiredWidth) {
      const extraDaysNeeded = Math.ceil((requiredWidth - firstMonthWidth) / DAY_WIDTH);
      effectiveChartStartDate = addDays(chartStartDate, -extraDaysNeeded);
    }
  } else {
    const lastYearStart = new Date(chartEndDate.getFullYear(), 0, 1);
    const visibleLastYearStart = chartStartDate > lastYearStart ? chartStartDate : lastYearStart;
    const daysInLastYear = differenceInDays(chartEndDate, visibleLastYearStart) + 1;
    const lastYearWidth = daysInLastYear * DAY_WIDTH;
    const requiredWidth = 60; // approx width for "yyyy"
    if (lastYearWidth < requiredWidth) {
      const extraDaysNeeded = Math.ceil((requiredWidth - lastYearWidth) / DAY_WIDTH);
      const extraWeeksNeeded = Math.ceil(extraDaysNeeded / 7);
      effectiveChartEndDate = addDays(chartEndDate, extraWeeksNeeded * 7);
    }

    const firstYearEnd = new Date(chartStartDate.getFullYear(), 11, 31);
    const visibleFirstYearEnd = chartEndDate < firstYearEnd ? chartEndDate : firstYearEnd;
    const daysInFirstYear = differenceInDays(visibleFirstYearEnd, chartStartDate) + 1;
    const firstYearWidth = daysInFirstYear * DAY_WIDTH;
    if (firstYearWidth < requiredWidth) {
      const extraDaysNeeded = Math.ceil((requiredWidth - firstYearWidth) / DAY_WIDTH);
      const extraWeeksNeeded = Math.ceil(extraDaysNeeded / 7);
      effectiveChartStartDate = addDays(chartStartDate, -extraWeeksNeeded * 7);
    }
  }

  const totalDays = differenceInDays(effectiveChartEndDate, effectiveChartStartDate) + 1;
  const chartWidth = totalDays * DAY_WIDTH;
  
  // Calculate dynamic positions
  const taskPositions = useMemo(() => {
    let currentY = 0;
    return tasks.map(task => {
      const height = rowHeights[task.id] || 48; // fallback min-height
      const y = currentY;
      currentY += height;
      return { ...task, y, height };
    });
  }, [tasks, rowHeights]);

  const chartHeight = taskPositions.length > 0 
    ? taskPositions[taskPositions.length - 1].y + taskPositions[taskPositions.length - 1].height 
    : 0;

  // Generate date headers
  const days = useMemo(() => {
    const arr = [];
    for (let i = 0; i < totalDays; i++) {
      arr.push(addDays(effectiveChartStartDate, i));
    }
    return arr;
  }, [effectiveChartStartDate, totalDays]);

  const weeks = useMemo(() => {
    const arr = [];
    let currentWeekStart = startOfWeek(effectiveChartStartDate, { weekStartsOn: 1 });
    while (currentWeekStart <= effectiveChartEndDate) {
      arr.push(currentWeekStart);
      currentWeekStart = addDays(currentWeekStart, 7);
    }
    return arr;
  }, [effectiveChartStartDate, effectiveChartEndDate]);

  const months = useMemo(() => {
    const arr = [];
    let currentMonthStart = startOfMonth(effectiveChartStartDate);
    while (currentMonthStart <= effectiveChartEndDate) {
      arr.push(currentMonthStart);
      currentMonthStart = addMonths(currentMonthStart, 1);
    }
    return arr;
  }, [effectiveChartStartDate, effectiveChartEndDate]);

  // Dragging state
  const [draggingTask, setDraggingTask] = useState<{ id: string, type: 'move' | 'resize-left' | 'resize-right', startX: number, initialStart: Date, initialEnd: Date } | null>(null);

  const handlePointerDown = (e: React.PointerEvent, taskId: string, type: 'move' | 'resize-left' | 'resize-right') => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    setDraggingTask({
      id: taskId,
      type,
      startX: e.clientX,
      initialStart: task.startDate,
      initialEnd: task.endDate
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingTask) return;
    
    const deltaX = e.clientX - draggingTask.startX;
    const deltaDays = Math.round(deltaX / DAY_WIDTH);
    
    if (deltaDays === 0) return;

    let newStart = draggingTask.initialStart;
    let newEnd = draggingTask.initialEnd;

    if (draggingTask.type === 'move') {
      newStart = addDays(draggingTask.initialStart, deltaDays);
      newEnd = addDays(draggingTask.initialEnd, deltaDays);
    } else if (draggingTask.type === 'resize-left') {
      newStart = addDays(draggingTask.initialStart, deltaDays);
      if (newStart > newEnd) newStart = newEnd; // Prevent negative duration
    } else if (draggingTask.type === 'resize-right') {
      newEnd = addDays(draggingTask.initialEnd, deltaDays);
      if (newEnd < newStart) newEnd = newStart; // Prevent negative duration
    }

    updateTaskDates(draggingTask.id, newStart, newEnd);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingTask) {
      (e.target as Element).releasePointerCapture(e.pointerId);
      
      const task = tasks.find(t => t.id === draggingTask.id);
      if (task && (task.startDate.getTime() !== draggingTask.initialStart.getTime() || task.endDate.getTime() !== draggingTask.initialEnd.getTime())) {
        commitTaskDates(draggingTask.id, draggingTask.initialStart, draggingTask.initialEnd, task.startDate, task.endDate);
      }
      
      setDraggingTask(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -10 : 10;
      setZoomLevel(zoomLevel + delta);
    }
  };

  return (
    <div 
      className="flex-1 overflow-auto bg-white relative"
      ref={scrollRef}
      onScroll={onScroll}
      onWheel={handleWheel}
    >
      <svg 
        ref={ref}
        width={chartWidth} 
        height={HEADER_HEIGHT + chartHeight} 
        className="min-w-full select-none"
        fontFamily='"Montserrat", "Noto Sans TC", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif'
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <defs>
          <pattern id="grid-pattern" width={viewMode === 'daily' ? DAY_WIDTH : DAY_WIDTH * 7} height={chartHeight || 100} patternUnits="userSpaceOnUse">
            <rect width={viewMode === 'daily' ? DAY_WIDTH : DAY_WIDTH * 7} height={chartHeight || 100} fill="none" stroke="#e2e8f0" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Background Grid */}
        <g transform={`translate(0, ${HEADER_HEIGHT})`}>
          {showVerticalLines && (
            <rect width={chartWidth} height={chartHeight} fill="url(#grid-pattern)" />
          )}
          {/* Row dividers */}
          {taskPositions.map((task) => (
            <line key={`row-${task.id}`} x1={0} y1={task.y} x2={chartWidth} y2={task.y} stroke="#e2e8f0" strokeWidth="1" />
          ))}
          <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#e2e8f0" strokeWidth="1" />
          {/* Today highlight */}
          {showTodayHighlight && days.map((day, i) => {
            if (isSameDay(day, new Date())) {
              return <rect key={`today-${i}`} x={i * DAY_WIDTH} y={0} width={DAY_WIDTH} height={chartHeight} fill="#fef08a" fillOpacity="0.3" />;
            }
            return null;
          })}
        </g>

        {/* Header */}
        <g className="header">
          <rect width={chartWidth} height={HEADER_HEIGHT} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
          
          {viewMode === 'daily' ? (
            <>
              {/* Month/Year Top Bar */}
              {months.map((monthStart, i) => {
                const rawX = differenceInDays(monthStart, effectiveChartStartDate) * DAY_WIDTH;
                const x = Math.max(0, rawX);
                const nextMonthStart = months[i + 1];
                const nextX = nextMonthStart ? differenceInDays(nextMonthStart, effectiveChartStartDate) * DAY_WIDTH : chartWidth;
                const monthWidth = nextX - x;
                const textX = x + monthWidth / 2;
                return (
                  <g key={`month-${i}`}>
                    <line x1={x} y1={0} x2={x} y2={HEADER_HEIGHT / 2} stroke="#cbd5e1" strokeWidth="1" />
                    <text x={textX} y={20} fontSize="12" fill="#64748b" fontWeight="600" textAnchor="middle">
                      {format(monthStart, 'MMM yyyy')}
                    </text>
                  </g>
                );
              })}
              <line x1={0} y1={HEADER_HEIGHT / 2} x2={chartWidth} y2={HEADER_HEIGHT / 2} stroke="#e2e8f0" strokeWidth="1" />
              {/* Daily Bottom Bar */}
              {days.map((day, i) => (
                <g key={`day-${i}`}>
                  <line x1={i * DAY_WIDTH} y1={HEADER_HEIGHT / 2} x2={i * DAY_WIDTH} y2={HEADER_HEIGHT} stroke="#e2e8f0" strokeWidth="1" />
                  <text x={i * DAY_WIDTH + DAY_WIDTH / 2} y={HEADER_HEIGHT - 8} fontSize="11" fill="#94a3b8" textAnchor="middle">
                    {format(day, 'd')}
                  </text>
                </g>
              ))}
            </>
          ) : (
            <>
              {/* Weekly View Header */}
              {/* Top Bar: Year */}
              {weeks.map((weekStart, i) => {
                const isFirstWeekOfYear = i === 0 || weekStart.getFullYear() !== weeks[i - 1].getFullYear();
                if (!isFirstWeekOfYear) return null;

                const rawX = differenceInDays(weekStart, effectiveChartStartDate) * DAY_WIDTH;
                const x = Math.max(0, rawX);
                
                let nextX = chartWidth;
                for (let j = i + 1; j < weeks.length; j++) {
                  if (weeks[j].getFullYear() !== weekStart.getFullYear()) {
                    nextX = differenceInDays(weeks[j], effectiveChartStartDate) * DAY_WIDTH;
                    break;
                  }
                }
                
                const yearWidth = nextX - x;
                const textX = x + yearWidth / 2;
                
                return (
                  <g key={`week-top-${i}`}>
                    <line x1={x} y1={0} x2={x} y2={HEADER_HEIGHT / 2} stroke="#cbd5e1" strokeWidth="1" />
                    <text x={textX} y={20} fontSize="12" fill="#64748b" fontWeight="600" textAnchor="middle">
                      {format(weekStart, 'yyyy')}
                    </text>
                  </g>
                );
              })}
              <line x1={0} y1={HEADER_HEIGHT / 2} x2={chartWidth} y2={HEADER_HEIGHT / 2} stroke="#e2e8f0" strokeWidth="1" />
              
              {/* Bottom Bar: Week Numbers */}
              {weeks.map((weekStart, i) => {
                const x = differenceInDays(weekStart, effectiveChartStartDate) * DAY_WIDTH;
                const weekWidth = 7 * DAY_WIDTH;
                
                let weekLabel = '';
                if (weekNumbering === 'calendar') {
                  weekLabel = `W${format(weekStart, 'w')}`;
                } else {
                  // Project week numbering
                  if (tasks.length === 0) {
                    weekLabel = `W${i + 1}`;
                  } else {
                    const earliestTaskStart = tasks.reduce((min, t) => t.startDate < min ? t.startDate : min, tasks[0].startDate);
                    const earliestWeekStart = startOfWeek(earliestTaskStart, { weekStartsOn: 1 });
                    const weekDiff = Math.floor(differenceInDays(weekStart, earliestWeekStart) / 7);
                    
                    if (weekDiff < 0) {
                      weekLabel = `W0`; // Or negative if needed, but W0 is requested
                    } else {
                      weekLabel = `W${weekDiff + 1}`;
                    }
                  }
                }

                return (
                  <g key={`week-bottom-${i}`}>
                    <line x1={x} y1={HEADER_HEIGHT / 2} x2={x} y2={HEADER_HEIGHT} stroke="#e2e8f0" strokeWidth="1" />
                    <text x={x + weekWidth / 2} y={HEADER_HEIGHT / 2 + 12} fontSize="11" fill="#64748b" fontWeight="600" textAnchor="middle">
                      {weekLabel}
                    </text>
                    <text x={x + weekWidth / 2} y={HEADER_HEIGHT - 4} fontSize="9" fill="#94a3b8" textAnchor="middle">
                      {format(weekStart, 'MM/dd')}
                    </text>
                  </g>
                );
              })}
            </>
          )}
        </g>

        {/* Tasks */}
        <g transform={`translate(0, ${HEADER_HEIGHT})`}>
          {taskPositions.map((task) => {
            const startOffset = differenceInDays(task.startDate, effectiveChartStartDate);
            const duration = differenceInDays(task.endDate, task.startDate) + 1;
            
            const x = startOffset * DAY_WIDTH;
            const y = task.y + (task.height - 24) / 2; // Center vertically, 24px height
            const width = duration * DAY_WIDTH;
            const group = groups.find(g => g.id === task.groupId);
            const accentColor = group?.color || '#94a3b8';
            const barBgColor = group ? group.color : '#e2e8f0';
            const barBgOpacity = group ? 0.2 : 1;
            const progressWidth = width * ((task.progress || 0) / 100);
            
            const durationText = viewMode === 'daily' ? `${duration}D` : `${Math.ceil(duration / 7)}W`;

            const isDraggingThis = draggingTask?.id === task.id;

            const safeFormat = (date: Date, formatStr: string) => {
              try {
                return format(date, formatStr || 'd-MMM');
              } catch (e) {
                return format(date, 'yyyy-MM-dd');
              }
            };

            return (
              <g key={task.id} transform={`translate(${x}, ${y})`} className="group">
                {/* Visual Labels (Start/End Dates) */}
                <text 
                  x={task.isMilestone ? -12 : -8} 
                  y={16} 
                  fontSize="10" 
                  fill="#64748b" 
                  textAnchor="end"
                  className="select-none"
                >
                  {safeFormat(task.startDate, dateFormat)}
                </text>
                {!task.isMilestone && (
                  <text 
                    x={width + 8} 
                    y={16} 
                    fontSize="10" 
                    fill="#64748b" 
                    textAnchor="start"
                    className="select-none"
                  >
                    {safeFormat(task.endDate, dateFormat)}
                  </text>
                )}

                {task.isMilestone ? (
                  <g className="cursor-move" onPointerDown={(e) => handlePointerDown(e, task.id, 'move')} transform="translate(-12, 0)">
                    <polygon
                      points="12,0 24,12 12,24 0,12"
                      fill={accentColor}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  </g>
                ) : (
                  <>
                    {/* Main Task Bar Background */}
                    <rect 
                      width={Math.max(width, DAY_WIDTH)} 
                      height={24} 
                      rx={4} 
                      fill={barBgColor} 
                      fillOpacity={barBgOpacity}
                      className="cursor-move"
                      onPointerDown={(e) => handlePointerDown(e, task.id, 'move')}
                    />
                    
                    {/* Progress Bar */}
                    {(task.progress || 0) > 0 && (
                      <rect 
                        width={Math.max(progressWidth, (task.progress || 0) > 0 ? 4 : 0)} 
                        height={24} 
                        rx={4} 
                        fill={accentColor} 
                        fillOpacity={isDraggingThis ? 0.8 : 1}
                        className="cursor-move pointer-events-none"
                      />
                    )}

                    {/* Border to make it look sharp */}
                    <rect 
                      width={Math.max(width, DAY_WIDTH)} 
                      height={24} 
                      rx={4} 
                      fill="none"
                      stroke={accentColor}
                      strokeWidth="1"
                      className="pointer-events-none"
                    />

                    {/* Duration Text */}
                    <text
                      x={Math.max(width, DAY_WIDTH) / 2}
                      y={16}
                      fontSize="11"
                      fontWeight="600"
                      fill="#1e293b"
                      textAnchor="middle"
                      className="select-none pointer-events-none"
                    >
                      {durationText}
                    </text>
                    
                    {/* Resize Handles */}
                    <rect 
                      x={0} 
                      y={0} 
                      width={8} 
                      height={24} 
                      fill="#ffffff" 
                      fillOpacity={0}
                      className="cursor-ew-resize"
                      onPointerDown={(e) => handlePointerDown(e, task.id, 'resize-left')}
                    />
                    <rect 
                      x={Math.max(width, DAY_WIDTH) - 8} 
                      y={0} 
                      width={8} 
                      height={24} 
                      fill="#ffffff" 
                      fillOpacity={0}
                      className="cursor-ew-resize"
                      onPointerDown={(e) => handlePointerDown(e, task.id, 'resize-right')}
                    />
                  </>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
});
