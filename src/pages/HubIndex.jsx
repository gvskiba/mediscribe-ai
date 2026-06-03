import { useEffect } from "react";
export default function HubIndex() {
  useEffect(() => { window.location.replace("/CommandCenter"); }, []);
  return null;
}