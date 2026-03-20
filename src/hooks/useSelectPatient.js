import { usePatient } from '@/lib/PatientContext';

export const useSelectPatient = () => {
  const { selectPatient } = usePatient();

  return (patient) => {
    selectPatient(patient);
  };
};