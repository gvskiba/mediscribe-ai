/* Discharge Summary Tab Styles */

.discharge-summary-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #050f1e;
  font-family: "DM Sans", -apple-system, BlinkMacSystemFont, sans-serif;
  color: #c8ddf0;
}

.discharge-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 13px;
  flex: 1;
  padding: 16px;
  overflow: hidden;
}

/* Summary Panel */
.ds-summary-panel {
  display: flex;
  flex-direction: column;
  background: #0b1d35;
  border: 1px solid #1e3a5f;
  border-radius: 12px;
  overflow: hidden;
}

.ds-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #1e3a5f;
  background: rgba(0, 212, 188, 0.05);
}

.ds-panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #e8f4ff;
  margin: 0;
}

.ds-save-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(0, 212, 188, 0.15);
  border: 1px solid #00d4bc;
  border-radius: 6px;
  color: #00d4bc;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.ds-save-btn:hover {
  background: rgba(0, 212, 188, 0.25);
  transform: translateY(-1px);
}

.ds-sections-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ds-sections-scroll::-webkit-scrollbar {
  width: 6px;
}

.ds-sections-scroll::-webkit-scrollbar-track {
  background: #0e2340;
}

.ds-sections-scroll::-webkit-scrollbar-thumb {
  background: #2a4d72;
  border-radius: 3px;
}

.ds-section {
  background: #0e2340;
  border: 1px solid #1e3a5f;
  border-radius: 8px;
  padding: 12px;
}

.ds-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.ds-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #e8f4ff;
  margin: 0;
}

.ds-ai-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(155, 109, 255, 0.15);
  border: 1px solid #9b6dff;
  border-radius: 4px;
  color: #9b6dff;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.ds-ai-btn:hover:not(:disabled) {
  background: rgba(155, 109, 255, 0.25);
}

.ds-ai-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ds-fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ds-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ds-label {
  font-size: 11px;
  font-weight: 500;
  color: #4a7299;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.ds-input,
.ds-textarea,
.ds-select {
  padding: 8px 10px;
  background: #162d4f;
  border: 1px solid #1e3a5f;
  border-radius: 6px;
  color: #c8ddf0;
  font-family: inherit;
  font-size: 12px;
  transition: all 0.2s;
}

.ds-input:focus,
.ds-textarea:focus,
.ds-select:focus {
  border-color: #00d4bc;
  outline: none;
  box-shadow: 0 0 0 2px rgba(0, 212, 188, 0.1);
}

.ds-textarea {
  resize: vertical;
  font-family: inherit;
}

/* Actions Panel */
.ds-actions-panel {
  display: flex;
  flex-direction: column;
  background: #0b1d35;
  border: 1px solid #1e3a5f;
  border-radius: 12px;
  overflow: hidden;
  gap: 12px;
  padding: 12px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.ds-actions-panel::-webkit-scrollbar {
  width: 6px;
}

.ds-actions-panel::-webkit-scrollbar-track {
  background: #0e2340;
}

.ds-actions-panel::-webkit-scrollbar-thumb {
  background: #2a4d72;
  border-radius: 3px;
}

.ds-section-compact {
  background: #0e2340;
  border: 1px solid #1e3a5f;
  border-radius: 8px;
  padding: 10px;
}

.ds-section-title-small {
  font-size: 12px;
  font-weight: 600;
  color: #e8f4ff;
  margin: 0 0 8px 0;
}

.ds-settings {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.ds-setting-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ds-setting-label {
  font-size: 10px;
  font-weight: 500;
  color: #4a7299;
  text-transform: uppercase;
}

.ds-select-compact {
  padding: 6px 8px;
  background: #162d4f;
  border: 1px solid #1e3a5f;
  border-radius: 4px;
  color: #c8ddf0;
  font-size: 11px;
}

.ds-generate-btn {
  width: 100%;
  padding: 8px;
  background: linear-gradient(135deg, #9b6dff, #7c5fef);
  border: none;
  border-radius: 6px;
  color: white;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.ds-generate-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(155, 109, 255, 0.3);
}

.ds-generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ds-preview-section {
  flex: 1;
  background: white;
  border-radius: 8px;
  padding: 12px;
  overflow-y: auto;
  min-height: 300px;
}

.ds-preview-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 12px;
  text-align: center;
}

.ds-action-buttons {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ds-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  background: #162d4f;
  border: 1px solid #1e3a5f;
  border-radius: 6px;
  color: #c8ddf0;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.ds-action-btn:hover {
  background: #1e3a5f;
  color: #00d4bc;
  border-color: #00d4bc;
}

.ds-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ds-checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #c8ddf0;
  cursor: pointer;
}

.ds-checkbox {
  width: 14px;
  height: 14px;
  cursor: pointer;
}

.ds-sign-btn {
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, #00d4bc, #00a896);
  border: none;
  border-radius: 6px;
  color: #0e2340;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: auto;
}

.ds-sign-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 212, 188, 0.3);
}

/* Patient Sheet Styles */
.patient-sheet {
  font-family: "DM Sans", sans-serif;
  color: #1a2332;
  line-height: 1.6;
}

.ps-header {
  border-bottom: 2px solid #dde6f0;
  padding-bottom: 12px;
  margin-bottom: 16px;
}

.ps-hospital-info {
  margin-bottom: 8px;
}

.ps-hospital-name {
  font-size: 18px;
  font-weight: 700;
  color: #050f1e;
  margin: 0 0 4px 0;
}

.ps-subtitle {
  font-size: 12px;
  color: #64748b;
  margin: 0;
}

.ps-patient-info {
  font-size: 11px;
  color: #64748b;
  line-height: 1.4;
}

.ps-date,
.ps-provider {
  margin: 2px 0;
}

.ps-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ps-section {
  padding: 12px;
  border-left: 3px solid #00a896;
  background: #f8fafc;
  border-radius: 4px;
}

.ps-section-title {
  font-size: 14px;
  font-weight: 700;
  color: #050f1e;
  margin: 0 0 8px 0;
}

.ps-text {
  font-size: 12px;
  color: #1a2332;
  margin: 0;
}

.ps-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ps-list-item {
  font-size: 12px;
  color: #1a2332;
  padding-left: 12px;
  position: relative;
}

.ps-list-item:before {
  content: "•";
  position: absolute;
  left: 0;
  color: #00a896;
  font-weight: bold;
}

.ps-red-alert {
  border-left-color: #dc2626;
  background: #fee2e2;
  padding: 12px;
  border-radius: 6px;
}

.ps-section-title-alert {
  font-size: 13px;
  font-weight: 700;
  color: #991b1b;
  margin: 0 0 8px 0;
}

.ps-alert-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ps-alert-item {
  font-size: 12px;
  color: #7f1d1d;
  font-weight: 600;
  padding-left: 12px;
  position: relative;
}

.ps-alert-item:before {
  content: "⚠";
  position: absolute;
  left: 0;
}

.ps-amber-alert {
  border-left-color: #f59e0b;
  background: #fef3c7;
}

.ps-tips {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ps-tip {
  font-size: 12px;
  color: #1a2332;
  padding: 8px;
  background: white;
  border-left: 2px solid #fbbf24;
  border-radius: 4px;
  padding-left: 10px;
}

.ps-contacts {
  background: #f0fdf4;
  border-left-color: #16a34a;
}

.ps-contact-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
}

.ps-contact-number {
  font-weight: 700;
  color: #16a34a;
  font-size: 13px;
}

.ps-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #dde6f0;
  text-align: center;
}

.ps-footer-text {
  font-size: 10px;
  color: #64748b;
  margin: 0 0 8px 0;
}

.ps-signature-line {
  font-size: 11px;
  color: #1a2332;
  margin-top: 16px;
  border-top: 1px solid #1a2332;
  padding-top: 4px;
}

/* Navigation Bar */
.discharge-nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid #1e3a5f;
  background: #0b1d35;
  height: auto;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.gap-2 {
  gap: 8px;
}