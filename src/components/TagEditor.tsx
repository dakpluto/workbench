import { useState } from "react";
import { normalizeTag } from "../model/artifact";

export function TagEditor({
  tags,
  suggestions,
  onChange,
}: {
  tags: string[];
  suggestions: string[];
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const parts = raw.split(/[,\s]+/).map(normalizeTag).filter(Boolean);
    const next = [...new Set([...tags, ...parts])];
    if (next.length !== tags.length) onChange(next);
    setDraft("");
  }

  return (
    <div className="tag-editor">
      {tags.map((t) => (
        <span key={t} className="tag tag-editable">
          #{t}
          <button aria-label={`Remove tag ${t}`} onClick={() => onChange(tags.filter((x) => x !== t))}>
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        list="tag-suggestions"
        placeholder={tags.length ? "+ tag" : "+ add a tag"}
        aria-label="Add tag"
        onChange={(e) => {
          const v = e.target.value;
          if (/[,\s]$/.test(v)) add(v);
          else setDraft(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && tags.length) {
            onChange(tags.slice(0, -1));
          }
        }}
        onBlur={() => draft && add(draft)}
      />
      <datalist id="tag-suggestions">
        {suggestions
          .filter((s) => !tags.includes(s))
          .map((s) => (
            <option key={s} value={s} />
          ))}
      </datalist>
    </div>
  );
}
