
'use client';

import { useState } from 'react';
import type { Dispatch, DragEvent, SetStateAction } from 'react';
import TaskCard from './TaskCard';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  project_id: string;
  priority: TaskPriority;
}

interface Project {
  id: string;
  name: string;
}

interface KanbanBoardProps {
  tasks: Task[];
  projects: Project[];
  setTasks: Dispatch<SetStateAction<Task[]>>;
}

const columns: {
  status: TaskStatus;
  title: string;
  color: string;
}[] = [
  {
    status: 'TODO',
    title: 'To Do',
    color: 'text-amber-400',
  },
  {
    status: 'IN_PROGRESS',
    title: 'In Progress',
    color: 'text-blue-400',
  },
  {
    status: 'DONE',
    title: 'Completed',
    color: 'text-emerald-400',
  },
];

export default function KanbanBoard({
  tasks,
  projects,
  setTasks,
}: KanbanBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [recentlyMovedTaskId, setRecentlyMovedTaskId] = useState<string | null>(null);

  // Identify the dragged task
  function handleDragStart(
    event: DragEvent<HTMLDivElement>,
    taskId: string
  ) {
    setDraggedTaskId(taskId);
    event.dataTransfer.setData('text/plain', taskId);
    event.dataTransfer.effectAllowed = 'move';
  }

  // Allow dropping tasks into columns
  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  // Update task status when dropped
  function handleDrop(
    event: DragEvent<HTMLDivElement>,
    newStatus: TaskStatus
  ) {
    event.preventDefault();

    const taskId =
      draggedTaskId || event.dataTransfer.getData('text/plain');

    if (!taskId) return;

    const task = tasks.find((item) => item.id === taskId);

    if (!task || task.status === newStatus) {
      setDraggedTaskId(null);
      return;
    }

    setTasks((previousTasks) =>
      previousTasks.map((item) =>
        item.id === taskId
          ? { ...item, status: newStatus }
          : item
      )
    );

    setRecentlyMovedTaskId(taskId);
    setDraggedTaskId(null);

    window.setTimeout(() => {
      setRecentlyMovedTaskId((currentId) =>
        currentId === taskId ? null : currentId
      );
    }, 500);
  }

  // Find project name using project_id
  function getProjectName(projectId: string) {
    return projects.find((project) => project.id === projectId)?.name
      ?? 'Unknown project';
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

      {columns.map((column) => {
        const columnTasks = tasks.filter(
          (task) => task.status === column.status
        );

        return (
          <div
            key={column.status}
            onDragOver={handleDragOver}
            onDrop={(event) => handleDrop(event, column.status)}
            className="min-h-64 bg-slate-900/80 border border-slate-800 rounded-xl p-4 transition-colors hover:border-purple-500/40"
          >

            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
              <h3 className={`font-semibold text-sm ${column.color}`}>
                {column.title} ({columnTasks.length})
              </h3>
            </div>

            <div className="space-y-3 min-h-40">

              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(event) =>
                    handleDragStart(event, task.id)
                  }
                  onDragEnd={() => setDraggedTaskId(null)}
                  className={`cursor-grab active:cursor-grabbing transition-all duration-300 ${
                    draggedTaskId === task.id
                      ? 'opacity-40 scale-95'
                      : ''
                  } ${
                    recentlyMovedTaskId === task.id
                      ? 'animate-pulse'
                      : ''
                  }`}
                >
                  <TaskCard
                    title={task.title}
                    project={getProjectName(task.project_id)}
                    priority={task.priority}
                    status={task.status}
                  />
                </div>
              ))}

              {columnTasks.length === 0 && (
                <p className="text-xs text-slate-600 text-center py-8 border border-dashed border-slate-800 rounded-lg">
                  Drop tasks here
                </p>
              )}

            </div>
          </div>
        );
      })}

    </div>
  );
}
