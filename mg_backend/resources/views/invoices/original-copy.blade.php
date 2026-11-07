<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $invoice->invoice_id }} - Verified Original Invoice</title>
    <style>
        :root { color-scheme: light; font-family: Arial, Helvetica, sans-serif; color: #171717; }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 32px 16px; background: #f5f5f5; }
        .page { width: min(100%, 800px); margin: 0 auto; padding: 42px; background: #fff; box-shadow: 0 8px 36px #00000012; }
        header { display: flex; justify-content: space-between; gap: 24px; padding-bottom: 24px; border-bottom: 2px solid #171717; }
        h1, h2, p { margin-top: 0; }
        h1 { margin-bottom: 6px; font-size: 26px; letter-spacing: 1px; }
        h2 { margin-bottom: 8px; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; }
        p { margin-bottom: 5px; font-size: 13px; line-height: 1.5; }
        .muted, .label { color: #737373; }
        .label { margin-bottom: 8px; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; }
        .number { text-align: right; }
        .verified { display: inline-block; margin-top: 8px; padding: 5px 9px; border: 1px solid #15803d; border-radius: 999px; color: #15803d; font-size: 10px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; }
        .meta, .company-details { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; padding: 26px 0; }
        table { width: 100%; margin-top: 4px; border-collapse: collapse; }
        th { padding: 10px; background: #f5f5f5; color: #737373; font-size: 10px; letter-spacing: .8px; text-align: left; text-transform: uppercase; }
        td { padding: 11px 10px; border-bottom: 1px solid #e5e5e5; font-size: 12px; }
        th:not(:first-child), td:not(:first-child) { text-align: right; }
        .total { display: flex; justify-content: flex-end; padding: 18px 10px; border-bottom: 1px solid #171717; }
        .total strong { min-width: 190px; display: flex; justify-content: space-between; font-size: 16px; }
        .company-details { padding-bottom: 12px; }
        .signature { display: grid; grid-template-columns: 1fr 1fr; gap: 36px; margin-top: 26px; padding-top: 22px; border-top: 1px solid #d4d4d4; }
        .signature-line { margin-top: 48px; padding-top: 6px; border-top: 1px solid #171717; color: #737373; font-size: 10px; }
        footer { display: flex; justify-content: space-between; gap: 16px; margin-top: 28px; padding-top: 10px; border-top: 1px solid #e5e5e5; color: #737373; font-size: 10px; }
        .print { margin: 0 auto 16px; display: block; padding: 10px 16px; border: 0; border-radius: 8px; background: #171717; color: #fff; cursor: pointer; }
        @media (max-width: 600px) {
            body { padding: 0; background: #fff; }
            .page { padding: 24px 18px; box-shadow: none; }
            header { flex-direction: column; }
            .number { text-align: left; }
            .meta, .company-details { gap: 18px; }
        }
        @media print {
            @page { size: A4; margin: 16mm; }
            body { padding: 0; background: #fff; }
            .page { width: 100%; padding: 0; box-shadow: none; }
            .print { display: none; }
        }
    </style>
</head>
<body>
    <button class="print" type="button" onclick="window.print()">Print or save original copy</button>
    <main class="page">
        <header>
            <div>
                <h1>MAKEZY GROUP</h1>
                <p class="muted">Dar es Salaam, Tanzania</p>
                <p class="muted">info@makezygroup.co.tz · +255 758 018 277</p>
            </div>
            <div class="number">
                <h1>INVOICE</h1>
                <p><strong>{{ $invoice->invoice_id }}</strong></p>
                <span class="verified">Verified original copy</span>
            </div>
        </header>

        <section class="meta">
            <div>
                <div class="label">Billed to</div>
                <p><strong>{{ $invoice->company_name }}</strong></p>
                <p>{{ $invoice->client?->client_name ?? '' }}</p>
                <p>{{ $invoice->client_address }}</p>
                <p>{{ $invoice->country }}</p>
                <p>{{ $invoice->client_email }} {{ $invoice->client_phone }}</p>
                <p>TIN: {{ $invoice->client_tin ?: 'Not provided' }}</p>
            </div>
            <div>
                <div class="label">Invoice details</div>
                <p>Issue date: <strong>{{ $invoice->invoice_date?->format('d M Y') }}</strong></p>
                <p>Due date: <strong>{{ $invoice->invoice_due_date?->format('d M Y') ?: 'Not specified' }}</strong></p>
                <p>Payment status: <strong>{{ ucfirst($invoice->invoice_status) }}</strong></p>
            </div>
        </section>

        @php
            $items = $invoice->invoice_items ?: [[
                'desc' => $invoice->item_description,
                'quantity' => $invoice->item_quantity,
                'amount' => $invoice->item_unit_price,
            ]];
        @endphp
        <table>
            <thead>
                <tr><th>Description</th><th>Quantity</th><th>Unit price</th><th>Amount</th></tr>
            </thead>
            <tbody>
                @foreach ($items as $item)
                    <tr>
                        <td>{{ $item['desc'] ?? 'Service' }}</td>
                        <td>{{ $item['quantity'] ?? 1 }}</td>
                        <td>Tsh {{ number_format((float) ($item['amount'] ?? 0), 0) }}</td>
                        <td>Tsh {{ number_format((float) ($item['quantity'] ?? 1) * (float) ($item['amount'] ?? 0), 0) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
        <div class="total">
            <strong><span>Total</span><span>Tsh {{ number_format((float) $invoice->invoice_total_amount, 0) }}</span></strong>
        </div>

        <section class="company-details">
            <div>
                <h2>Company details</h2>
                <p>www.makezygroup.co.tz</p>
                <p>P.O. Box 18124, Dar es Salaam, Tanzania</p>
                <p>TIN: 190172554</p>
            </div>
            <div>
                <h2>Bank details</h2>
                <p>SELCOM LIPA | YAS LIPA</p>
                <p>Account name: RASHID SAID RASHIDI</p>
                <p>Account number: 7005-9500 | 4536-3645</p>
                <p>Branch: Tanzania</p>
            </div>
        </section>

        @if ($invoice->invoice_notes)
            <p><strong>Notes:</strong> {{ $invoice->invoice_notes }}</p>
        @endif
        <section class="signature">
            <div>
                <h2>Authorized signature</h2>
                <div class="signature-line">Name and signature</div>
            </div>
            <div>
                <h2>Company stamp</h2>
                <div class="signature-line">Stamp</div>
            </div>
        </section>
        <footer>
            <span>Thank you for your business.</span>
            <span>Verified original · {{ $invoice->invoice_id }}</span>
        </footer>
    </main>
</body>
</html>
