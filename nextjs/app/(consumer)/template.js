// A template re-mounts on every navigation (unlike layout.js, which persists),
// so this gives consumer pages a soft enter transition on each route change.
// Operational screens (KDS/POS/waiter/courier) deliberately have no such
// transition — they must render instantly.
export default function Template({ children }) {
  return <div className="page-enter">{children}</div>;
}
