import MDMTab from "@/components/npi/MDMTab";

export default function MedicalDecisionMaking() {
  return (
    <div style={{ background: '#050f1e', minHeight: '100vh', padding: '20px 24px' }}>
      <MDMTab patientName="New Patient" chiefComplaint="" />
    </div>
  );
}