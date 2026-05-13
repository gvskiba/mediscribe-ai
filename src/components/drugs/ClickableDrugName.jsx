import { useState } from 'react';
import DrugInfoModal from './DrugInfoModal';
import { useDrugDatabase } from '@/hooks/useDrugDatabase';

export default function ClickableDrugName({ drugName, children }) {
  const [showModal, setShowModal] = useState(false);
  const { findDrug, loading } = useDrugDatabase();

  const drug = findDrug(drugName);
  const isClickable = !loading && drug;

  return (
    <>
      <span
        onClick={() => isClickable && setShowModal(true)}
        style={{
          cursor: isClickable ? 'pointer' : 'default',
          textDecoration: isClickable ? 'underline dotted #3b9eff' : 'none',
          color: isClickable ? '#3b9eff' : 'inherit',
          transition: 'all .12s',
          fontWeight: isClickable ? 600 : 'inherit',
        }}
        title={isClickable ? 'Click to view dosing guidelines' : ''}
        onMouseEnter={(e) => {
          if (isClickable) {
            e.currentTarget.style.color = '#00e5c0';
            e.currentTarget.style.textDecoration = 'underline solid #00e5c0';
          }
        }}
        onMouseLeave={(e) => {
          if (isClickable) {
            e.currentTarget.style.color = '#3b9eff';
            e.currentTarget.style.textDecoration = 'underline dotted #3b9eff';
          }
        }}
      >
        {children || drugName}
      </span>
      {showModal && drug && (
        <DrugInfoModal drug={drug} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}