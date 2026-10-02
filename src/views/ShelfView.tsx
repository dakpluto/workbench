import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { shelfBySlug } from "../shelves";
import { useArtifacts, useLinkCounts } from "../store/artifacts";
import { STATUSES, touchedAt, type Artifact } from "../model/artifact";
import { search } from "../lib/search";
import { ArtifactCard } from "../components/ArtifactCard";
import { QuickCapture } from "../components/QuickCapture";
import { StatusDot } from "../components/Marks";

type Sort = "touched" | "created" | "title";

const sorters: Record<Sort, (a: Artifact, b: Artifact) => number> = {
  touched: (a, b) => touchedAt(b) - touchedAt(a),
  created: (a, b) => b.createdAt - a.createdAt,
  title: (a, b) => a.title.localeCompare(b.title),
};

export function ShelfView() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  const shelf = shelfBySlug(slug);
  const artifacts = useArtifacts();
  const linkCounts = useLinkCounts();
  const [status, setStatus] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("touched");

  const items = useMemo(() => {
    if (!shelf || !artifacts) return [];
    let list = artifacts.filter(shelf.filter);
    if (status) list = list.filter((a) => a.status === status);
    if (q.trim()) return search(list, q); // relevance wins when searching
    return list.sort(sorters[sort]);
  }, [artifacts, shelf, status, sort, q]);

  if (!shelf) return <div className="page">There's no shelf called “{slug}”.</div>;
  if (!artifacts) return null;

  const total = artifacts.filter(shelf.filter).length;

  return (
    <div className="page shelf">
      <header className="shelf-head">
        <h1 className="shelf-title">
          <span className="shelf-glyph" aria-hidden>
            {shelf.glyph}
          </span>
          {q ? `Searching for “${q}”` : shelf.label}
        </h1>
        <span className="shelf-count">
          {items.length === total ? total : `${items.length} of ${total}`}
        </span>
      </header>

      {shelf.slug !== "archive" && !q && (
        <QuickCapture
          key={shelf.slug}
          type={shelf.type}
          placeholder={shelf.type ? `New ${shelf.type}…` : "Put something on the bench…"}
        />
      )}

      <div className="filters">
        <div className="toggle" role="group" aria-label="Filter by status">
          <button aria-pressed={status === null} onClick={() => setStatus(null)}>
            any
          </button>
          {STATUSES.map((s) => (
            <button key={s.key} aria-pressed={status === s.key} onClick={() => setStatus(status === s.key ? null : s.key)}>
              <StatusDot status={s.key} /> {s.label.toLowerCase()}
            </button>
          ))}
        </div>
        {!q && (
          <label className="sort">
            <span>sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="touched">last touched</option>
              <option value="created">newest</option>
              <option value="title">title</option>
            </select>
          </label>
        )}
      </div>

      {items.length ? (
        <div className="card-grid">
          {items.map((a) => (
            <ArtifactCard key={a.id} artifact={a} links={linkCounts?.get(a.id)} />
          ))}
        </div>
      ) : (
        <p className="section-empty">{q || status ? "Nothing matches. Try fewer words, or a different status." : shelf.empty}</p>
      )}
    </div>
  );
}
