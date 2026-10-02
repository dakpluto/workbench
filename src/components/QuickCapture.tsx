import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createArtifact } from "../store/artifacts";
import { KNOWN_TYPES, catalogNumber, type Artifact } from "../model/artifact";

/**
 * Parse a capture line: an optional "type:" prefix and inline #tags.
 *   "idea: rivers as roads #cities"  →  idea, "rivers as roads", [cities]
 */
export function parseCapture(raw: string, fallbackType?: string) {
  let text = raw.trim();
  let type = fallbackType;
  const prefix = /^([a-z]+):\s*/i.exec(text);
  if (prefix && KNOWN_TYPES.some((t) => t.key === prefix[1].toLowerCase())) {
    type = prefix[1].toLowerCase();
    text = text.slice(prefix[0].length);
  }
  const tags: string[] = [];
  text = text.replace(/(^|\s)#([\w-]+)/g, (_, space, tag) => {
    tags.push(tag);
    return space;
  });
  const title = text.replace(/\s+/g, " ").trim();
  return { title: title.charAt(0).toUpperCase() + title.slice(1), type, tags };
}

export function QuickCapture({ type, placeholder }: { type?: string; placeholder?: string }) {
  const [value, setValue] = useState("");
  const [last, setLast] = useState<Artifact | null>(null);
  const navigate = useNavigate();

  async function submit(open: boolean) {
    const parsed = parseCapture(value, type);
    if (!parsed.title) return;
    const a = await createArtifact({ title: parsed.title, type: parsed.type, tags: parsed.tags });
    setValue("");
    if (open) navigate(`/a/${a.id}`);
    else setLast(a);
  }

  return (
    <div className="capture">
      <form
        className="capture-field"
        onSubmit={(e) => {
          e.preventDefault();
          submit(false);
        }}
      >
        <span className="capture-glyph" aria-hidden>
          +
        </span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit(true);
            }
          }}
          placeholder={placeholder ?? "Put something on the bench…"}
          aria-label="Capture a new artifact"
          data-capture
        />
        <button type="submit" className="btn btn-quiet" disabled={!value.trim()}>
          Add
        </button>
      </form>
      <p className="capture-hint">
        {last ? (
          <>
            Added <Link to={`/a/${last.id}`}>{catalogNumber(last)} {last.title}</Link>
          </>
        ) : (
          <>
            <kbd>Enter</kbd> adds it, <kbd>Ctrl</kbd>+<kbd>Enter</kbd> adds and opens. Try <code>idea: …</code> or{" "}
            <code>#tag</code>.
          </>
        )}
      </p>
    </div>
  );
}
