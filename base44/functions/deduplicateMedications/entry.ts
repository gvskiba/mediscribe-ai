import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all medications using service role
    const allMeds = await base44.asServiceRole.entities.Medication.list();
    
    if (!allMeds || allMeds.length === 0) {
      return Response.json({ message: 'No medications found', deletedCount: 0, totalRecords: 0 });
    }

    // Group medications by med_id
    const medsByMedId = {};
    allMeds.forEach(med => {
      const medId = med.data?.med_id || med.med_id;
      if (!medsByMedId[medId]) {
        medsByMedId[medId] = [];
      }
      medsByMedId[medId].push(med);
    });

    // Identify and delete duplicates, keeping the first record of each med_id
    let deletedCount = 0;
    const duplicatesByMedId = {};

    for (const medId in medsByMedId) {
      const records = medsByMedId[medId];
      if (records.length > 1) {
        duplicatesByMedId[medId] = records.length;
        // Delete all but the first record
        for (let i = 1; i < records.length; i++) {
          await base44.asServiceRole.entities.Medication.delete(records[i].id);
          deletedCount++;
        }
      }
    }

    // Get count of remaining unique medications
    const remainingMeds = await base44.asServiceRole.entities.Medication.list();

    return Response.json({
      success: true,
      deletedCount,
      totalRecords: allMeds.length,
      uniqueMedications: Object.keys(medsByMedId).length,
      remainingCount: remainingMeds.length,
      duplicatesRemoved: duplicatesByMedId,
      message: `Removed ${deletedCount} duplicate medication records. ${remainingMeds.length} unique medications remain.`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});