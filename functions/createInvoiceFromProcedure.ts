import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { procedureId, cptCodes, patientName, patientId, providerName, facility } = await req.json();

    if (!procedureId || !cptCodes || !Array.isArray(cptCodes)) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch the procedure log
    const procedure = await base44.entities.ProcedureLog.read(procedureId);

    if (!procedure) {
      return Response.json({ error: 'Procedure not found' }, { status: 404 });
    }

    // Calculate totals
    const cptDetails = cptCodes.map(code => ({
      code: code.code,
      description: code.procedureName || code.description || '',
      units: code.units || 1,
      rvu: code.rvu || 0,
      base_charge: (code.rvu || 0) * (code.conversionFactor || 50), // Base conversion factor
    }));

    const totalRvu = cptDetails.reduce((sum, item) => sum + (item.rvu * item.units), 0);
    const totalCharge = cptDetails.reduce((sum, item) => sum + item.base_charge, 0);

    // Generate invoice number
    const timestamp = Date.now().toString().slice(-6);
    const invoiceNumber = `INV-${new Date().getFullYear()}-${timestamp}`;

    // Create invoice
    const invoice = await base44.entities.Invoice.create({
      invoice_number: invoiceNumber,
      patient_name: patientName || procedure.patient_name || 'Unknown',
      patient_id: patientId || procedure.patient_id || '',
      procedure_date: procedure.date_performed || new Date().toISOString().split('T')[0],
      cpt_codes: cptDetails,
      total_rvu: totalRvu,
      total_charge: totalCharge,
      provider_name: providerName || procedure.operator || user.full_name,
      facility: facility || 'Emergency Department',
      status: 'draft',
      source_procedure_id: procedureId,
    });

    return Response.json({
      success: true,
      invoice: invoice,
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});