/** The DAKPluto Workbench badge, cut from the logo along its blue ring. */
export function Badge({ className, small = false }: { className?: string; small?: boolean }) {
  return (
    <img
      className={`badge ${className ?? ""}`}
      src={small ? "/brand/badge-128.png" : "/brand/badge-512.webp"}
      alt={small ? "" : "The DAKPluto Workbench"}
      draggable={false}
    />
  );
}

/** The blue rule that runs under the wordmark in the logo. */
export function BrandRule() {
  return <div className="brand-rule" aria-hidden />;
}

/** The plank and legs the "on the bench" cards sit on. */
export function Plank() {
  return (
    <div className="plank" aria-hidden>
      <div className="plank-top" />
      <div className="plank-legs">
        <span />
        <span />
      </div>
    </div>
  );
}
