<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Invoice;
use Illuminate\Support\Facades\URL;

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

            'invoice_items' => 'required|array|min:1',
            'invoice_items.*.desc' => 'required|string',
            'invoice_items.*.quantity' => 'required|integer|min:1',
            'invoice_items.*.amount' => 'required|numeric|min:0',

            'invoice_status' => 'nullable|string|max:50',

            'invoice_date' => 'required|date',
            'invoice_due_date' => 'nullable|date|after_or_equal:invoice_date',

            'invoice_notes' => 'nullable|string',
        ]);

        $validated = $this->withInvoiceTotals($validated);

        $invoice = Invoice::create($validated);
        $invoice->load('client');

        return response()->json([
            'success' => true,
            'message' => 'Invoice created successfully',
            'data' => $invoice
        ], 201);
    }

    // Get one invoice
    public function show($id)
    {
        $invoice = Invoice::with('client')->findInvoice($id);

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

    public function originalCopyLink(string $invoiceId)
    {
        $invoice = Invoice::where('invoice_id', $invoiceId)->first();

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'url' => URL::signedRoute('invoices.original-copy', [
                    'invoice' => $invoice->invoice_id,
                ]),
            ],
        ]);
    }

    public function originalCopy(string $invoiceId)
    {
        $invoice = Invoice::with('client')->where('invoice_id', $invoiceId)->first();

        if (!$invoice) {
            abort(404);
        }

        return view('invoices.original-copy', compact('invoice'));
    }

    // Update invoice
    public function update(Request $request, $id)
    {
        $invoice = Invoice::findInvoice($id);

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found'
            ], 404);
        }

        $validated = $request->validate([
            'invoice_id' => 'required|string|max:255|unique:invoices,invoice_id,' . $invoice->id,
            'client_id' => 'nullable|exists:clients,id',

            'company_name' => 'required|string|max:255',
            'client_tin' => 'nullable|string|max:100',
            'client_email' => 'nullable|email|max:255',
            'client_phone' => 'nullable|string|max:50',
            'client_address' => 'nullable|string',
            'country' => 'nullable|string|max:100',
            'paid_amount' => 'nullable|numeric|min:0',
            'remaining_amount' => 'nullable|numeric|min:0',

            'invoice_items' => 'required|array|min:1',
            'invoice_items.*.desc' => 'required|string',
            'invoice_items.*.quantity' => 'required|integer|min:1',
            'invoice_items.*.amount' => 'required|numeric|min:0',

            'invoice_status' => 'nullable|string|max:50',

            'invoice_date' => 'required|date',
            'invoice_due_date' => 'nullable|date|after_or_equal:invoice_date',

            'invoice_notes' => 'nullable|string',
        ]);

        $validated = $this->withInvoiceTotals($validated);

        $invoice->update($validated);
        $invoice->load('client');

        return response()->json([
            'success' => true,
            'message' => 'Invoice updated successfully',
            'data' => $invoice
        ]);
    }

    private function withInvoiceTotals(array $validated): array
    {
        $items = $validated['invoice_items'];
        $total = collect($items)->sum(fn (array $item) => $item['quantity'] * $item['amount']);
        $firstItem = $items[0];
        $paidAmount = min((float) ($validated['paid_amount'] ?? 0), $total);

        return array_merge($validated, [
            'item_description' => $firstItem['desc'],
            'item_quantity' => $firstItem['quantity'],
            'item_unit_price' => $firstItem['amount'],
            'item_total_price' => $firstItem['quantity'] * $firstItem['amount'],
            'invoice_total_amount' => $total,
            'paid_amount' => $paidAmount,
            'remaining_amount' => max(0, $total - $paidAmount),
        ]);
    }

    // Delete invoice
    public function destroy($id)
    {
        $invoice = Invoice::findInvoice($id);

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
