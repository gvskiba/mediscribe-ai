import { useEffect } from "react";
export default function HubSelectorPage() {
  useEffect(() => { window.location.replace("/CommandCenter"); }, []);
  return null;
}