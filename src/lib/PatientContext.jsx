import React, { createContext, useContext, useState } from 'react';

const PatientContext = createContext(null);

export const PatientProvider = ({ children }) => {
  const [activePatient, setActivePatient] = useState(null);

  const selectPatient = (patient) => {
    setActivePatient(patient);
  };

  const clearPatient = () => {
    setActivePatient(null);
  };

  return (
    <PatientContext.Provider value={{ activePatient, selectPatient, clearPatient }}>
      {children}
    </PatientContext.Provider>
  );
};

export const usePatient = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatient must be used within PatientProvider');
  }
  return context;
};