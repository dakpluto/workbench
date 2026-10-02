import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  deleteArtifact,
  markViewed,
  setArchived,
  updateArtifact,
  useArtifact,
  useArtifacts,
  type ArtifactPatch,
} from "../store/artifacts";
import { KNOWN_TYPES, STATUSES, catalogNumber, typeInfo, type Artifact } from "../model/artifact";
import { ago, stamp } from "../lib/time";
import { StatusDot } from "../components/Marks";
import { TagEditor } from "../components/TagEditor";
import { Connections } from "../components/Connections";

export function ArtifactPage() {
  const { id } = useParams();
  const artifact = useArtifact(id);

  if (artifact === undefined) return null;
  if (artifact === null) {
    return (
      <div className="page">
        <p className="section-empty">
          This artifact isn't here any more. <Link to="/">Back to the bench</Link>
        </p>
      </div>
    );
  }
  // Keyed so drafts reset when navigating between artifacts.
  return <Editor key={artifact.id} artifact={artifact} />;
}

type TextField = "title" | "summary" | "body";

/** Text edits are kept locally and saved after a short pause. */
function useDraft(artifact: Artifact) {
  const [draft, setDraft] = useState(() => ({ title: artifact.title, summary: artifact.summary, body: artifact.body }));
  const [state, setState] = useState<"saved" | "pending">("saved");
  const pending = useRef<Partial<Record<TextField, string>>>({});
  const timer = useRef<number>(undefined);

  function flush() {
    window.clearTimeout(timer.current);
    const patch = pending.current;
    pending.current = {};
    if (Object.keys(patch).length) updateArtifact(artifact.id, patch).then(() => setState("saved"));
  }

  function set(field: TextField, value: string) {
    setDraft((d) => ({ ...d, [field]: value }));
    pending.current[field] = field === "title" ? value.trim() || "Untitled thing" : value;
    setState("pending");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, 500);
  }

  // Save whatever is pending when leaving the page.
  useEffect(() => flush, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { draft, set, state, flush };
}

function Editor({ artifact: a }: { artifact: Artifact }) {
  const navigate = useNavigate();
  const all = useArtifacts();
  const { draft, set, state, flush } = useDraft(a);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [customType, setCustomType] = useState(false);

  useEffect(() => {
    markViewed(a.id);
  }, [a.id]);

  const tagSuggestions = useMemo(() => [...new Set((all ?? []).flatMap((x) => x.tags))].sort(), [all]);
  const typeOptions = useMemo(() => {
    const custom = new Set((all ?? []).map((x) => x.type).filter((t) => !KNOWN_TYPES.some((k) => k.key === t)));
    return [...KNOWN_TYPES.map((t) => t.key), ...custom];
  }, [all]);

  const save = (patch: ArtifactPatch) => updateArtifact(a.id, patch);

  return (
    <div className="page artifact" data-status={a.status}>
      <div className="artifact-bar">
        <button className="link-btn" onClick={() => (history.length > 1 ? navigate(-1) : navigate("/"))}>
          ← Back
        </button>
        <span className="catalog">{catalogNumber(a)}</span>
        <span className="save-state" data-state={state} aria-live="polite">
          {state === "pending" ? "saving…" : `saved ${ago(a.updatedAt)}`}
        </span>
        <span className="bar-spacer" />
        {a.archivedAt ? (
          <button className="btn btn-quiet btn-small" onClick={() => setArchived(a.id, false)}>
            Take out of archive
          </button>
        ) : (
          <button className="btn btn-quiet btn-small" onClick={() => setArchived(a.id, true)}>
            Archive
          </button>
        )}
        {confirmDelete ? (
          <span className="confirm">
            Delete for good?
            <button
              className="btn btn-danger btn-small"
              onClick={async () => {
                await deleteArtifact(a.id);
                navigate("/", { replace: true });
              }}
            >
              Delete
            </button>
            <button className="link-btn" onClick={() => setConfirmDelete(false)}>
              Keep it
            </button>
          </span>
        ) : (
          <button className="btn btn-quiet btn-small" onClick={() => setConfirmDelete(true)}>
            Delete…
          </button>
        )}
      </div>

      {a.archivedAt && <p className="archived-note">In the archive since {stamp(a.archivedAt)}.</p>}

      <div className="artifact-grid">
        <div className="artifact-main">
          <div className="type-line">
            <span className="type-glyph-lg" aria-hidden>
              {typeInfo(a.type).glyph}
            </span>
            {customType ? (
              <input
                autoFocus
                className="type-input"
                placeholder="name a new type"
                aria-label="New type name"
                onKeyDown={(e) => {
                  const v = e.currentTarget.value.trim().toLowerCase();
                  if (e.key === "Enter" && v) {
                    save({ type: v });
                    setCustomType(false);
                  } else if (e.key === "Escape") setCustomType(false);
                }}
                onBlur={(e) => {
                  const v = e.currentTarget.value.trim().toLowerCase();
                  if (v) save({ type: v });
                  setCustomType(false);
                }}
              />
            ) : (
              <select
                className="type-select"
                value={a.type}
                aria-label="Type"
                onChange={(e) => (e.target.value === "__new" ? setCustomType(true) : save({ type: e.target.value }))}
              >
                {typeOptions.map((t) => (
                  <option key={t} value={t}>
                    {typeInfo(t).label.toLowerCase()}
                  </option>
                ))}
                <option value="__new">something else…</option>
              </select>
            )}
          </div>

          <textarea
            className="title-input"
            value={draft.title}
            rows={1}
            aria-label="Title"
            onChange={(e) => set("title", e.target.value.replace(/\n/g, " "))}
            onBlur={flush}
            ref={autosize}
          />
          <input
            className="summary-input"
            value={draft.summary}
            placeholder="One line about what this is"
            aria-label="Summary"
            onChange={(e) => set("summary", e.target.value)}
            onBlur={flush}
          />

          <TagEditor tags={a.tags} suggestions={tagSuggestions} onChange={(tags) => save({ tags })} />

          <textarea
            className="body-input"
            value={draft.body}
            placeholder="Notes, sketches in words, open questions, what you tried…"
            aria-label="Notes"
            onChange={(e) => set("body", e.target.value)}
            onBlur={flush}
            ref={autosize}
          />
        </div>

        <div className="artifact-side">
          <section className="panel">
            <header className="panel-head">
              <h2>Status</h2>
            </header>
            <div className="status-picker" role="radiogroup" aria-label="Status">
              {STATUSES.map((s) => (
                <button
                  key={s.key}
                  role="radio"
                  aria-checked={a.status === s.key}
                  className="status-option"
                  onClick={() => save({ status: s.key })}
                >
                  <StatusDot status={s.key} />
                  <span className="status-option-label">{s.label}</span>
                  <span className="status-option-hint">{s.hint}</span>
                </button>
              ))}
            </div>
          </section>

          <Connections artifact={a} />

          <dl className="provenance">
            <dt>made</dt>
            <dd title={stamp(a.createdAt)}>{stamp(a.createdAt)}</dd>
            <dt>changed</dt>
            <dd title={stamp(a.updatedAt)}>{ago(a.updatedAt)}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}

/** Ref callback that grows a textarea to fit its content. */
function autosize(el: HTMLTextAreaElement | null) {
  if (!el) return;
  const fit = () => {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };
  fit();
  el.oninput = fit;
}
