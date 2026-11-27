
'use client';

import { useState, useRef } from 'react';
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
  created_at?: string;
  updated_at?: string;
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

  // Track the latest request for each task.
  const requestVersions = useRef(new Map<string, number>());

  // Keep the original task state for rollback.
  const rollbackCache = useRef(new Map<string, Task>());

  function handleDragStart(
    event: DragEvent<HTMLDivElement>,
    taskId: string
  ) {
    setDraggedTaskId(taskId);
    event.dataTransfer.setData('text/plain', taskId);
    event.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  async function handleDrop(
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

    // Save the state before moving the card.
    const previousTask = { ...task };

    // Assign a new request version.
    const requestVersion =
      (requestVersions.current.get(taskId) ?? 0) + 1;

    requestVersions.current.set(taskId, requestVersion);

    rollbackCache.current.set(taskId, previousTask);

    // OPTIMISTIC UPDATE:
    // Move the card immediately without waiting for the API.
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

    // Skip temporary tasks that don't exist in the database.
    if (!task.created_at) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/tasks/${taskId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      const updatedTask: Task = await response.json();

      // Ignore responses belonging to older drag requests.
      if (
        requestVersions.current.get(taskId) !== requestVersion
      ) {
        console.log('Ignoring outdated task response:', taskId);
        return;
      }

      const updatedAt = updatedTask.updated_at;

      if (typeof updatedAt !== 'string') {
         throw new Error('Missing or invalid updated_at in API response');
      }

      // Compare the server timestamp with the latest active state.
      setTasks((previousTasks) =>
        previousTasks.map((item) => {
          if (item.id !== taskId) return item;

          if (
            item.updated_at &&
            new Date(updatedAt).getTime() <
            new Date(item.updated_at).getTime()
          ) {
            console.log('Ignoring stale timestamp:', taskId);
            return item;
          }

          return { ...item, ...updatedTask };
        })
      );

      rollbackCache.current.delete(taskId);

    } catch (error) {
      console.error('Task update failed:', error);

      // Rollback only if no newer drag has happened.
      if (
        requestVersions.current.get(taskId) === requestVersion
      ) {
        const cachedTask = rollbackCache.current.get(taskId);

        if (cachedTask) {
          setTasks((previousTasks) =>
            previousTasks.map((item) =>
              item.id === taskId ? cachedTask : item
            )
          );
        }

        rollbackCache.current.delete(taskId);
      }
    }
  }

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
