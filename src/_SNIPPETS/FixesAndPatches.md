# Tab 6 · Fixes & Patches

Copy-paste solutions for common UI/UX issues in clinical apps.

---

## 1. STYLING DRIFT — Reset Component Margins

**Problem**: Components have inconsistent spacing after multiple edits.

**Fix**: Add this reset class to your main wrapper:

```jsx
<div className="fix-reset">
  {/* Your content */}
</div>
```

**CSS** (add to index.css or inline style):

```css
.fix-reset {
  margin: 0;
  padding: 0;
}

.fix-reset * {
  margin: 0;
  padding: 0;
}

.fix-reset > * + * {
  margin-top: 1rem; /* Consistent spacing between children */
}
```

---

## 2. DARK MODE COLOR CONSISTENCY

**Problem**: Some elements show light colors in dark mode.

**Quick fix**: Replace all inline colors with CSS vars:

```jsx
// ❌ BEFORE
<div style={{ color: "#333", background: "#fff" }}>Text</div>

// ✅ AFTER
<div style={{ color: "var(--txt)", background: "var(--bg)" }}>Text</div>
```

**Color variables** (add to index.css `:root`):

```css
:root {
  --bg: #050f1e;
  --panel: #081628;
  --card: #0b1e36;
  --up: #0e2544;
  --bd: #1a3555;
  --txt: #e8f0fe;
  --txt2: #8aaccc;
  --txt3: #4a6a8a;
  --teal: #00e5c0;
  --coral: #ff6b6b;
}
```

---

## 3. KEYBOARD NAVIGATION — Tab Focus & Enter

**Problem**: Buttons don't respond to keyboard or focus is invisible.

**Fix**: Add to any button-heavy component:

```jsx
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.target.tagName === "BUTTON") {
      e.target.click();
    }
    if (e.key === "Escape") {
      // Close modals, panels, etc.
      setIsOpen(false);
    }
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, []);
```

**CSS for focus visibility**:

```css
button:focus,
input:focus,
textarea:focus,
select:focus {
  outline: 2px solid var(--teal);
  outline-offset: 2px;
}
```

**Accessible button template**:

```jsx
<button
  className="btn"
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  }}
  aria-label="Button description"
>
  Label
</button>
```

---

## 4. MOBILE RESPONSIVENESS — Flex & Grid Breakpoints

**Problem**: Layout breaks on mobile (< 768px).

**Fix**: Use responsive classes:

```jsx
<div className="responsive-grid">
  <div className="card">Card 1</div>
  <div className="card">Card 2</div>
  <div className="card">Card 3</div>
</div>
```

**CSS**:

```css
.responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

@media (max-width: 768px) {
  .responsive-grid {
    grid-template-columns: 1fr;
  }

  .card {
    padding: 1rem !important;
    font-size: 14px !important;
  }

  button {
    padding: 0.75rem 1rem !important;
  }

  .panel {
    width: 100% !important;
    height: 60vh !important;
  }
}
```

**Mobile-first approach** (recommended):

```css
/* Mobile first */
.container {
  width: 100%;
  padding: 1rem;
}

/* Tablet up */
@media (min-width: 768px) {
  .container {
    width: 90%;
    padding: 2rem;
  }
}

/* Desktop up */
@media (min-width: 1024px) {
  .container {
    width: 80%;
    max-width: 1200px;
  }
}
```

---

## 5. SIDEBAR OVERFLOW ON MOBILE

**Problem**: Fixed sidebars push content off-screen on mobile.

**Fix**:

```jsx
const [sidebarOpen, setSidebarOpen] = useState(false);

return (
  <div className="app-layout">
    <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
      {/* Sidebar content */}
    </aside>
    <main className="content">
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="menu-toggle">
        ☰
      </button>
      {/* Main content */}
    </main>
  </div>
);
```

**CSS**:

```css
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -100%;
    top: 0;
    width: 70%;
    height: 100vh;
    transition: left 0.3s;
    z-index: 1000;
  }

  .sidebar.open {
    left: 0;
  }

  .menu-toggle {
    display: block;
    margin-bottom: 1rem;
  }
}

@media (min-width: 769px) {
  .sidebar {
    position: relative;
    left: 0;
    width: 250px;
  }

  .menu-toggle {
    display: none;
  }
}
```

---

## 6. INPUT FIELD FOCUS STATES

**Problem**: Input fields don't show clear focus state.

**Fix**:

```jsx
<input
  type="text"
  className="field-input"
  placeholder="Enter value…"
  onFocus={(e) => e.target.parentElement.classList.add("focused")}
  onBlur={(e) => e.target.parentElement.classList.remove("focused")}
/>
```

**CSS**:

```css
.field-wrapper {
  position: relative;
  margin-bottom: 1rem;
}

.field-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--bd);
  border-radius: 6px;
  background: var(--up);
  color: var(--txt);
  transition: all 0.2s;
}

.field-input:focus {
  border-color: var(--teal);
  box-shadow: 0 0 0 3px rgba(0, 229, 192, 0.1);
  outline: none;
}

.field-wrapper.focused .field-input {
  border-color: var(--teal);
}

.field-label {
  display: block;
  font-size: 0.875rem;
  color: var(--txt3);
  margin-bottom: 0.5rem;
  font-weight: 500;
}
```

---

## 7. SCROLLBAR STYLING

**Problem**: Default scrollbar looks broken in dark theme.

**Fix**:

```css
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--bd);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--txt3);
}
```

---

## 8. TEXTAREA AUTO-EXPAND

**Problem**: Textarea has fixed height, text overflows.

**Fix**:

```jsx
<textarea
  value={text}
  onChange={(e) => {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  }}
  style={{ resize: "none", overflowY: "hidden" }}
/>
```

---

## 9. BUTTON DISABLED STATE

**Problem**: Disabled buttons look the same as active buttons.

**Fix**:

```css
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--up) !important;
  border-color: var(--bd) !important;
  color: var(--txt4) !important;
}

button:disabled:hover {
  transform: none;
  filter: none;
}
```

---

## 10. MODAL/OVERLAY BACKDROP

**Problem**: Modal doesn't block interaction with background.

**Fix**:

```jsx
{isOpen && (
  <>
    <div
      className="modal-backdrop"
      onClick={() => setIsOpen(false)}
      role="presentation"
    />
    <div className="modal">
      {/* Content */}
    </div>
  </>
)}
```

**CSS**:

```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(5, 15, 30, 0.8);
  backdrop-filter: blur(2px);
  z-index: 999;
}

.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--panel);
  border: 1px solid var(--bd);
  border-radius: 12px;
  padding: 2rem;
  z-index: 1000;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
}
```

---

## Quick Reference

| Issue | File | Solution |
|-------|------|----------|
| Colors wrong | `index.css` | Use CSS vars, not hardcoded hex |
| Mobile broken | Component | Add `@media` queries |
| Focus invisible | Button/Input | Add `outline` on `:focus` |
| Sidebar stuck | Layout | Use `position: fixed` + toggle state |
| Text overflow | Component | Add `overflow-y: auto`, `text-overflow: ellipsis` |
| Spacing weird | Component | Use `.fix-reset` or consistent gap/margin |