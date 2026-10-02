import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useArtifacts, useLinkCounts } from "../store/artifacts";
import { addSamples } from "../store/samples";
import { touchedAt } from "../model/artifact";
import { recurringThreads, resurface, unfinished } from "../lib/discovery";
import { daysSince } from "../lib/time";
import { ArtifactCard, ArtifactRow } from "../components/ArtifactCard";
import { QuickCapture } from "../components/QuickCapture";

export function Bench() {
  const artifacts = useArtifacts();
  const linkCounts = useLinkCounts();
  const [recentMode, setRecentMode] = useState<"touched" | "created">("touched");
  const [nonce, setNonce] = useState(0);

  const live = useMemo(() => (artifacts ?? []).filter((a) => !a.archivedAt), [artifacts]);
  const exploring = useMemo(
    () => live.filter((a) => a.status === "exploring").sort((a, b) => touchedAt(b) - touchedAt(a)),
    [live],
  );
  const recent = useMemo(() => {
    const key = recentMode === "touched" ? touchedAt : (a: (typeof live)[number]) => a.createdAt;
    return [...live].sort((a, b) => key(b) - key(a)).slice(0, 8).map((a) => ({ a, t: key(a) }));
  }, [live, recentMode]);
  const simmering = useMemo(() => unfinished(live).slice(0, 5), [live]);
  const found = useMemo(() => resurface(live, nonce), [live, nonce]);
  const threads = useMemo(() => recurringThreads(live).slice(0, 3), [live]);

  if (!artifacts) return null;

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  if (artifacts.length === 0) {
    return (
      <div className="page bench bench-empty">
        <p className="dateline">{today}</p>
        <h1 className="bench-title">Come in and mess around.</h1>
        <p className="lede">
          Everything here is an artifact: an idea, an experiment, a question, a tool, something you abandoned, something you
          can't name yet. Put one down to start.
        </p>
        <QuickCapture placeholder="Some idea about procedural cities…" />
        <p className="samples-offer">
          Want something to poke at first?{" "}
          <button className="link-btn" onClick={() => addSamples()}>
            Add a few sample artifacts
          </button>
        </p>
      </div>
    );
  }

  const foundDays = found ? daysSince(touchedAt(found)) : 0;

  return (
    <div className="page bench">
      <header className="bench-head">
        <p className="dateline">{today}</p>
        <h1 className="bench-title">Come in and mess around.</h1>
        <QuickCapture />
      </header>

      <section className="bench-section">
        <div className="section-head">
          <h2>On the bench</h2>
          <span className="section-note">{exploring.length ? `${exploring.length} being explored` : ""}</span>
        </div>
        {exploring.length ? (
          <div className="card-scatter">
            {exploring.map((a) => (
              <ArtifactCard key={a.id} artifact={a} links={linkCounts?.get(a.id)} tilted />
            ))}
          </div>
        ) : (
          <p className="section-empty">
            Nothing in progress. Open an artifact and set it to <em>Exploring</em> to put it here.
          </p>
        )}
      </section>

      <div className="bench-columns">
        <section className="bench-section">
          <div className="section-head">
            <h2>Recently</h2>
            <div className="toggle" role="group" aria-label="Sort recent artifacts">
              <button aria-pressed={recentMode === "touched"} onClick={() => setRecentMode("touched")}>
                touched
              </button>
              <button aria-pressed={recentMode === "created"} onClick={() => setRecentMode("created")}>
                added
              </button>
            </div>
          </div>
          <div className="rows">
            {recent.map(({ a, t }) => (
              <ArtifactRow key={a.id} artifact={a} time={t} />
            ))}
          </div>

          {simmering.length > 0 && (
            <>
              <div className="section-head section-head-spaced">
                <h2>Unfinished business</h2>
              </div>
              <div className="rows">
                {simmering.map((a) => (
                  <ArtifactRow key={a.id} artifact={a} time={touchedAt(a)} />
                ))}
              </div>
            </>
          )}
        </section>

        <section className="bench-section found">
          <div className="section-head">
            <h2>Found under the bench</h2>
            <button className="link-btn" onClick={() => setNonce((n) => n + 1)}>
              Dig again
            </button>
          </div>
          {found && (
            <ArtifactCard
              key={found.id}
              artifact={found}
              links={linkCounts?.get(found.id)}
              note={
                foundDays >= 2
                  ? `You haven't looked at this in ${foundDays} days.`
                  : "Recently handled, but worth another look."
              }
            />
          )}

          {threads.length > 0 && (
            <p className="thread">
              You keep coming back to{" "}
              {threads.map(({ tag, count }, i) => (
                <span key={tag}>
                  {i > 0 && (i === threads.length - 1 ? " and " : ", ")}
                  <Link
                    to={`/shelf/everything?q=${encodeURIComponent("#" + tag)}`}
                    className="tag tag-link"
                    title={`${count} artifacts`}
                  >
                    #{tag}
                  </Link>
                </span>
              ))}
              .
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
