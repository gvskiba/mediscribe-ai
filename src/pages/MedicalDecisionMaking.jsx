import MDMTab from '@/components/npi/MDMTab';

export default function MedicalDecisionMaking() {
  return (
    <div style={{ padding: '18px 22px 30px', overflowY: 'auto', minHeight: '100%', background: '#050f1e' }}>
      <MDMTab patientName="Patient" chiefComplaint="" vitals={{}} />
    </div>
  );
}