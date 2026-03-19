import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Verify user is authenticated
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all medications
        const allMeds = await base44.entities.Medication.list();
        
        // Filter to medications that need categorization (category is 'other' or missing)
        const medsToCategory = allMeds.filter(med => 
            !med.category || med.category === 'other'
        );

        if (medsToCategory.length === 0) {
            return Response.json({
                status: 'success',
                message: 'All medications are already categorized.',
                processed: 0,
                updated: 0
            });
        }

        const categories = ['anticoag', 'cardiac', 'psych', 'analgesic', 'abx', 'gi', 'other'];
        let updated = 0;
        const updates = [];

        for (const med of medsToCategory) {
            const prompt = `You are a clinical pharmacist. Categorize this medication into ONE of these categories: ${categories.join(', ')}.

Medication Name: ${med.name || ''}
Generic Name: ${med.brand || ''}
Drug Class: ${med.drugClass || ''}
Indications: ${med.indications || 'Not specified'}

Return ONLY a valid JSON object with exactly this format:
{"category": "categoryname"}

Choose the MOST appropriate category. If unsure, use 'other'.`;

            try {
                const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
                    prompt: prompt,
                    add_context_from_internet: true,
                    model: 'gemini_3_pro',
                    response_json_schema: {
                        type: "object",
                        properties: {
                            category: {
                                type: "string",
                                enum: categories
                            }
                        },
                        required: ["category"]
                    }
                });

                if (result && result.category && result.category !== med.category) {
                    updates.push(
                        base44.asServiceRole.entities.Medication.update(med.id, {
                            category: result.category
                        })
                    );
                    updated++;
                }
            } catch (llmError) {
                console.error(`Error categorizing medication ${med.id} (${med.name}):`, llmError.message);
                // Continue to next medication if LLM fails
            }
        }

        // Execute all updates in parallel
        if (updates.length > 0) {
            await Promise.all(updates);
        }

        return Response.json({
            status: 'success',
            message: `Processed ${medsToCategory.length} uncategorized medications.`,
            processed: medsToCategory.length,
            updated: updated
        });

    } catch (error) {
        console.error('Error in categorizeMedications:', error);
        return Response.json({ 
            error: error.message,
            status: 'error'
        }, { status: 500 });
    }
});