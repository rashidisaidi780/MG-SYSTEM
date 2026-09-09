<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Office_order;

class OfficeOrderSeeder extends Seeder
{
    public function run(): void
    {
        Order::create([
            'order_id' => 'ORD001',
            'department_id' => 1,
            'order_subject' => 'Office Equipment Request',
            'requester_name' => 'John Michael',
            'client_email' => 'john@example.com',
            'order_date' => '2026-09-01',
            'order_status' => 'pending',
            'order_notes' => 'Request for new office equipment.',
        ]);

        Order::create([
            'order_id' => 'ORD002',
            'department_id' => 2,
            'order_subject' => 'Stationery Order',
            'requester_name' => 'Sarah Joseph',
            'client_email' => 'sarah@example.com',
            'order_date' => '2026-09-02',
            'order_status' => 'approved',
            'order_notes' => 'Stationery required for the finance department.',
        ]);

        Order::create([
            'order_id' => 'ORD003',
            'department_id' => 4,
            'order_subject' => 'Computer Equipment',
            'requester_name' => 'David Hassan',
            'client_email' => 'david@example.com',
            'order_date' => '2026-09-03',
            'order_status' => 'completed',
            'order_notes' => 'Computers and accessories required.',
        ]);
    }
}