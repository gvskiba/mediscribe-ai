# Add a Section — Quick Copy/Paste

When you need to **bolt a new section box onto an existing page** without rewriting everything else.

## Copy This Exact Block

Paste this into your page JSX wherever you want the new section to appear (usually inside `.content` or main):

```jsx
<div className="section-box">
  <div className="sec-header">
    <span className="sec-icon">[ICON]</span>
    <div>
      <div className="sec-title">[TITLE]</div>
      <div className="sec-subtitle">[SUBTITLE]</div>
    </div>
    <button className="btn-ghost ml-auto">[ACTION]</button>
  </div>
  <div className="grid-2 mb-8">
    <div className="field">
      <label className="field-label">[LABEL]</label>
      <input type="text" className="field-input" placeholder="[PLACEHOLDER]" />
    </div>
    <div className="field">
      <label className="field-label">[LABEL]</label>
      <select className="field-select" defaultValue="">
        <option value="">— Select —</option>
        <option>[OPTION]</option>
      </select>
    </div>
    <div className="field col-full">
      <label className="field-label">[LABEL]</label>
      <textarea className="field-textarea" placeholder="[PLACEHOLDER]" />
    </div>
  </div>
  <div className="flex gap-6" style={{ flexWrap: "wrap" }}>
    <div className="chip">[CHIP]</div>
  </div>
</div>
```

## Fields You Can Use

- **Text Input**: `<input type="text" className="field-input" placeholder="…" />`
- **Number**: `<input type="number" className="field-input" placeholder="…" />`
- **Select**: `<select className="field-select"><option>…</option></select>`
- **Textarea**: `<textarea className="field-textarea" placeholder="…"></textarea>`
- **Checkbox**: `<input type="checkbox" />` (style manually or use `.chip`)

## Grid Layouts

- **2 columns**: `<div className="grid-2">…</div>`
- **3 columns**: `<div className="grid-3">…</div>`
- **4 columns**: `<div className="grid-4">…</div>`
- **Full width**: Add `col-full` class to a field

## Button Variations

- **Ghost**: `<button className="btn-ghost">Label</button>`
- **Primary**: `<button className="btn-primary">Label</button>`
- **Coral**: `<button className="btn-coral">Label</button>`

## Example: Add Vitals Section

```jsx
<div className="section-box">
  <div className="sec-header">
    <span className="sec-icon">📈</span>
    <div>
      <div className="sec-title">Vital Signs</div>
      <div className="sec-subtitle">Record patient vitals</div>
    </div>
    <button className="btn-ghost ml-auto">Clear</button>
  </div>
  <div className="grid-2 mb-8">
    <div className="field">
      <label className="field-label">Blood Pressure</label>
      <input type="text" className="field-input" placeholder="e.g., 120/80" />
    </div>
    <div className="field">
      <label className="field-label">Heart Rate</label>
      <input type="number" className="field-input" placeholder="bpm" />
    </div>
    <div className="field">
      <label className="field-label">Temperature</label>
      <input type="number" className="field-input" placeholder="°F" />
    </div>
    <div className="field">
      <label className="field-label">SpO₂</label>
      <input type="number" className="field-input" placeholder="%" />
    </div>
  </div>
</div>
```

## That's It!

No rewrites. Just copy, paste, customize the [BRACKETS], and you're done.