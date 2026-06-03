import LakonyxHeader from "@/components/LakonyxHeader";
import HubCatalog from "@/components/HubCatalog";

// ─────────────────────────────────────────────────────────────────────────────
// HubLauncherPage — standalone full-page hub launcher.
// No overlay, no board, no dimming. Renders HubCatalog with no patient context.
// onSelect navigates full-page to the selected hub's route.
// ─────────────────────────────────────────────────────────────────────────────

export default function HubLauncherPage() {
  const handleSelect = (hub) => {
    window.location.href = hub.route;
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden",
      background: "linear-gradient(180deg, #0b1a30 0%, #081628 100%)",
      color: "#e8eef7", fontFamily: '"DM Sans", system-ui, sans-serif',
    }}>
      <LakonyxHeader
        pageName="Hub Launcher"
        showSearch={false}
        showShiftStatus={true}
        showClock={true}
      />
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <HubCatalog
          patientContext={null}
          onSelect={handleSelect}
          autoFocus={true}
        />
      </div>
    </div>
  );
}