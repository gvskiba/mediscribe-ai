import MDMTab from "@/components/npi/MDMTab";

export default function MedicalDecisionMaking({ embedded = false, patientName = "New Patient", chiefComplaint = "" }) {
  if (embedded) {
    return <MDMTab patientName={patientName} chiefComplaint={chiefComplaint} />;
  }

  return (
    <div style={{ background: '#050f1e', minHeight: '100vh', padding: '20px 24px' }}>
      <MDMTab patientName={patientName} chiefComplaint={chiefComplaint} />
    </div>
  );
}