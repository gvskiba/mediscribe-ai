/**
 * Thin re-export wrapper — renders the full DischargePlanning page inside the
 * NewPatientInput discharge tab. Props are accepted but unused since the full
 * page loads its own data from the API.
 */
import DischargePlanning from "@/pages/DischargePlanning";

export default function DischargePlanningWrapper(props) {
  return <DischargePlanning />;
}