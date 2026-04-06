import { useNavigate } from "react-router-dom";
import ProviderCommandCenter from "./ProviderCommandCenter";

// Maps hub IDs (from ProviderCommandCenter's HUB_DEFS) to app routes
const HUB_ROUTES = {
  narrative:   "/narrative-engine",
  ecg:         "/ecg-hub",
  resus:       "/resus-hub",
  airway:      "/airway-hub",
  sepsis:      "/sepsis-hub",
  dosing:      "/smart-dosing",
  ddx:         "/ddx-engine",
  psych:       "/psyche-hub",
  antidote:    "/antidote-hub",
  critical:    "/critical-inbox",
  tracking:    "/EDTrackingBoard",
  disposition: "/DispositionBoard",
  resustimer:  "/resus-hub",
};

export default function CommandCenterWrapper() {
  const navigate = useNavigate();

  function handleNavigate(hubId, patient) {
    const route = HUB_ROUTES[hubId];
    if (route) {
      navigate(route);
    } else {
      navigate("/hub");
    }
  }

  function handleBack() {
    navigate("/");
  }

  return (
    <ProviderCommandCenter
      onNavigate={handleNavigate}
      onBack={handleBack}
    />
  );
}