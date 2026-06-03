import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Redirect stub — all hub catalog logic lives in HubLauncherPage via hubRegistry.
export default function HubIndex() {
  const navigate = useNavigate();
  useEffect(() => { navigate("/hub", { replace: true }); }, []);
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#081628", color:"#7a9cc0", fontSize:14 }}>
      Redirecting…
    </div>
  );
}