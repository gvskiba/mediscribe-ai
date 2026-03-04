import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ShiftNavBar from "../components/shift/ShiftNavBar.jsx";
import ShiftHeader from "../components/shift/ShiftHeader.jsx";
import StatsRibbon from "../components/shift/StatsRibbon.jsx";
import PatientBoard from "../components/shift/PatientBoard.jsx";
import RightSidebar from "../components/shift/RightSidebar.jsx";
import TaskPanel from "../components/shift/TaskPanel.jsx";
import SignoutSection from "../components/shift/SignoutSection.jsx";
import AddPatientModal from "../components/shift/modals/AddPatientModal.jsx";
import AddTaskModal from "../components/shift/modals/AddTaskModal.jsx";
import AddOrderModal from "../components/shift/modals/AddOrderModal.jsx";
import EndShiftModal from "../components/shift/modals/EndShiftModal.jsx";

const COLORS = {
  navy: "#050f1e",
  slate: "#0b1d35",
  panel: "#0d2240",
  border: "#1e3a5f",
};

export default function Shift() {
  const queryClient = useQueryClient();
  const [shift, setShift] = useState(null);
  const [currentFilter, setCurrentFilter] = useState("all");
  const [activeOrderTarget, setActiveOrderTarget] = useState(null);
  const [openModals, setOpenModals] = useState({});
  const [elapsed, setElapsed] = useState(0);

  // Fetch active shift
  const { data: activeShift, isLoading: shiftLoading } = useQuery({
    queryKey: ["activeShift"],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return null;
      const shifts = await base44.entities.shifts.list("-created_date", 1);
      return shifts.find((s) => s.status === "active") || null;
    },
    staleTime: 30000,
  });

  // Fetch encounters
  const { data: encounters = [] } = useQuery({
    queryKey: ["encounters", activeShift?.id],
    queryFn: () =>
      activeShift
        ? base44.entities.encounters.list("-arrival_time", 100)
        : Promise.resolve([]),
    enabled: !!activeShift,
    staleTime: 5000,
  });

  // Fetch orders
  const { data: orders = [] } = useQuery({
    queryKey: ["orders", activeShift?.id],
    queryFn: () =>
      activeShift ? base44.entities.orders.list("-ordered_at", 100) : Promise.resolve([]),
    enabled: !!activeShift,
    staleTime: 5000,
  });

  // Fetch tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", activeShift?.id],
    queryFn: () =>
      activeShift ? base44.entities.tasks.list("-created_at", 100) : Promise.resolve([]),
    enabled: !!activeShift,
    staleTime: 5000,
  });

  // Process shift data
  useEffect(() => {
    if (activeShift && encounters.length >= 0) {
      const patients = encounters.filter((e) => e.disposition === "pending" || !e.disposition);
      const closedPatients = encounters.filter((e) => e.disposition && e.disposition !== "pending");

      const patientsWithOrders = patients.map((p) => ({
        ...p,
        orders: orders.filter((o) => o.encounter_id === p.id),
      }));

      setShift({
        start: new Date(activeShift.shift_start),
        durationHours: activeShift.shift_duration_hours || 12,
        patients: patientsWithOrders,
        closedPatients,
        tasks: tasks.filter((t) => t.status === "open"),
        procedures: 0,
        currentFilter,
      });
    }
  }, [activeShift, encounters, orders, tasks, currentFilter]);

  // Live clock updates
  useEffect(() => {
    if (!shift) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - shift.start.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [shift]);

  const openModal = useCallback((modalId) => {
    setOpenModals((prev) => ({ ...prev, [modalId]: true }));
  }, []);

  const closeModal = useCallback((modalId) => {
    setOpenModals((prev) => ({ ...prev, [modalId]: false }));
  }, []);

  if (shiftLoading) {
    return (
      <div style={{ background: COLORS.navy, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#e8f4ff" }}>
        <div>Loading shift…</div>
      </div>
    );
  }

  if (!activeShift) {
    return (
      <div style={{ background: COLORS.navy, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#e8f4ff" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>🏥</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>No Active Shift</div>
          <div style={{ fontSize: 14, color: "#4a7299", marginTop: 8 }}>
            Start a new shift to begin
          </div>
        </div>
      </div>
    );
  }

  if (!shift) return null;

  const filteredPatients =
    currentFilter === "all"
      ? shift.patients
      : shift.patients.filter((p) => {
          if (currentFilter === "critical") return ["1", "2"].includes(p.acuity);
          if (currentFilter === "unsigned") return p.note_status !== "signed";
          if (currentFilter === "pending") return p.orders?.some((o) => o.status === "pending");
          return true;
        });

  return (
    <div style={{ background: COLORS.navy, minHeight: "100vh", color: "#c8ddf0", fontFamily: "DM Sans, sans-serif" }}>
      <ShiftNavBar shift={activeShift} elapsed={elapsed} onEndShift={() => openModal("end-shift")} />
      <ShiftHeader shift={activeShift} elapsed={elapsed} onAddPatient={() => openModal("add-patient")} />
      <StatsRibbon shift={shift} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, padding: 20, maxWidth: "1400px", margin: "0 auto" }}>
        <PatientBoard
          patients={filteredPatients}
          currentFilter={currentFilter}
          onFilterChange={setCurrentFilter}
          onAddOrder={(patientId) => {
            setActiveOrderTarget(patientId);
            openModal("add-order");
          }}
        />
        <RightSidebar shift={shift} />
      </div>

      <TaskPanel tasks={shift.tasks} onAddTask={() => openModal("add-task")} />
      <SignoutSection patients={shift.patients} />

      {/* Modals */}
      {openModals["add-patient"] && (
        <AddPatientModal isOpen onClose={() => closeModal("add-patient")} shiftId={activeShift.id} />
      )}
      {openModals["add-task"] && <AddTaskModal isOpen onClose={() => closeModal("add-task")} shiftId={activeShift.id} />}
      {openModals["add-order"] && (
        <AddOrderModal
          isOpen
          onClose={() => closeModal("add-order")}
          patientId={activeOrderTarget}
        />
      )}
      {openModals["end-shift"] && (
        <EndShiftModal isOpen onClose={() => closeModal("end-shift")} shiftId={activeShift.id} />
      )}
    </div>
  );
}