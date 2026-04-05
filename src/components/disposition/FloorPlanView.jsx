import { useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const T = {
  bg:"#050f1e", txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", red:"#ff4444", coral:"#ff6b6b",
  green:"#3dffa0", blue:"#3b9eff", purple:"#9b6dff", orange:"#ff9f43",
};

const DISPO_TYPE = {
  admit:       { label:"Admit",       color:T.blue,   icon:"🏥" },
  discharge:   { label:"Discharge",   color:T.green,  icon:"🏠" },
  transfer:    { label:"Transfer",    color:T.purple, icon:"🚑" },
  observation: { label:"Observation", color:T.teal,   icon:"👁️" },
  ama:         { label:"AMA",         color:T.orange, icon:"⚠️" },
};

const DISPO_STATUS = {
  pending:   { label:"Pending",      color:T.txt4   },
  requested: { label:"Requested",    color:T.gold   },
  arranged:  { label:"Arranged",     color:T.blue   },
  boarding:  { label:"Boarding",     color:T.orange },
  ready:     { label:"Ready",        color:T.green  },
  complete:  { label:"Complete",     color:T.teal   },
};

// Generate a standard ED room layout
function generateRooms(occupiedRooms) {
  const occupied = new Set(occupiedRooms);
  // Standard ED layout: trauma bays, main rooms, fast-track
  const layout = [
    // Row 1: Trauma / Critical
    { id:"T1", label:"T1", zone:"Trauma",     row:0, col:0 },
    { id:"T2", label:"T2", zone:"Trauma",     row:0, col:1 },
    { id:"T3", label:"T3", zone:"Trauma",     row:0, col:2 },
    // Row 2-3: Main rooms A
    { id:"1",  label:"1",  zone:"Main",       row:1, col:0 },
    { id:"2",  label:"2",  zone:"Main",       row:1, col:1 },
    { id:"3",  label:"3",  zone:"Main",       row:1, col:2 },
    { id:"4",  label:"4",  zone:"Main",       row:1, col:3 },
    { id:"5",  label:"5",  zone:"Main",       row:1, col:4 },
    { id:"6",  label:"6",  zone:"Main",       row:2, col:0 },
    { id:"7",  label:"7",  zone:"Main",       row:2, col:1 },
    { id:"8",  label:"8",  zone:"Main",       row:2, col:2 },
    { id:"9",  label:"9",  zone:"Main",       row:2, col:3 },
    { id:"10", label:"10", zone:"Main",       row:2, col:4 },
    // Row 3-4: Main rooms B
    { id:"11", label:"11", zone:"Main",       row:3, col:0 },
    { id:"12", label:"12", zone:"Main",       row:3, col:1 },
    { id:"13", label:"13", zone:"Main",       row:3, col:2 },
    { id:"14", label:"14", zone:"Main",       row:3, col:3 },
    { id:"15", label:"15", zone:"Main",       row:3, col:4 },
    // Row 4: Fast track
    { id:"FT1",label:"FT1",zone:"Fast Track", row:4, col:0 },
    { id:"FT2",label:"FT2",zone:"Fast Track", row:4, col:1 },
    { id:"FT3",label:"FT3",zone:"Fast Track", row:4, col:2 },
    { id:"FT4",label:"FT4",zone:"Fast Track", row:4, col:3 },
    { id:"FT5",label:"FT5",zone:"Fast Track", row:4, col:4 },
  ];
  // Add any occupied rooms not in the layout
  occupiedRooms.forEach(r => {
    if (!layout.find(l => l.id === r)) {
      layout.push({ id: r, label: r, zone:"Main", row:5, col:layout.filter(l=>l.row===5).length });
    }
  });
  return layout;
}

const ZONE_COLORS = {
  "Trauma":     { bg:"rgba(255,68,68,0.08)",  border:"rgba(255,68,68,0.3)",  label:T.coral  },
  "Main":       { bg:"rgba(59,158,255,0.06)", border:"rgba(59,158,255,0.2)", label:T.blue   },
  "Fast Track": { bg:"rgba(0,229,192,0.06)",  border:"rgba(0,229,192,0.2)",  label:T.teal   },
};

const STATUS_COLUMNS = [
  { id:"pending",   label:"Pending",   color:T.txt4   },
  { id:"requested", label:"Requested", color:T.gold   },
  { id:"arranged",  label:"Arranged",  color:T.blue   },
  { id:"boarding",  label:"Boarding",  color:T.orange },
  { id:"ready",     label:"Ready",     color:T.green  },
  { id:"complete",  label:"Complete",  color:T.teal   },
];

function RoomCell({ room, patient, record, provided, snapshot, isDraggingOver }) {
  const dt = record ? (DISPO_TYPE[record.dispo_type] || null) : null;
  const ds = record ? (DISPO_STATUS[record.dispo_status] || DISPO_STATUS.pending) : null;
  const zc = ZONE_COLORS[room.zone] || ZONE_COLORS.Main;
  const occupied = !!patient;
  const accentColor = dt ? dt.color : zc.label;

  return (
    <div
      ref={provided.innerRef}
      {...provided.droppableProps}
      style={{
        minHeight: 110,
        borderRadius: 10,
        padding: "6px",
        background: isDraggingOver
          ? `${accentColor}18`
          : occupied ? `${accentColor}0b` : zc.bg,
        border: `1.5px solid ${isDraggingOver ? accentColor : occupied ? `${accentColor}45` : zc.border}`,
        transition: "all .15s",
        position: "relative",
        boxShadow: isDraggingOver ? `0 0 12px ${accentColor}30` : "none",
      }}
    >
      {/* Room label */}
      <div style={{
        fontFamily:"JetBrains Mono", fontSize:11, fontWeight:700,
        color: occupied ? accentColor : zc.label,
        marginBottom: 4, letterSpacing:.5,
      }}>{room.label}</div>

      {/* Patient content */}
      {patient && record !== undefined && (
        <div>
          {/* CC */}
          <div style={{ fontFamily:"DM Sans", fontSize:10, fontWeight:600, color:T.txt, lineHeight:1.3, marginBottom:3 }}>
            {patient.cc}
          </div>
          {/* Age/sex */}
          <div style={{ fontFamily:"DM Sans", fontSize:9, color:T.txt4, marginBottom:4 }}>
            {patient.age}{patient.sex}
          </div>
          {/* Dispo badge */}
          {dt && (
            <span style={{
              fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700,
              padding:"1px 5px", borderRadius:20, display:"inline-block",
              background:`${dt.color}18`, border:`1px solid ${dt.color}40`,
              color:dt.color, marginBottom:2,
            }}>{dt.icon} {dt.label}</span>
          )}
          {!record && (
            <span style={{
              fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700,
              padding:"1px 5px", borderRadius:20, display:"inline-block",
              background:`${T.gold}15`, border:`1px solid ${T.gold}35`, color:T.gold,
            }}>NO DISPO</span>
          )}
          {/* Status */}
          {ds && (
            <div>
              <span style={{
                fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700,
                padding:"1px 5px", borderRadius:20, display:"inline-block",
                background:`${ds.color}13`, border:`1px solid ${ds.color}30`,
                color:ds.color,
              }}>{ds.label.toUpperCase()}</span>
            </div>
          )}
        </div>
      )}

      {/* Empty room placeholder */}
      {!patient && (
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"center",
          height:60, opacity:.25,
          fontFamily:"DM Sans", fontSize:10, color:T.txt4,
        }}>Empty</div>
      )}

      {provided.placeholder}
    </div>
  );
}

function PatientDraggable({ patient, record, index }) {
  const dt = record ? (DISPO_TYPE[record.dispo_type] || null) : null;
  const ds = record ? (DISPO_STATUS[record.dispo_status] || DISPO_STATUS.pending) : null;
  const accentColor = dt ? dt.color : T.txt4;

  return (
    <Draggable draggableId={`patient-${patient.id}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            borderRadius: 8,
            padding: "6px 8px",
            background: snapshot.isDragging
              ? `rgba(8,22,40,0.98)`
              : `${accentColor}0e`,
            border: `1.5px solid ${snapshot.isDragging ? accentColor : `${accentColor}40`}`,
            cursor: "grab",
            boxShadow: snapshot.isDragging ? `0 8px 24px rgba(0,0,0,0.6), 0 0 16px ${accentColor}30` : "none",
            transform: snapshot.isDragging ? `${provided.draggableProps.style?.transform} rotate(2deg)` : provided.draggableProps.style?.transform,
            userSelect: "none",
          }}
        >
          <div style={{ fontFamily:"DM Sans", fontSize:11, fontWeight:700, color:T.txt, lineHeight:1.2 }}>
            {patient.cc}
          </div>
          <div style={{ fontFamily:"DM Sans", fontSize:9, color:T.txt4, marginTop:1 }}>
            {patient.age}{patient.sex}
          </div>
          {dt && (
            <div style={{ fontFamily:"JetBrains Mono", fontSize:7, color:dt.color, marginTop:2 }}>
              {dt.icon} {dt.label}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

export default function FloorPlanView({ enriched, onMoveToRoom, onUpdateStatus }) {
  const [viewTab, setViewTab] = useState("floor"); // "floor" | "status"

  // Build room → patient mapping
  const roomMap = useMemo(() => {
    const m = {};
    enriched.forEach(({ patient, record }) => {
      const roomId = patient.room || patient.patient_id || "—";
      if (!m[roomId]) m[roomId] = [];
      m[roomId].push({ patient, record });
    });
    return m;
  }, [enriched]);

  const occupiedRooms = useMemo(() => Object.keys(roomMap), [roomMap]);
  const rooms = useMemo(() => generateRooms(occupiedRooms), [occupiedRooms]);

  // Status board columns
  const statusMap = useMemo(() => {
    const m = {};
    STATUS_COLUMNS.forEach(s => { m[s.id] = []; });
    enriched.forEach(e => {
      const key = e.record?.dispo_status || "pending";
      if (!m[key]) m[key] = [];
      m[key].push(e);
    });
    return m;
  }, [enriched]);

  // Zones for floor plan
  const zones = useMemo(() => {
    const z = {};
    rooms.forEach(r => {
      if (!z[r.zone]) z[r.zone] = [];
      z[r.zone].push(r);
    });
    return z;
  }, [rooms]);

  function onDragEnd(result) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    const patientId = draggableId.replace("patient-", "");
    const destId = destination.droppableId;

    // If dropped on a room cell
    if (destId.startsWith("room-")) {
      const newRoom = destId.replace("room-", "");
      onMoveToRoom(patientId, newRoom);
      return;
    }

    // If dropped on a status column
    if (destId.startsWith("status-")) {
      const newStatus = destId.replace("status-", "");
      const entry = enriched.find(e => e.patient.id === patientId);
      if (entry?.record) {
        onUpdateStatus(entry.record.id, newStatus);
      }
    }
  }

  const glass = {
    backdropFilter:"blur(20px) saturate(180%)",
    WebkitBackdropFilter:"blur(20px) saturate(180%)",
    background:"rgba(8,22,40,0.78)",
    border:"1px solid rgba(42,79,122,0.35)",
    borderRadius:12,
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

        {/* View toggle */}
        <div style={{ display:"flex", gap:6, ...glass, padding:"5px", alignSelf:"flex-start" }}>
          {[
            { id:"floor",  label:"🏥 Floor Plan"  },
            { id:"status", label:"📋 Status Board" },
          ].map(v => (
            <button key={v.id} onClick={() => setViewTab(v.id)} style={{
              fontFamily:"DM Sans", fontWeight:600, fontSize:12,
              padding:"7px 16px", borderRadius:9, cursor:"pointer",
              border:`1px solid ${viewTab===v.id ? T.teal+"55":"transparent"}`,
              background:viewTab===v.id ? `${T.teal}16`:"transparent",
              color:viewTab===v.id ? T.teal : T.txt3, transition:"all .12s",
            }}>{v.label}</button>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, alignItems:"center" }}>
          <span style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4, letterSpacing:1.5, textTransform:"uppercase" }}>Dispo:</span>
          {Object.entries(DISPO_TYPE).map(([k, v]) => (
            <span key={k} style={{
              fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
              padding:"2px 8px", borderRadius:20,
              background:`${v.color}14`, border:`1px solid ${v.color}35`,
              color:v.color,
            }}>{v.icon} {v.label}</span>
          ))}
          <span style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4, marginLeft:8 }}>
            · Drag patients between rooms or status columns
          </span>
        </div>

        {/* ── FLOOR PLAN VIEW ── */}
        {viewTab === "floor" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {Object.entries(zones).map(([zoneName, zoneRooms]) => {
              const zc = ZONE_COLORS[zoneName] || ZONE_COLORS.Main;
              return (
                <div key={zoneName}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <span style={{ fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700, color:zc.label, letterSpacing:1.5, textTransform:"uppercase" }}>{zoneName}</span>
                    <div style={{ flex:1, height:1, background:`${zc.label}30` }} />
                    <span style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4 }}>
                      {zoneRooms.filter(r => roomMap[r.id]?.length > 0).length}/{zoneRooms.length} occupied
                    </span>
                  </div>
                  <div style={{
                    display:"grid",
                    gridTemplateColumns:`repeat(${Math.min(5, zoneRooms.length)}, 1fr)`,
                    gap:10,
                  }}>
                    {zoneRooms.map(room => {
                      const occupants = roomMap[room.id] || [];
                      const { patient, record } = occupants[0] || {};
                      return (
                        <Droppable key={room.id} droppableId={`room-${room.id}`}>
                          {(provided, snapshot) => (
                            <div style={{ position:"relative" }}>
                              <RoomCell
                                room={room}
                                patient={patient}
                                record={record}
                                provided={provided}
                                snapshot={snapshot}
                                isDraggingOver={snapshot.isDraggingOver}
                              />
                              {patient && (
                                <div style={{ position:"absolute", inset:0, padding:"28px 6px 6px 6px" }}>
                                  <PatientDraggable patient={patient} record={record} index={0} />
                                </div>
                              )}
                            </div>
                          )}
                        </Droppable>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Unassigned patients */}
            {enriched.filter(e => !e.patient.room || !rooms.find(r => r.id === e.patient.room)).length > 0 && (
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <span style={{ fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700, color:T.txt4, letterSpacing:1.5, textTransform:"uppercase" }}>Unassigned</span>
                  <div style={{ flex:1, height:1, background:"rgba(90,130,168,0.2)" }} />
                </div>
                <Droppable droppableId="unassigned" direction="horizontal">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        display:"flex", flexWrap:"wrap", gap:8, minHeight:60, padding:10,
                        borderRadius:10, background: snapshot.isDraggingOver ? "rgba(59,158,255,0.08)" : "rgba(8,22,40,0.4)",
                        border:"1.5px dashed rgba(42,79,122,0.4)",
                        transition:"all .15s",
                      }}
                    >
                      {enriched
                        .filter(e => !e.patient.room || !rooms.find(r => r.id === e.patient.room))
                        .map(({ patient, record }, i) => (
                          <PatientDraggable key={patient.id} patient={patient} record={record} index={i} />
                        ))
                      }
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )}
          </div>
        )}

        {/* ── STATUS BOARD VIEW ── */}
        {viewTab === "status" && (
          <div style={{
            display:"grid",
            gridTemplateColumns:`repeat(${STATUS_COLUMNS.length}, 1fr)`,
            gap:10,
          }}>
            {STATUS_COLUMNS.map(col => (
              <div key={col.id}>
                {/* Column header */}
                <div style={{
                  ...glass, padding:"8px 10px", marginBottom:8, borderRadius:9,
                  borderLeft:`3px solid ${col.color}`,
                  background:`${col.color}10`,
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                }}>
                  <span style={{ fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700, color:col.color, letterSpacing:1, textTransform:"uppercase" }}>
                    {col.label}
                  </span>
                  <span style={{ fontFamily:"JetBrains Mono", fontSize:10, fontWeight:700, color:col.color }}>
                    {statusMap[col.id]?.length || 0}
                  </span>
                </div>

                {/* Droppable column */}
                <Droppable droppableId={`status-${col.id}`}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        minHeight:120, display:"flex", flexDirection:"column", gap:6,
                        padding:6, borderRadius:9,
                        background: snapshot.isDraggingOver ? `${col.color}10` : "transparent",
                        border: snapshot.isDraggingOver ? `1.5px dashed ${col.color}50` : "1.5px dashed rgba(42,79,122,0.2)",
                        transition:"all .15s",
                      }}
                    >
                      {(statusMap[col.id] || []).map(({ patient, record }, i) => (
                        <Draggable key={patient.id} draggableId={`patient-${patient.id}`} index={i}>
                          {(provided, snapshot) => {
                            const dt = record ? (DISPO_TYPE[record.dispo_type] || null) : null;
                            return (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  borderRadius:8, padding:"8px 10px",
                                  background: snapshot.isDragging ? "rgba(8,22,40,0.98)" : "rgba(8,22,40,0.75)",
                                  border:`1px solid ${dt ? dt.color+"35" : "rgba(42,79,122,0.35)"}`,
                                  cursor:"grab",
                                  boxShadow: snapshot.isDragging ? `0 8px 24px rgba(0,0,0,0.5)` : "none",
                                  userSelect:"none",
                                }}
                              >
                                <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:11, color:T.txt, marginBottom:2 }}>
                                  {patient.room && <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:col.color, marginRight:5 }}>Rm {patient.room}</span>}
                                  {patient.cc}
                                </div>
                                <div style={{ fontFamily:"DM Sans", fontSize:9, color:T.txt4 }}>
                                  {patient.age}{patient.sex} · {patient.provider}
                                </div>
                                {dt && (
                                  <div style={{ fontFamily:"JetBrains Mono", fontSize:7, color:dt.color, marginTop:3 }}>
                                    {dt.icon} {dt.label}
                                  </div>
                                )}
                              </div>
                            );
                          }}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {(statusMap[col.id]?.length || 0) === 0 && !snapshot.isDraggingOver && (
                        <div style={{ padding:"16px 8px", textAlign:"center", fontFamily:"DM Sans", fontSize:10, color:T.txt4, fontStyle:"italic" }}>
                          Drop here
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        )}

      </div>
    </DragDropContext>
  );
}