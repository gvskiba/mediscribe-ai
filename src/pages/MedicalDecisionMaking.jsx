import MDMTab from "@/components/npi/MDMTab";

export default function MedicalDecisionMaking({ embedded = false, patientName = "New Patient", chiefComplaint = "", vitals = {}, medications = [], allergies = [], rosState = {}, peState = {} }) {
  if (embedded) {
    return <MDMTab patientName={patientName} chiefComplaint={chiefComplaint} vitals={vitals} medications={medications} allergies={allergies} rosState={rosState} peState={peState} />;
  }

  return (
    <div style={{ background: '#050f1e', minHeight: '100vh', padding: '20px 24px' }}>
      <MDMTab patientName={patientName} chiefComplaint={chiefComplaint} vitals={vitals} medications={medications} allergies={allergies} rosState={rosState} peState={peState} />
    </div>
  );
}