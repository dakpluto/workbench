import { statusInfo, typeInfo } from "../model/artifact";

export function StatusDot({ status, withLabel = false }: { status: string; withLabel?: boolean }) {
  const info = statusInfo(status);
  return (
    <span className="status" data-status={info.key} title={`${info.label}: ${info.hint}`}>
      <span className="status-dot" aria-hidden />
      {withLabel ? <span className="status-label">{info.label}</span> : <span className="sr-only">{info.label}</span>}
    </span>
  );
}

export function TypeMark({ type, withLabel = true }: { type: string; withLabel?: boolean }) {
  const info = typeInfo(type);
  return (
    <span className="type-mark" title={info.label}>
      <span className="type-glyph" aria-hidden>
        {info.glyph}
      </span>
      {withLabel && <span>{info.label.toLowerCase()}</span>}
    </span>
  );
}

export function Tags({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <span className="tags">
      {tags.map((t) => (
        <span key={t} className="tag">
          #{t}
        </span>
      ))}
    </span>
  );
}
