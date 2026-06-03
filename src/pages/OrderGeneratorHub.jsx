import { useEffect } from "react";
export default function OrderGeneratorHub() {
  useEffect(() => { window.location.replace("/EDOrderHub"); }, []);
  return null;
}