// QuickNoteSchemas.js — Re-exports MDM_SCHEMA and DISP_SCHEMA from QuickNotePrompts
// This exists solely to allow QuickNote.jsx (which is too large to edit directly)
// to import these schemas without changing the prompts file exports.

export { MDM_SCHEMA, DISP_SCHEMA } from "./QuickNotePrompts";