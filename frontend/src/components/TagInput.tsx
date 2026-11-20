import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Type a skill and press Enter or comma to add it as a chip. Backspace removes the last one.
export function TagInput({
  id,
  value,
  onChange,
  placeholder = "Type and press Enter",
  invalid,
}: {
  id?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  invalid?: boolean;
}) {
  const [draft, setDraft] = React.useState("");

  const add = (raw: string) => {
    const tags = raw
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const next = [...new Set([...value, ...tags])].slice(0, 50);
    onChange(next);
    setDraft("");
  };

  return (
    <div
      className={cn(
        "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 shadow-sm transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10",
        invalid && "border-red-400",
      )}
    >
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-indigo-50 py-0.5 pl-2 pr-1 text-xs font-medium text-indigo-700">
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            className="rounded p-0.5 hover:bg-indigo-100 cursor-pointer"
            aria-label={`Remove ${tag}`}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === ",") && draft.trim()) {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => draft.trim() && add(draft)}
        placeholder={value.length ? "" : placeholder}
        className="min-w-32 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-slate-400"
      />
    </div>
  );
}
