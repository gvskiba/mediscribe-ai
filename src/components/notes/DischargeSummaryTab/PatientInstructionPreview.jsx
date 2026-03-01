import React from "react";

export default function PatientInstructionPreview({
  instructions,
  patientName,
  visitDate,
  providerName,
}) {
  if (!instructions) return null;

  return (
    <div className="patient-sheet">
      {/* Header */}
      <div className="ps-header">
        <div className="ps-hospital-info">
          <h1 className="ps-hospital-name">Emergency Department</h1>
          <p className="ps-subtitle">Discharge Instructions & Follow-Up Care</p>
        </div>
        <div className="ps-patient-info">
          <p><strong>{patientName || "Patient"}</strong></p>
          <p className="ps-date">Visit Date: {visitDate || new Date().toLocaleDateString()}</p>
          {providerName && <p className="ps-provider">Provider: {providerName}</p>}
        </div>
      </div>

      {/* Main Content */}
      <div className="ps-content">
        {/* Diagnosis */}
        <section className="ps-section">
          <h2 className="ps-section-title">Your Diagnosis</h2>
          <p className="ps-text">{instructions.diagnosisFriendly}</p>
        </section>

        {/* What We Found */}
        {instructions.whatWeFound && (
          <section className="ps-section">
            <h2 className="ps-section-title">What We Found</h2>
            <p className="ps-text">{instructions.whatWeFound}</p>
          </section>
        )}

        {/* Medications */}
        {instructions.medicationPurposes && instructions.medicationPurposes.length > 0 && (
          <section className="ps-section">
            <h2 className="ps-section-title">Your Medications</h2>
            <div className="ps-list">
              {instructions.medicationPurposes.map((med, idx) => (
                <div key={idx} className="ps-list-item">{med}</div>
              ))}
            </div>
          </section>
        )}

        {/* Activity Instructions */}
        {instructions.activityInstructions && (
          <section className="ps-section">
            <h2 className="ps-section-title">Activity & Rest</h2>
            <p className="ps-text">{instructions.activityInstructions}</p>
          </section>
        )}

        {/* Diet Instructions */}
        {instructions.dietInstructions && (
          <section className="ps-section">
            <h2 className="ps-section-title">Diet & Nutrition</h2>
            <p className="ps-text">{instructions.dietInstructions}</p>
          </section>
        )}

        {/* Follow-Up */}
        {instructions.followUpNeeded && instructions.followUpNeeded.length > 0 && (
          <section className="ps-section">
            <h2 className="ps-section-title">Follow-Up Appointments</h2>
            <div className="ps-list">
              {instructions.followUpNeeded.map((followUp, idx) => (
                <div key={idx} className="ps-list-item">{followUp}</div>
              ))}
            </div>
          </section>
        )}

        {/* Return Precautions - HIGHEST PRIORITY */}
        <section className="ps-section ps-red-alert">
          <h2 className="ps-section-title-alert">⚠️ RETURN TO EMERGENCY DEPARTMENT IMMEDIATELY IF:</h2>
          <div className="ps-alert-list">
            {instructions.returnImmediately && instructions.returnImmediately.map((item, idx) => (
              <div key={idx} className="ps-alert-item">{item}</div>
            ))}
          </div>
        </section>

        {/* Call Doctor */}
        {instructions.callDoctor && instructions.callDoctor.length > 0 && (
          <section className="ps-section ps-amber-alert">
            <h2 className="ps-section-title">📞 Call Your Doctor If:</h2>
            <div className="ps-list">
              {instructions.callDoctor.map((item, idx) => (
                <div key={idx} className="ps-list-item">{item}</div>
              ))}
            </div>
          </section>
        )}

        {/* Education Tips */}
        {instructions.educationTips && instructions.educationTips.length > 0 && (
          <section className="ps-section">
            <h2 className="ps-section-title">💡 Important Information</h2>
            <div className="ps-tips">
              {instructions.educationTips.map((tip, idx) => (
                <div key={idx} className="ps-tip">{tip}</div>
              ))}
            </div>
          </section>
        )}

        {/* Emergency Contacts */}
        <section className="ps-section ps-contacts">
          <h2 className="ps-section-title">Emergency Contacts</h2>
          <div className="ps-contact-grid">
            <div><strong>Emergency:</strong> <span className="ps-contact-number">911</span></div>
            <div><strong>Poison Control:</strong> <span className="ps-contact-number">1-800-222-1222</span></div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="ps-footer">
        <p className="ps-footer-text">
          Keep this sheet for your records. Call if you have questions about these instructions.
        </p>
        <div className="ps-signature-line">
          ___________________________ (Patient / Parent Signature)
        </div>
      </div>
    </div>
  );
}