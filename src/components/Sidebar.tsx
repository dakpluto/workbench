import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { SHELVES } from "../shelves";
import { exportAll, importAll, useArtifacts } from "../store/artifacts";
import { randomPick } from "../lib/discovery";
import { EmblemMark } from "./Emblem";

export function Sidebar() {
  const artifacts = useArtifacts();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [backupMsg, setBackupMsg] = useState("");

  const onEverything = location.pathname === "/shelf/everything";
  const [q, setQ] = useState(onEverything ? (params.get("q") ?? "") : "");
  useEffect(() => {
    if (!onEverything) setQ("");
  }, [onEverything]);

  // "/" focuses search from anywhere that isn't a text field.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      if (e.key !== "/" || el.closest("input, textarea, select, [contenteditable]")) return;
      e.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of SHELVES) m.set(s.slug, artifacts?.filter(s.filter).length ?? 0);
    return m;
  }, [artifacts]);

  const topTags = useMemo(() => {
    const c = new Map<string, number>();
    for (const a of artifacts ?? []) if (!a.archivedAt) for (const t of a.tags) c.set(t, (c.get(t) ?? 0) + 1);
    return [...c].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 12);
  }, [artifacts]);

  function onSearch(value: string) {
    setQ(value);
    navigate(`/shelf/everything${value ? `?q=${encodeURIComponent(value)}` : ""}`, { replace: onEverything });
  }

  async function download() {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `workbench-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setBackupMsg(`Exported ${data.artifacts.length} artifacts`);
  }

  async function upload(file: File) {
    try {
      const r = await importAll(JSON.parse(await file.text()));
      setBackupMsg(`Imported ${r.artifacts} artifacts, ${r.links} links`);
    } catch (e) {
      setBackupMsg(e instanceof Error ? e.message : "Import failed");
    }
  }

  function surprise() {
    const pick = randomPick(artifacts ?? [], location.pathname.split("/a/")[1]);
    if (pick) navigate(`/a/${pick.id}`);
  }

  return (
    <aside className="sidebar">
      <NavLink to="/" className="brand" end aria-label="DAKPluto Workbench, the bench">
        <EmblemMark />
        <span className="brand-words">
          <span className="brand-owner">
            DAK<span className="brand-pluto">Pluto</span>
          </span>
          <span className="brand-name">Workbench</span>
        </span>
      </NavLink>

      <label className="search">
        <span className="sr-only">Search everything</span>
        <input
          ref={searchRef}
          type="search"
          value={q}
          placeholder="Search"
          onChange={(e) => onSearch(e.target.value)}
        />
        <kbd aria-hidden>/</kbd>
      </label>

      <nav className="nav">
        <NavLink to="/" end className="nav-item">
          <span className="nav-glyph" aria-hidden>
            ⊙
          </span>
          The bench
        </NavLink>
        {SHELVES.map((s) => (
          <NavLink key={s.slug} to={`/shelf/${s.slug}`} className="nav-item" data-shelf={s.slug}>
            <span className="nav-glyph" aria-hidden>
              {s.glyph}
            </span>
            {s.label}
            <span className="nav-count">{counts.get(s.slug) || ""}</span>
          </NavLink>
        ))}
      </nav>

      {topTags.length > 0 && (
        <div className="side-tags">
          <h2 className="side-heading">Threads</h2>
          <div className="side-tag-list">
            {topTags.map(([t, n]) => (
              <NavLink key={t} to={`/shelf/everything?q=${encodeURIComponent("#" + t)}`} className="tag tag-link">
                #{t}
                <span className="tag-count">{n}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      <div className="side-foot">
        <button className="btn btn-surprise" onClick={surprise} disabled={!artifacts?.length}>
          <span aria-hidden>⚄</span> Surprise me
        </button>
        <div className="backup">
          <button className="link-btn" onClick={download}>
            Export
          </button>
          <button className="link-btn" onClick={() => fileRef.current?.click()}>
            Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = "";
            }}
          />
        </div>
        {backupMsg && <p className="backup-msg">{backupMsg}</p>}
        <p className="local-note">Stored in this browser only.</p>
      </div>
    </aside>
  );
}
