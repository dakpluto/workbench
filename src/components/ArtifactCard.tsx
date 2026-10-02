import { Link } from "react-router-dom";
import { catalogNumber, touchedAt, type Artifact } from "../model/artifact";
import { ago } from "../lib/time";
import { StatusDot, Tags, TypeMark } from "./Marks";

export function ArtifactCard({
  artifact: a,
  links = 0,
  note,
}: {
  artifact: Artifact;
  links?: number;
  /** Optional line printed on the card, e.g. "untouched for 143 days". */
  note?: string;
}) {
  return (
    <Link to={`/a/${a.id}`} className="card" data-status={a.status}>
      <div className="card-head">
        <span className="catalog">{catalogNumber(a)}</span>
        <TypeMark type={a.type} />
      </div>
      <h3 className="card-title">{a.title}</h3>
      {a.summary && <p className="card-summary">{a.summary}</p>}
      {note && <p className="card-note">{note}</p>}
      <div className="card-foot">
        <StatusDot status={a.status} withLabel />
        <Tags tags={a.tags.slice(0, 3)} />
        <span className="card-meta">
          {links > 0 && (
            <span className="links-count" title={`${links} connection${links === 1 ? "" : "s"}`}>
              ⟜ {links}
            </span>
          )}
          <span>{ago(touchedAt(a))}</span>
        </span>
      </div>
    </Link>
  );
}

export function ArtifactRow({ artifact: a, time }: { artifact: Artifact; time: number }) {
  return (
    <Link to={`/a/${a.id}`} className="row">
      <StatusDot status={a.status} />
      <span className="row-glyph" aria-hidden>
        <TypeMark type={a.type} withLabel={false} />
      </span>
      <span className="row-title">{a.title}</span>
      <span className="row-time">{ago(time)}</span>
    </Link>
  );
}
