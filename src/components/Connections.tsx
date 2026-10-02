import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LINK_KINDS, catalogNumber, linkKindInfo, type Artifact, type LinkKind } from "../model/artifact";
import { connect, disconnect, useArtifacts, useLinksFor } from "../store/artifacts";
import { search } from "../lib/search";
import { StatusDot, TypeMark } from "./Marks";

export function Connections({ artifact }: { artifact: Artifact }) {
  const links = useLinksFor(artifact.id);
  const [picking, setPicking] = useState(false);

  return (
    <section className="panel connections">
      <header className="panel-head">
        <h2>Connections</h2>
        {!picking && (
          <button className="btn btn-quiet btn-small" onClick={() => setPicking(true)}>
            Connect…
          </button>
        )}
      </header>

      {picking && <ConnectPicker artifact={artifact} onDone={() => setPicking(false)} />}

      {links && links.length === 0 && !picking && (
        <p className="panel-empty">Not tied to anything yet. Connect it to whatever it reminds you of.</p>
      )}

      <ul className="link-list">
        {links?.map(({ link, other, outgoing }) => {
          const k = linkKindInfo(link.kind);
          return (
            <li key={link.id} className="link-item">
              <span className="link-kind">{outgoing ? k.forward : k.backward}</span>
              <Link to={`/a/${other.id}`} className="link-target">
                <StatusDot status={other.status} />
                <TypeMark type={other.type} withLabel={false} />
                <span className="link-title">{other.title}</span>
              </Link>
              <button className="link-remove" aria-label={`Disconnect ${other.title}`} onClick={() => disconnect(link.id)}>
                ×
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ConnectPicker({ artifact, onDone }: { artifact: Artifact; onDone: () => void }) {
  const all = useArtifacts();
  const [kind, setKind] = useState<LinkKind>("related");
  const [q, setQ] = useState("");

  const candidates = useMemo(() => {
    const pool = (all ?? []).filter((a) => a.id !== artifact.id);
    const ranked = q.trim() ? search(pool, q) : [...pool].sort((a, b) => b.updatedAt - a.updatedAt);
    return ranked.slice(0, 7);
  }, [all, q, artifact.id]);

  async function pick(target: Artifact) {
    await connect(artifact.id, target.id, kind);
    onDone();
  }

  return (
    <div className="picker">
      <div className="picker-sentence">
        <span className="picker-self">This</span>
        <select value={kind} onChange={(e) => setKind(e.target.value as LinkKind)} aria-label="Relationship">
          {LINK_KINDS.map((k) => (
            <option key={k.key} value={k.key}>
              {k.forward}
            </option>
          ))}
        </select>
        <span>…</span>
      </div>
      <input
        autoFocus
        value={q}
        placeholder="Find an artifact"
        aria-label="Find an artifact to connect"
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onDone();
          if (e.key === "Enter" && candidates[0]) pick(candidates[0]);
        }}
      />
      <ul className="picker-list">
        {candidates.map((c) => (
          <li key={c.id}>
            <button onClick={() => pick(c)}>
              <span className="catalog">{catalogNumber(c)}</span>
              <TypeMark type={c.type} withLabel={false} />
              <span className="picker-title">{c.title}</span>
            </button>
          </li>
        ))}
        {candidates.length === 0 && <li className="panel-empty">Nothing matches “{q}”.</li>}
      </ul>
      <button className="link-btn" onClick={onDone}>
        Cancel
      </button>
    </div>
  );
}
