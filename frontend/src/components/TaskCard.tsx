
interface TaskCardProps {
  title: string;
  project: string;
  priority: string;
  status: string;
}

export default function TaskCard({
  title,
  project,
  priority,
  status,
}: TaskCardProps) {
  const priorityStyles: Record<string, string> = {
    HIGH: "bg-red-500/20 text-red-400 border-red-500/30",
    MEDIUM: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    LOW: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };

  const statusStyles: Record<string, string> = {
    TODO: "",
    IN_PROGRESS: "border-l-4 border-l-emerald-500",
    DONE: "opacity-80",
  };

  return (
    <div
      className={`bg-slate-950 border border-slate-800 p-3 rounded-lg text-sm text-slate-200 ${
        statusStyles[status] ?? ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={`font-medium ${
            status === "DONE" ? "line-through text-slate-400" : ""
          }`}
        >
          {title}
        </p>

        <span
          className={`shrink-0 text-xs px-2 py-1 rounded-md border ${
            priorityStyles[priority] ?? priorityStyles.MEDIUM
          }`}
        >
          {priority}
        </span>
      </div>

      <span className="text-xs text-slate-500 mt-2 block">
        {project}
      </span>
    </div>
  );
}
