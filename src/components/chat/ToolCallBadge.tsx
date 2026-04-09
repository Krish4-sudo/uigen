"use client";

import { Loader2, FilePlus, FilePen, Eye, Trash2, FolderInput } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ToolCallBadgeProps {
  toolName: string;
  args: Record<string, unknown>;
  state: string;
}

function getDisplay(
  toolName: string,
  args: Record<string, unknown>
): { Icon: LucideIcon; label: string } {
  const path = typeof args.path === "string" ? args.path : "";
  const filename = path.split("/").filter(Boolean).pop() || path || toolName;

  if (toolName === "str_replace_editor") {
    switch (args.command) {
      case "create":
        return { Icon: FilePlus, label: `Creating ${filename}` };
      case "str_replace":
      case "insert":
        return { Icon: FilePen, label: `Editing ${filename}` };
      case "view":
        return { Icon: Eye, label: `Reading ${filename}` };
      default:
        return { Icon: FilePen, label: `Editing ${filename}` };
    }
  }

  if (toolName === "file_manager") {
    switch (args.command) {
      case "delete":
        return { Icon: Trash2, label: `Deleting ${filename}` };
      case "rename": {
        const newPath = typeof args.new_path === "string" ? args.new_path : "";
        const newFilename = newPath.split("/").filter(Boolean).pop() || newPath;
        return { Icon: FolderInput, label: `Renaming ${filename} → ${newFilename}` };
      }
    }
  }

  return { Icon: FilePen, label: toolName };
}

export function ToolCallBadge({ toolName, args, state }: ToolCallBadgeProps) {
  const { Icon, label } = getDisplay(toolName, args);
  const done = state === "result";

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {done ? (
        <Icon className="w-3 h-3 text-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
