<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Invoice;

class InvoiceController extends Controller
{
    // Get all invoices
    public function index()
    {
        $invoices = Invoice::with('client')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $invoices
        ]);
    }

    // Create invoice
    public function store(Request $request)
    {
        $validated = $request->validate([
            'invoice_id' => 'required|string|max:255|unique:invoices,invoice_id',
            'client_id' => 'nullable|exists:clients,id',

            'company_name' => 'required|string|max:255',
            'client_tin' => 'nullable|string|max:100',
            'client_email' => 'nullable|email|max:255',
            'client_phone' => 'nullable|string|max:50',
            'client_address' => 'nullable|string',
            'country' => 'nullable|string|max:100',

            'item_description' => 'required|string',
            'item_quantity' => 'required|integer|min:1',
            'item_unit_price' => 'required|numeric|min:0',
            'item_total_price' => 'required|numeric|min:0',
            'invoice_total_amount' => 'required|numeric|min:0',

            'invoice_status' => 'nullable|string|max:50',

            'invoice_date' => 'required|date',
            'invoice_due_date' => 'nullable|date|after_or_equal:invoice_date',

            'invoice_notes' => 'nullable|string',
        ]);

        $invoice = Invoice::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Invoice created successfully',
            'data' => $invoice
        ], 201);
    }

    // Get one invoice
    public function show($id)
    {
        $invoice = Invoice::with('client')->find($id);

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $invoice
        ]);
    }

    // Update invoice
    public function update(Request $request, $id)
    {
        $invoice = Invoice::find($id);

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found'
            ], 404);
        }

        $validated = $request->validate([
            'invoice_id' => 'required|string|max:255|unique:invoices,invoice_id,' . $id,
            'client_id' => 'nullable|exists:clients,id',

            'company_name' => 'required|string|max:255',
            'client_tin' => 'nullable|string|max:100',
            'client_email' => 'nullable|email|max:255',
            'client_phone' => 'nullable|string|max:50',
            'client_address' => 'nullable|string',
            'country' => 'nullable|string|max:100',
            'paid_amount' => 'nullable|numeric|min:0',
            'remaining_amount' => 'nullable|numeric|min:0',

            'item_description' => 'required|string',
            'item_quantity' => 'required|integer|min:1',
            'item_unit_price' => 'required|numeric|min:0',
            'item_total_price' => 'required|numeric|min:0',
            'invoice_total_amount' => 'required|numeric|min:0',

            'invoice_status' => 'nullable|string|max:50',

            'invoice_date' => 'required|date',
            'invoice_due_date' => 'nullable|date|after_or_equal:invoice_date',

            'invoice_notes' => 'nullable|string',
        ]);

        $invoice->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Invoice updated successfully',
            'data' => $invoice
        ]);
    }

    // Delete invoice
    public function destroy($id)
    {
        $invoice = Invoice::find($id);

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found'
            ], 404);
        }

        $invoice->delete();

        return response()->json([
            'success' => true,
            'message' => 'Invoice deleted successfully'
        ]);
    }
}
