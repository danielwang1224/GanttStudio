import React from 'react';
import { useStore } from '../store';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Pencil, Trash2, Diamond } from 'lucide-react';
import { startOfDay, addDays } from 'date-fns';

import { Task, Group } from '../store';
import { translations } from '../i18n';

const SortableTaskItem = ({ task, group }: { key?: React.Key, task: Task, group?: Group }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const { openTaskModal, language, setRowHeight } = useStore();
  const t = translations[language];
  const itemRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!itemRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setRowHeight(task.id, (entry.target as HTMLElement).offsetHeight);
      }
    });
    observer.observe(itemRef.current);
    return () => observer.disconnect();
  }, [task.id, setRowHeight]);

  const setRefs = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    itemRef.current = node;
  };

  const accentColor = group?.color || '#cbd5e1';

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    backgroundColor: accentColor,
    color: '#000000',
  };

  return (
    <div
      ref={setRefs}
      style={style}
      className={`flex items-center p-3 border-b border-black/5 group hover:brightness-95 transition-all ${isDragging ? 'shadow-lg ring-2 ring-blue-500 ring-opacity-50' : ''} min-h-[48px]`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mr-2 text-black/40 hover:text-black/60 flex-shrink-0">
        <GripVertical size={16} />
      </div>
      <div 
        className="flex-1 font-bold text-sm cursor-pointer flex items-center justify-end text-right pr-1 gap-1" 
        title="Double click to edit"
        onDoubleClick={() => openTaskModal(task.id)}
      >
        {task.isMilestone && <Diamond size={12} className="text-black/60 fill-black/60 flex-shrink-0 mt-0.5" />}
        <span className="whitespace-normal break-words leading-tight">{task.name}</span>
      </div>
    </div>
  );
};

export const Sidebar = ({ scrollRef, onScroll }: { scrollRef: React.RefObject<HTMLDivElement | null>, onScroll: (e: React.UIEvent<HTMLDivElement>) => void }) => {
  const { tasks, groups, reorderTasks, openTaskModal, language, sidebarWidth } = useStore();
  const t = translations[language];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderTasks(active.id as string, over.id as string);
    }
  };

  return (
    <div 
      className="flex-shrink-0 border-r border-slate-200 bg-white flex flex-col h-full"
      style={{ width: sidebarWidth }}
    >
      <div className="h-14 border-b border-slate-200 flex items-center justify-between px-6 font-bold text-slate-800 bg-white shadow-sm z-10 relative">
        <span className="text-base tracking-tight">Action Items</span>
        <button
          onClick={() => openTaskModal()}
          className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-blue-600 transition-all"
          title={t.addTask}
        >
          <Plus size={20} />
        </button>
      </div>
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden"
        ref={scrollRef}
        onScroll={onScroll}
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col">
              {tasks.map(task => (
                <SortableTaskItem key={task.id} task={task} group={groups.find(g => g.id === task.groupId)} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};
