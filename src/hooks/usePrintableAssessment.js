/**
 * Hook for generating printable assessment data from hub state
 * Usage: const assessmentData = usePrintableAssessment(hubState, title, options)
 */
export function usePrintableAssessment(hubState, title, options = {}) {
  const {
    facility = "Emergency Department",
    provider = undefined,
    includeMonitoring = true,
    customSections = []
  } = options;

  const baseData = {
    title,
    timestamp: new Date().toISOString(),
    facility,
    provider,
    sections: [
      ...customSections,
      {
        label: "Assessment Summary",
        content: hubState.summary || "Assessment in progress",
        highlight: false
      }
    ],
    recommendations: hubState.recommendations || [],
    monitoring: includeMonitoring ? (hubState.monitoring || []) : [],
    notes: hubState.notes || ""
  };

  return baseData;
}

/**
 * Export assessment data as JSON for archival/EMR integration
 */
export function exportAssessmentJSON(assessmentData) {
  const jsonStr = JSON.stringify(assessmentData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `assessment_${new Date().getTime()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Copy assessment to clipboard in plain text format
 */
export function copyAssessmentToClipboard(assessmentData) {
  let text = `${assessmentData.title}\n`;
  text += `Date: ${new Date(assessmentData.timestamp).toLocaleString()}\n`;
  text += `Facility: ${assessmentData.facility}\n`;
  if (assessmentData.provider) text += `Provider: ${assessmentData.provider}\n`;
  text += `\n${'='.repeat(60)}\n\n`;

  assessmentData.sections?.forEach(section => {
    text += `${section.label}\n${'-'.repeat(section.label.length)}\n`;
    if (Array.isArray(section.content)) {
      section.content.forEach(item => text += `• ${item}\n`);
    } else {
      text += `${section.content}\n`;
    }
    text += '\n';
  });

  if (assessmentData.recommendations?.length > 0) {
    text += 'RECOMMENDATIONS\n' + '-'.repeat(15) + '\n';
    assessmentData.recommendations.forEach(rec => text += `• ${rec}\n`);
    text += '\n';
  }

  if (assessmentData.monitoring?.length > 0) {
    text += 'MONITORING\n' + '-'.repeat(10) + '\n';
    assessmentData.monitoring.forEach(item => text += `• ${item}\n`);
    text += '\n';
  }

  if (assessmentData.notes) {
    text += `NOTES\n${'-'.repeat(5)}\n${assessmentData.notes}\n`;
  }

  navigator.clipboard.writeText(text).then(() => {
    console.log('Assessment copied to clipboard');
  });
}