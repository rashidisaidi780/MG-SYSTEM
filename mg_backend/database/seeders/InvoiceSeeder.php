<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Invoice;

class InvoiceSeeder extends Seeder
{
    public function run(): void
    {
        Invoice::create([
            'invoice_id' => 'INV001',
            'client_id' => 1,
            'company_name' => 'ABC Company Ltd',
            'client_tin' => '123456789',
            'client_email' => 'info@abccompany.com',
            'client_phone' => '0712345678',
            'client_address' => 'Dar es Salaam',
            'country' => 'Tanzania',
            'paid_amount' => 0,
            'remaining_amount' => 150000000,
            'item_description' => 'Office Building Construction',
            'item_quantity' => 1,
            'item_unit_price' => 150000000,
            'item_total_price' => 150000000,

            'invoice_total_amount' => 150000000,

            'invoice_status' => 'unpaid',

            'invoice_date' => '2026-09-01',
            'invoice_due_date' => '2026-09-30',

            'invoice_notes' => 'Payment should be made before the due date.',
        ]);

        Invoice::create([
            'invoice_id' => 'INV002',
            'client_id' => 2,
            'company_name' => 'XYZ Enterprises',
            'client_tin' => '987654321',
            'client_email' => 'info@xyz.com',
            'client_phone' => '0788123456',
            'client_address' => 'Arusha',
            'country' => 'Tanzania',

            'item_description' => 'IT System Development',
            'item_quantity' => 1,
            'item_unit_price' => 5000000,
            'item_total_price' => 5000000,
            'paid_amount' => 5000000,
            'remaining_amount' => 0,

            'invoice_total_amount' => 5000000,

            'invoice_status' => 'paid',

            'invoice_date' => '2026-08-15',
            'invoice_due_date' => '2026-09-15',

            'invoice_notes' => 'Payment received.',
        ]);
    }
}
