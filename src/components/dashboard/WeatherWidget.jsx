import React, { useState, useEffect, useRef, useCallback } from "react";

const T = {
  navy: "#050f1e", panel: "#0d2240", edge: "#162d4f",
  border: "#1e3a5f", muted: "#2a4d72", dim: "#4a7299",
  text: "#c8ddf0", bright: "#e8f4ff", teal: "#00d4bc",
  amber: "#f5a623", red: "#ff5c6c", green: "#2ecc71", blue: "#4a90d9",
};

const UA = "(notrya-ai.com, dev@mednu.com)";

const ICON_MAP = {
  "tornado": "🌪️", "hurricane": "🌀", "tropical storm": "🌀",
  "thunderstorm": "⛈️", "t-storm": "⛈️", "blizzard": "❄️",
  "freezing rain": "🌧️", "ice": "🌧️", "heavy snow": "❄️",
  "snow": "🌨️", "flurr": "🌨️", "heavy rain": "🌧️",
  "rain": "🌦️", "shower": "🌦️", "drizzle": "🌦️",
  "fog": "🌫️", "mist": "🌫️", "haze": "🌫️", "overcast": "☁️",
  "mostly cloudy": { day: "⛅", night: "☁️" },
  "partly cloudy": { day: "🌤️", night: "🌥️" },
  "partly sunny": { day: "🌤️", night: "🌥️" },
  "clear": { day: "☀️", night: "🌙" },
  "sunny": { day: "☀️", night: "🌙" },
  "fair": { day: "☀️", night: "🌙" },
  "wind": "💨",
};

function getIcon(desc, isDaytime = true) {
  if (!desc) return isDaytime ? "🌤️" : "🌙";
  const d = desc.toLowerCase();
  for (const [key, val] of Object.entries(ICON_MAP)) {
    if (d.includes(key)) {
      if (typeof val === "object") return isDaytime ? val.day : val.night;
      return val;
    }
  }
  return isDaytime ? "🌤️" : "🌙";
}

function degToCardinal(deg) {
  if (deg == null) return "—";
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

function fmtTemp(val, unit, fromCelsius = true) {
  if (val == null) return "—";
  if (fromCelsius) return unit === "F" ? Math.round(val * 9/5 + 32) : Math.round(val);
  return unit === "C" ? Math.round((val - 32) * 5/9) : Math.round(val);
}

function fmtSpeed(mps, unit) {
  if (mps == null) return "—";
  return unit === "F" ? Math.round(mps * 2.237) : Math.round(mps * 3.6);
}

function fmtHour(iso, index) {
  if (index === 0) return "Now";
  const d = new Date(iso);
  let h = d.getHours(), ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h} ${ampm}`;
}

function fmtDay(iso, index) {
  if (index === 0) return "Today";
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short" });
}

function WindCompass({ deg, size = 64 }) {
  const rotation = deg ?? 0;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", border: `1.5px solid ${T.border}`, background: T.edge, position: "relative", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {["N","S","E","W"].map((d, i) => {
        const positions = [{ top:3,left:"50%",transform:"translateX(-50%)" }, { bottom:3,left:"50%",transform:"translateX(-50%)" }, { right:4,top:"50%",transform:"translateY(-50%)" }, { left:4,top:"50%",transform:"translateY(-50%)" }];
        return <span key={d} style={{ position:"absolute", fontSize:8, fontWeight:700, color: d==="N"?T.teal:T.dim, ...positions[i] }}>{d}</span>;
      })}
      <div style={{ width:2, height:size*0.32, background:`linear-gradient(to bottom, ${T.teal}, ${T.border})`, borderRadius:2, transformOrigin:"bottom center", transform:`rotate(${rotation}deg)`, transition:"transform 0.8s cubic-bezier(0.34,1.56,0.64,1)", marginTop:`-${size*0.16}px` }} />
      <div style={{ position:"absolute", width:5, height:5, borderRadius:"50%", background:T.teal, top:"50%", left:"50%", transform:"translate(-50%,-50%)" }} />
    </div>
  );
}

function AtmBar({ label, value, max = 100, gradient, suffix = "%" }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:10, color:T.dim, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.07em" }}>{label}</span>
        <span style={{ fontSize:11, color:T.bright, fontWeight:700, fontFamily:"monospace" }}>{value != null ? `${Math.round(value)}${suffix}` : "—"}</span>
      </div>
      <div style={{ height:5, background:T.border, borderRadius:3 }}>
        <div style={{ height:"100%", width:`${pct}%`, borderRadius:3, background:gradient, transition:"width 0.8s ease" }} />
      </div>
    </div>
  );
}

export default function WeatherWidget({ collapsed = false }) {
  const [unit, setUnit] = useState("F");
  const [cityInput, setCityInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState("");
  const [error, setError] = useState(null);
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [location, setLocation] = useState({ city:"", state:"", lat:null, lng:null });
  const [station, setStation] = useState({ id:"", name:"" });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const timerRef = useRef(null);

  const NWS = async (url) => {
    const res = await fetch(url, { headers: { "User-Agent": UA, "Accept": "application/json" } });
    if (!res.ok) throw new Error(`NWS ${res.status}: ${url}`);
    return res.json();
  };

  const loadWeather = useCallback(async (lat, lng) => {
    setLoading(true);
    setError(null);
    const latR = Math.round(lat * 10000) / 10000;
    const lngR = Math.round(lng * 10000) / 10000;

    try {
      setLoadStep("Resolving NWS grid…");
      const pts = await NWS(`https://api.weather.gov/points/${latR},${lngR}`);
      const { cwa: office, gridX, gridY, forecast: fUrl, forecastHourly: hUrl, observationStations: stUrl, relativeLocation } = pts.properties;
      setLocation(prev => ({ ...prev, lat, lng, city: relativeLocation?.properties?.city || "", state: relativeLocation?.properties?.state || "" }));

      setLoadStep("Fetching weather data…");
      const [fcResult, hrResult, obsResult, alResult] = await Promise.allSettled([
        NWS(fUrl),
        NWS(hUrl),
        (async () => {
          const stData = await NWS(stUrl);
          const stations = stData.features?.slice(0, 5) || [];
          for (const st of stations) {
            const sid = st.properties.stationIdentifier;
            const sname = st.properties.name;
            try {
              const obs = await NWS(`https://api.weather.gov/stations/${sid}/observations/latest`);
              if (obs.properties.temperature.value !== null) {
                setStation({ id: sid, name: sname });
                return obs.properties;
              }
            } catch {}
          }
          return null;
        })(),
        fetch(`https://api.weather.gov/alerts/active?point=${latR},${lngR}`, { headers: { "User-Agent": UA } }).then(r => r.json()).catch(() => ({ features: [] })),
      ]);

      if (fcResult.status === "fulfilled") setForecast(fcResult.value.properties?.periods || []);
      if (hrResult.status === "fulfilled") setHourly(hrResult.value.properties?.periods?.slice(0, 24) || []);
      if (obsResult.status === "fulfilled") setCurrent(obsResult.value);
      if (alResult.status === "fulfilled") setAlerts(alResult.value.features?.slice(0, 3) || []);

      setLastUpdated(new Date());

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => loadWeather(lat, lng), 15 * 60 * 1000);
    } catch (e) {
      if (e.message.includes("404")) setError("Location outside NWS coverage. Try a US city.");
      else setError("Failed to fetch weather. Check your connection and try again.");
    }
    setLoading(false);
    setLoadStep("");
  }, []);

  const geoLocate = () => {
    if (!navigator.geolocation) { setError("Geolocation not supported by your browser."); return; }
    setLoading(true); setLoadStep("Getting your location…");
    navigator.geolocation.getCurrentPosition(
      pos => loadWeather(pos.coords.latitude, pos.coords.longitude),
      err => { setLoading(false); setError("Location access denied. Search by city name below."); },
      { timeout: 12000 }
    );
  };

  const searchCity = async (q) => {
    if (!q) return;
    setLoading(true); setLoadStep(`Searching "${q}"…`);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=us&format=json&limit=1`, { headers: { "User-Agent": UA } });
      const data = await res.json();
      if (!data.length) { setError("No US location found. Try adding the state, e.g. 'Miami FL'."); setLoading(false); return; }
      loadWeather(parseFloat(data[0].lat), parseFloat(data[0].lon));
    } catch { setError("Geocoding failed. Please try again."); setLoading(false); }
  };

  useEffect(() => { geoLocate(); return () => { if (timerRef.current) clearTimeout(timerRef.current); }; }, []);

  // Derived display values
  const temp = current ? fmtTemp(current.temperature?.value, unit, true) : (forecast[0] ? fmtTemp(forecast[0].temperature, unit, false) : "—");
  const feelsLike = current ? fmtTemp(current.heatIndex?.value ?? current.windChill?.value ?? current.temperature?.value, unit, true) : null;
  const condition = current?.textDescription || forecast[0]?.shortForecast || "—";
  const humidity = current?.relativeHumidity?.value;
  const windSpeed = current?.windSpeed?.value;
  const windDir = current?.windDirection?.value;
  const windGust = current?.windGust?.value;
  const pressure = current?.barometricPressure?.value ? (current.barometricPressure.value / 100).toFixed(1) : null;
  const visibility = current?.visibility?.value ? (unit === "F" ? (current.visibility.value / 1609.34).toFixed(1) + " mi" : (current.visibility.value / 1000).toFixed(1) + " km") : null;
  const isDaytime = forecast[0]?.isDaytime ?? true;
  const maxPrecip = hourly.slice(0, 12).reduce((m, h) => Math.max(m, h.probabilityOfPrecipitation?.value || 0), 0);
  const dewpoint = current?.dewpoint?.value ? fmtTemp(current.dewpoint.value, unit, true) : null;

  // Paired forecast days
  const dayPeriods = [];
  for (let i = 0; i < forecast.length; i++) {
    if (forecast[i].isDaytime) {
      dayPeriods.push({ day: forecast[i], night: forecast[i + 1] || null });
      if (dayPeriods.length >= 7) break;
    }
  }

  const alertType = (evt) => {
    const e = (evt || "").toLowerCase();
    if (e.includes("tornado") || e.includes("extreme") || e.includes("emergency")) return { icon:"🚨", bg:"rgba(255,92,108,0.09)", border:"rgba(255,92,108,0.3)", color:T.red };
    if (e.includes("warning")) return { icon:"⚠️", bg:"rgba(245,166,35,0.09)", border:"rgba(245,166,35,0.3)", color:T.amber };
    return { icon:"📣", bg:"rgba(155,109,255,0.09)", border:"rgba(155,109,255,0.25)", color:"#9b6dff" };
  };

  const locLabel = location.city ? `${location.city}, ${location.state}` : (location.lat ? `${location.lat.toFixed(2)}, ${location.lng.toFixed(2)}` : "—");

  return (
    <div style={{ background: T.navy, borderRadius: 14, border: `1px solid ${T.border}`, overflow: "hidden", fontFamily: "DM Sans, sans-serif", fontSize: 13, color: T.text }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .wx-scroll::-webkit-scrollbar{height:0}
      `}</style>

      {/* Header */}
      <div style={{ background:"rgba(11,29,53,0.9)", borderBottom:`1px solid ${T.border}`, padding:"10px 16px", display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:16 }}>☁</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.bright }}>Weather</div>
          <div style={{ fontSize:9.5, color:T.dim }}>National Weather Service · US only</div>
        </div>
        {/* Unit toggle */}
        <div style={{ display:"flex", background:T.edge, border:`1px solid ${T.border}`, borderRadius:6, overflow:"hidden" }}>
          {["F","C"].map(u => (
            <button key={u} onClick={() => setUnit(u)}
              style={{ padding:"3px 9px", border:"none", cursor:"pointer", fontSize:10.5, fontWeight:700, background:unit===u?"rgba(0,212,188,0.15)":"transparent", color:unit===u?T.teal:T.dim, fontFamily:"inherit" }}>
              °{u}
            </button>
          ))}
        </div>
        <button onClick={geoLocate} style={{ padding:"4px 9px", borderRadius:6, background:"transparent", border:`1px solid ${T.border}`, color:T.dim, fontSize:11, cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=T.teal;e.currentTarget.style.color=T.teal;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.dim;}}>
          📍 My Location
        </button>
        <button onClick={() => setIsCollapsed(c => !c)} style={{ background:"transparent", border:"none", cursor:"pointer", color:T.dim, fontSize:14, padding:"2px 4px" }}>
          {isCollapsed ? "▼" : "▲"}
        </button>
      </div>

      {/* Search */}
      <div style={{ padding:"8px 14px", borderBottom:`1px solid ${T.border}`, display:"flex", gap:6 }}>
        <input value={cityInput} onChange={e=>setCityInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&searchCity(cityInput.trim())}
          placeholder="Search US city… e.g. Spencer Iowa, Miami FL"
          style={{ flex:1, background:T.edge, border:`1.5px solid ${T.border}`, borderRadius:8, padding:"7px 12px", color:T.bright, fontSize:12.5, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}
          onFocus={e=>e.target.style.borderColor=T.teal} onBlur={e=>e.target.style.borderColor=T.border}
        />
        <button onClick={() => searchCity(cityInput.trim())}
          style={{ padding:"7px 14px", borderRadius:8, background:`linear-gradient(135deg,${T.teal},#00a896)`, color:"#050f1e", fontWeight:700, fontSize:11.5, cursor:"pointer", border:"none", fontFamily:"inherit", whiteSpace:"nowrap" }}>
          Search
        </button>
      </div>

      {isCollapsed ? null : (
        <>
          {/* Alerts */}
          {alerts.map((al, i) => {
            const at = alertType(al.properties.event);
            return (
              <div key={i} style={{ margin:"8px 14px 0", padding:"9px 13px", borderRadius:9, background:at.bg, border:`1px solid ${at.border}`, display:"flex", gap:8, animation:"fadeUp .3s ease" }}>
                <span style={{ fontSize:15, flexShrink:0 }}>{at.icon}</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:at.color }}>{al.properties.event}</div>
                  <div style={{ fontSize:11, color:T.text, lineHeight:1.6 }}>{(al.properties.headline || "").slice(0, 200)}</div>
                </div>
              </div>
            );
          })}

          {/* Error */}
          {error && (
            <div style={{ margin:"8px 14px 0", padding:"9px 13px", borderRadius:8, background:"rgba(245,166,35,0.07)", border:"1px solid rgba(245,166,35,0.25)", fontSize:11.5, color:T.amber }}>
              ⚠ {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ padding:"32px 16px", textAlign:"center" }}>
              <div style={{ width:28, height:28, borderRadius:"50%", border:`2.5px solid ${T.border}`, borderTopColor:T.teal, animation:"spin .7s linear infinite", margin:"0 auto 10px" }} />
              <div style={{ fontSize:11.5, color:T.dim }}>{loadStep || "Loading weather…"}</div>
            </div>
          )}

          {/* Current Conditions */}
          {!loading && (temp !== "—" || condition !== "—") && (
            <div style={{ padding:"20px 18px 16px", borderBottom:`1px solid rgba(30,58,95,0.6)`, animation:"fadeUp .4s ease" }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:16 }}>
                {/* Left */}
                <div style={{ flex:1 }}>
                  {locLabel !== "—" && (
                    <div style={{ fontSize:11, color:T.dim, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>📍 {locLabel}</div>
                  )}
                  <div style={{ display:"flex", alignItems:"flex-end", gap:10, marginBottom:4 }}>
                    <span style={{ fontFamily:"serif", fontSize:64, fontWeight:700, lineHeight:1, color:T.bright, letterSpacing:-2 }}>{temp}</span>
                    <span style={{ fontFamily:"serif", fontSize:28, color:T.dim, paddingBottom:6 }}>°{unit}</span>
                    <span style={{ fontSize:44 }}>{getIcon(condition, isDaytime)}</span>
                  </div>
                  <div style={{ fontSize:16, fontWeight:500, color:T.text, marginBottom:4 }}>{condition}</div>
                  {feelsLike !== null && <div style={{ fontSize:12, color:T.dim, marginBottom:12 }}>Feels like {feelsLike}°{unit}</div>}
                  {/* Metrics */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:7 }}>
                    {[
                      { label:"Humidity", value: humidity != null ? `${Math.round(humidity)}%` : "—" },
                      { label:"Wind", value: windSpeed != null ? `${fmtSpeed(windSpeed, unit)} ${unit==="F"?"mph":"km/h"}` : "—", sub: windDir != null ? degToCardinal(windDir) : "" },
                      { label:"Visibility", value: visibility || "—" },
                      { label:"Pressure", value: pressure ? `${pressure} mb` : "—" },
                    ].map(m => (
                      <div key={m.label} style={{ background:"rgba(22,45,79,0.7)", border:`1px solid ${T.border}`, borderRadius:8, padding:"8px 10px" }}>
                        <div style={{ fontSize:9, color:T.dim, textTransform:"uppercase", letterSpacing:"0.07em", fontWeight:600, marginBottom:3 }}>{m.label}</div>
                        <div style={{ fontSize:13, fontWeight:700, color:T.bright }}>{m.value}</div>
                        {m.sub && <div style={{ fontSize:9.5, color:T.teal }}>{m.sub}</div>}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Right meta */}
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, flexShrink:0 }}>
                  <span style={{ background:"rgba(0,212,188,0.07)", border:"1px solid rgba(0,212,188,0.2)", color:T.teal, fontSize:9.5, fontWeight:700, padding:"3px 8px", borderRadius:5 }}>📡 NWS Live</span>
                  {lastUpdated && <div style={{ fontSize:9.5, color:T.dim, fontFamily:"monospace", textAlign:"right" }}>Updated {lastUpdated.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</div>}
                  {station.name && (
                    <div style={{ fontSize:9.5, color:T.dim, textAlign:"right", lineHeight:1.6, padding:"6px 9px", background:T.edge, border:`1px solid ${T.border}`, borderRadius:7 }}>
                      <div style={{ fontWeight:600, color:T.text }}>{station.id}</div>
                      <div>{station.name}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Hourly Strip */}
          {!loading && hourly.length > 0 && (
            <div style={{ padding:"14px 0 0", borderBottom:`1px solid rgba(30,58,95,0.6)` }}>
              <div style={{ padding:"0 18px 8px", fontSize:10, fontWeight:700, color:T.dim, textTransform:"uppercase", letterSpacing:"0.1em", display:"flex", alignItems:"center", gap:8 }}>
                Hourly <div style={{ height:1, background:T.border, flex:1 }} />
              </div>
              <div className="wx-scroll" style={{ display:"flex", overflowX:"auto", padding:"0 14px 12px", gap:3 }}>
                {hourly.map((h, i) => (
                  <div key={i} style={{ minWidth:66, padding:"9px 7px", borderRadius:9, textAlign:"center", background:i===0?"rgba(0,212,188,0.07)":"transparent", border:i===0?`1px solid rgba(0,212,188,0.2)`:"1px solid transparent", flexShrink:0 }}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(22,45,79,0.8)"}
                    onMouseLeave={e=>e.currentTarget.style.background=i===0?"rgba(0,212,188,0.07)":"transparent"}>
                    <div style={{ fontSize:9.5, color:T.dim, fontFamily:"monospace", fontWeight:600, marginBottom:5 }}>{fmtHour(h.startTime, i)}</div>
                    <div style={{ fontSize:20, marginBottom:4 }}>{getIcon(h.shortForecast, h.isDaytime)}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:T.bright }}>{fmtTemp(h.temperature, unit, false)}°</div>
                    {(h.probabilityOfPrecipitation?.value || 0) > 0 && (
                      <div style={{ fontSize:9, color:T.blue, fontWeight:600, marginTop:3, fontFamily:"monospace" }}>💧{h.probabilityOfPrecipitation.value}%</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7-Day Forecast */}
          {!loading && dayPeriods.length > 0 && (
            <div style={{ padding:"14px 0 0", borderBottom:`1px solid rgba(30,58,95,0.6)` }}>
              <div style={{ padding:"0 18px 8px", fontSize:10, fontWeight:700, color:T.dim, textTransform:"uppercase", letterSpacing:"0.1em", display:"flex", alignItems:"center", gap:8 }}>
                7-Day <div style={{ height:1, background:T.border, flex:1 }} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:5, padding:"0 14px 14px" }}>
                {dayPeriods.map(({ day, night }, i) => (
                  <div key={i} title={day.detailedForecast}
                    style={{ background:i===0?"rgba(0,212,188,0.06)":"rgba(22,45,79,0.5)", border:`1px solid ${i===0?"rgba(0,212,188,0.22)":T.border}`, borderRadius:10, padding:"10px 6px", textAlign:"center", cursor:"default", transition:"all 0.18s" }}
                    onMouseEnter={e=>{e.currentTarget.style.background="rgba(22,45,79,0.9)";e.currentTarget.style.transform="translateY(-2px)";}}
                    onMouseLeave={e=>{e.currentTarget.style.background=i===0?"rgba(0,212,188,0.06)":"rgba(22,45,79,0.5)";e.currentTarget.style.transform="none";}}>
                    <div style={{ fontSize:9.5, fontWeight:700, color:T.dim, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:5 }}>{fmtDay(day.startTime, i)}</div>
                    <div style={{ fontSize:22, marginBottom:5 }}>{getIcon(day.shortForecast, true)}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:T.bright }}>{fmtTemp(day.temperature, unit, false)}°</div>
                    <div style={{ fontSize:10.5, color:T.dim, marginTop:2 }}>{night ? `${fmtTemp(night.temperature, unit, false)}°` : "—"}</div>
                    {(day.probabilityOfPrecipitation?.value || 0) > 10 && (
                      <div style={{ fontSize:8.5, color:T.blue, fontWeight:600, marginTop:4, fontFamily:"monospace" }}>💧{day.probabilityOfPrecipitation.value}%</div>
                    )}
                    <div style={{ fontSize:8.5, color:T.dim, marginTop:3, lineHeight:1.4, wordBreak:"break-word" }}>{(day.shortForecast || "").slice(0, 18)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wind + Atmosphere */}
          {!loading && (windSpeed != null || humidity != null) && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, padding:"14px 14px" }}>
              {/* Wind Panel */}
              <div style={{ background:"rgba(22,45,79,0.5)", border:`1px solid ${T.border}`, borderRadius:12, padding:"14px 15px" }}>
                <div style={{ fontSize:10, fontWeight:700, color:T.dim, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>💨 Wind</div>
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <WindCompass deg={windDir} size={64} />
                  <div>
                    <div style={{ fontFamily:"serif", fontSize:28, color:T.bright, fontWeight:700, lineHeight:1 }}>{fmtSpeed(windSpeed, unit)}</div>
                    <div style={{ fontSize:11.5, color:T.dim, marginTop:2 }}>{unit==="F"?"mph":"km/h"}</div>
                    {windDir != null && <div style={{ fontSize:11.5, color:T.teal, fontWeight:600, marginTop:4 }}>{degToCardinal(windDir)} ({Math.round(windDir)}°)</div>}
                    <div style={{ fontSize:11, color:T.dim, marginTop:3 }}>{windGust != null ? `Gusts to ${fmtSpeed(windGust, unit)} ${unit==="F"?"mph":"km/h"}` : "No significant gusts"}</div>
                  </div>
                </div>
              </div>
              {/* Atmosphere Panel */}
              <div style={{ background:"rgba(22,45,79,0.5)", border:`1px solid ${T.border}`, borderRadius:12, padding:"14px 15px" }}>
                <div style={{ fontSize:10, fontWeight:700, color:T.dim, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>🌡️ Atmosphere</div>
                <AtmBar label="Humidity" value={humidity} gradient={`linear-gradient(90deg, ${T.blue}, ${T.teal})`} />
                <AtmBar label="Precip. Chance (12h)" value={maxPrecip} gradient={`linear-gradient(90deg, ${T.blue}, ${T.blue})`} />
                <AtmBar label={`Dew Point (°${unit})`} value={dewpoint} max={unit==="F"?110:44} suffix={`°${unit}`} gradient={`linear-gradient(90deg, ${T.teal}, ${T.green})`} />
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ padding:"8px 16px", borderTop:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(11,29,53,0.7)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ background:"rgba(0,212,188,0.07)", border:"1px solid rgba(0,212,188,0.2)", color:T.teal, fontSize:8.5, fontWeight:700, padding:"2px 7px", borderRadius:5 }}>📡 NWS</span>
              {lastUpdated && <span style={{ fontSize:9.5, color:T.dim }}>Updated {lastUpdated.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</span>}
            </div>
            <button onClick={() => location.lat ? loadWeather(location.lat, location.lng) : geoLocate()}
              style={{ padding:"3px 10px", borderRadius:5, background:"transparent", border:`1px solid ${T.border}`, color:T.dim, fontSize:9.5, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=T.teal;e.currentTarget.style.color=T.teal;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.dim;}}>
              ↻ Refresh
            </button>
          </div>
        </>
      )}
    </div>
  );
}