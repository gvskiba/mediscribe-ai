import { useState, useCallback } from 'react';
import { useDrugDatabase } from '@/hooks/useDrugDatabase';

export function useMedicationInteractionCheck() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { drugs, findDrug } = useDrugDatabase();

  const parseInteractions = (interactionsJson) => {
    if (!interactionsJson) return [];
    try {
      return JSON.parse(interactionsJson);
    } catch {
      return [];
    }
  };

  const checkInteractions = useCallback(
    (newDrugName, existingMedications) => {
      if (!drugs || !newDrugName || !existingMedications?.length) {
        setAlerts([]);
        return;
      }

      const newDrug = findDrug(newDrugName);
      if (!newDrug) {
        setAlerts([]);
        return;
      }

      const newInteractions = parseInteractions(newDrug.interactions_json);
      const newContraindications = newDrug.contraindications?.split(',').map(c => c.trim()) || [];
      const flaggedAlerts = [];

      // Check against existing meds
      existingMedications.forEach((existingMedName) => {
        const existingDrug = findDrug(existingMedName);
        if (!existingDrug) return;

        // Check if new drug has interaction with existing med
        const interactionMatch = newInteractions.find((interaction) => {
          const lowerInteraction = interaction.toLowerCase();
          return (
            lowerInteraction.includes(existingDrug.name.toLowerCase()) ||
            lowerInteraction.includes(existingDrug.generic_name?.toLowerCase() || '') ||
            lowerInteraction.includes(existingDrug.drug_id)
          );
        });

        if (interactionMatch) {
          flaggedAlerts.push({
            id: `${newDrug.drug_id}-${existingDrug.drug_id}-interaction`,
            type: 'interaction',
            severity: 'warning',
            title: `Interaction: ${newDrug.name} + ${existingDrug.name}`,
            description: interactionMatch,
            newDrug: newDrug.name,
            existingDrug: existingDrug.name,
          });
        }

        // Check existing drug's interactions with new drug
        const existingInteractions = parseInteractions(existingDrug.interactions_json);
        const reverseMatch = existingInteractions.find((interaction) => {
          const lowerInteraction = interaction.toLowerCase();
          return (
            lowerInteraction.includes(newDrug.name.toLowerCase()) ||
            lowerInteraction.includes(newDrug.generic_name?.toLowerCase() || '') ||
            lowerInteraction.includes(newDrug.drug_id)
          );
        });

        if (reverseMatch && !interactionMatch) {
          flaggedAlerts.push({
            id: `${existingDrug.drug_id}-${newDrug.drug_id}-interaction`,
            type: 'interaction',
            severity: 'warning',
            title: `Interaction: ${existingDrug.name} + ${newDrug.name}`,
            description: reverseMatch,
            newDrug: newDrug.name,
            existingDrug: existingDrug.name,
          });
        }
      });

      // Check contraindications (common patterns)
      if (newContraindications.length) {
        const hasConflict = existingMedications.some((existingMedName) => {
          const lowerMedName = existingMedName.toLowerCase();
          return newContraindications.some(
            (contraind) => contraind.toLowerCase().includes(lowerMedName) || lowerMedName.includes(contraind.toLowerCase())
          );
        });

        if (hasConflict) {
          flaggedAlerts.push({
            id: `${newDrug.drug_id}-contraindication`,
            type: 'contraindication',
            severity: 'critical',
            title: `Contraindication: ${newDrug.name}`,
            description: newContraindications.join('; '),
            newDrug: newDrug.name,
          });
        }
      }

      // Check ISMP high-alert flag
      if (newDrug.ismp_high_alert) {
        flaggedAlerts.push({
          id: `${newDrug.drug_id}-high-alert`,
          type: 'high-alert',
          severity: 'critical',
          title: `High-Alert Medication: ${newDrug.name}`,
          description: 'ISMP flagged high-risk medication. Verify dosing and route carefully.',
          newDrug: newDrug.name,
        });
      }

      setAlerts(flaggedAlerts);
    },
    [drugs, findDrug]
  );

  const dismissAlert = useCallback((alertId) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return { alerts, checkInteractions, dismissAlert, clearAlerts, loading };
}