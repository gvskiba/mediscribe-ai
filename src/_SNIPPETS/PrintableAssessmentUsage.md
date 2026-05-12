# Printable Assessment Document - Integration Guide

## Overview
The `PrintableAssessmentDocument` component provides a professional, print-optimized layout for clinical assessments from any hub. It supports printing, PDF export (via browser), and clipboard copy.

## Basic Usage

```jsx
import PrintableAssessmentDocument from '@/components/PrintableAssessmentDocument';
import { usePrintableAssessment } from '@/hooks/usePrintableAssessment';

function YourHub() {
  const [showPrintable, setShowPrintable] = useState(false);
  const [assessmentData, setAssessmentData] = useState(null);

  // Gather hub state
  const handleGenerateAssessment = () => {
    const data = usePrintableAssessment(
      {
        summary: "Patient presents with fever, hypotension, tachycardia. Lactate 3.2. Blood cultures pending.",
        recommendations: [
          "Initiate fluid resuscitation 30 mL/kg crystalloid",
          "Draw lactate, blood cultures before antibiotics",
          "Broad-spectrum antibiotics within 1 hour"
        ],
        monitoring: [
          "Lactate every 1-2h initially",
          "MAP target > 65 mmHg",
          "Urine output 0.5 mL/kg/h"
        ],
        notes: "Patient with community-acquired infection. Source: suspected UTI. Monitor for septic shock progression."
      },
      "Sepsis Bundle Assessment",
      {
        facility: "Downtown Medical Center",
        provider: "Dr. Smith, MD",
        customSections: [
          {
            label: "VITAL SIGNS",
            content: ["HR: 118", "BP: 92/56", "Temp: 39.2°C", "RR: 22"],
            highlight: true
          }
        ]
      }
    );
    setAssessmentData(data);
    setShowPrintable(true);
  };

  return (
    <div>
      <button onClick={handleGenerateAssessment}>📄 Generate Printable Assessment</button>
      
      {showPrintable && assessmentData && (
        <PrintableAssessmentDocument {...assessmentData} />
      )}
    </div>
  );
}
```

## Component Props

| Prop | Type | Description |
|------|------|-------------|
| `title` | string | Hub/assessment title (e.g., "Sepsis Assessment") |
| `timestamp` | string | ISO timestamp or formatted date |
| `facility` | string | Hospital/facility name |
| `provider` | string | Provider name/credentials |
| `sections` | array | Array of `{ label, content, highlight? }` |
| `recommendations` | array | List of recommendation strings |
| `monitoring` | array | List of monitoring items |
| `notes` | string | Additional clinical notes |

## Section Object Format

```js
{
  label: "RECOGNITION CRITERIA",
  content: ["Fever > 38°C", "Tachycardia > 100", "Hypotension"],
  // OR
  content: "Single paragraph of text...",
  highlight: true  // Optional: red underline for urgent sections
}
```

## Integration Examples

### SepsisHub Integration
```jsx
const [printData, setPrintData] = useState(null);

const handlePrint = () => {
  const data = usePrintableAssessment(
    {
      summary: `Lactate: ${lactate} · MAP: ${map} · Cultures: ${culturesDrawn ? 'drawn' : 'pending'}`,
      recommendations: [
        lactate > 4 ? "Vasopressor escalation" : "Continue fluids",
        "Repeat lactate in 2-3h"
      ],
      monitoring: ["Every 1h: lactate, MAP, UO", "q6h: CBC, BMP"]
    },
    "Sepsis Protocol Assessment"
  );
  setPrintData(data);
};

// In JSX:
<button onClick={handlePrint}>📋 Print Assessment</button>
{printData && <PrintableAssessmentDocument {...printData} />}
```

### HyperkalemiaHub Integration
```jsx
const data = usePrintableAssessment(
  {
    summary: `K: ${k} · ECG changes: ${ecgChanges}`,
    recommendations: [
      "Calcium gluconate 10-20 mL 10% IV over 2-5 min",
      "Insulin 10 units + dextrose 25g IV",
      "Sodium bicarbonate 50-100 mEq IV"
    ],
    monitoring: ["K q 4h initially", "ECG continuous", "Repeat K post-intervention"]
  },
  "Hyperkalemia Management",
  { provider: "Dr. Jones, MD" }
);
```

## Styling & Print Behavior

- **Print-optimized**: Media query `@media print` removes buttons, maintains spacing
- **Page breaks**: Sections avoid breaking across pages (`page-break-inside: avoid`)
- **Color-safe**: Black text on white, no background colors (printer-friendly)
- **Font**: System fonts for universal compatibility
- **Margins**: 0.5 inch on all sides in print

## Export Options

### 1. Browser Print (Ctrl+P / Cmd+P)
Users can print to physical printer or PDF (Chrome: "Save as PDF")

### 2. Copy to Clipboard
```jsx
import { copyAssessmentToClipboard } from '@/hooks/usePrintableAssessment';

<button onClick={() => copyAssessmentToClipboard(assessmentData)}>
  📋 Copy to Clipboard
</button>
```

### 3. Export as JSON
```jsx
import { exportAssessmentJSON } from '@/hooks/usePrintableAssessment';

<button onClick={() => exportAssessmentJSON(assessmentData)}>
  💾 Export JSON
</button>
```

## Customization

### Custom Header/Footer
Modify `PrintableAssessmentDocument` to add your hospital logo, EMR ID, or signature line:

```jsx
{/* Add after header */}
<div style={{ marginTop: '20px', fontSize: '12px' }}>
  <strong>EMR ID:</strong> {emrId} | <strong>Encounter:</strong> {encounterId}
</div>

{/* Add before footer */}
<div style={{ marginBottom: '20px', fontSize: '12px' }}>
  _________________<br/>
  Provider Signature
</div>
```

### Add Vital Signs Section
```jsx
customSections: [
  {
    label: "VITAL SIGNS",
    content: [
      `HR: ${vitals.hr} bpm`,
      `BP: ${vitals.sbp}/${vitals.dbp} mmHg`,
      `Temp: ${vitals.temp}°C`,
      `RR: ${vitals.rr}`
    ],
    highlight: vitals.temp > 38.5
  }
]
```

## Browser Compatibility
- Chrome/Edge: Full support (print to PDF)
- Safari: Full support
- Firefox: Full support
- IE11: Not recommended (modern syntax)

## Notes
- Assessment is generated at the time of printing—no server upload
- PDF creation via browser "Save as PDF" (no backend required)
- Suitable for clinical documentation, patient handouts, EMR integration
- HIPAA-safe: All data stays on local machine