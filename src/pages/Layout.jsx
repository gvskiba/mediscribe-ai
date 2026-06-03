/*
  Layout.jsx — global wrapper.
  The shared header now lives in GlobalNav (mounted in App.jsx), so Layout is a
  thin shell: a full-height flex column that scrolls its page content.

  Exemption: pages that own their full chrome (the Command Center and its Spine)
  pass straight through with no wrapper styling.
*/

// Pages that render their own top chrome — Layout wraps them in nothing.
const NO_HEADER = new Set([
  "CommandCenter",
  "CommandCenterSpine",
]);

export default function Layout({ children, currentPageName }) {
  const routeName = currentPageName ||
    (typeof window !== "undefined" ? window.location.pathname.replace(/^\//, "").split("/")[0] : "");

  if (NO_HEADER.has(routeName)) return <>{children}</>;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "#050f1e" }}>
      <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        {children}
      </div>
    </div>
  );
}