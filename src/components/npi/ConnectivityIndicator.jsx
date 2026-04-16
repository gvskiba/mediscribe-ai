// ConnectivityIndicator.jsx
// Shows online/offline status with a subtle animated dot.
// Mounts a window online/offline listener and reflects real-time connectivity.

import { useState, useEffect } from "react";

const T = {
  teal:  "#00e5c0",
  coral: "#ff6b6b",
  gold:  "#f5c842",
  txt4:  "#5a82a8",
};

export default function ConnectivityIndicator({ style = {} }) {
  const [online,  setOnline]  = useState(navigator.onLine);
  const [changed, setChanged] = useState(false); // brief flash on status change

  useEffect(() => {
    const go  = () => { setOnline(true);  flash(); };
    const off = () => { setOnline(false); flash(); };
    window.addEventListener("online",  go);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online",  go);
      window.removeEventListener("offline", off);
    };
  }, []);

  function flash() {
    setChanged(true);
    setTimeout(() => setChanged(false), 2000);
  }

  const color = online ? T.teal : T.coral;
  const label = online ? "Online" : "Offline";

  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, ...style }}>
      {/* Animated pulse dot */}
      <div style={{ position:"relative", width:8, height:8, flexShrink:0 }}>
        {/* Outer ring — pulses when online, solid when offline */}
        {online && (
          <div style={{
            position:"absolute", inset:0, borderRadius:"50%",
            background:color, opacity:0.25,
            animation:"npi-ci-ring 2s ease-out infinite",
          }} />
        )}
        <div style={{
          position:"absolute", inset:1, borderRadius:"50%",
          background:color,
          boxShadow: changed ? `0 0 6px ${color}` : "none",
          transition:"background .3s, box-shadow .3s",
        }} />
      </div>

      <span style={{
        fontFamily:"'JetBrains Mono',monospace",
        fontSize:9, fontWeight:700,
        letterSpacing:"0.8px", textTransform:"uppercase",
        color: changed ? color : T.txt4,
        transition:"color .3s",
      }}>
        {label}
      </span>

      <style>{`
        @keyframes npi-ci-ring {
          0%   { transform:scale(1);   opacity:.28; }
          70%  { transform:scale(2.4); opacity:0;   }
          100% { transform:scale(2.4); opacity:0;   }
        }
      `}</style>
    </div>
  );
}