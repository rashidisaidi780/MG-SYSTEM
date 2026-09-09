<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\client;

class ClientSeeder extends Seeder
{
    public function run(): void
    {
        Client::create([
            'client_id' => 'CL001',
            'client_name' => 'ABC Company Ltd',
            'client_email' => 'info@abccompany.com',
            'client_phone' => '0712345678',
            'client_address' => 'Dar es Salaam',
            'client_otherphone' => '0755123456',
            'client_status' => 'active',
            'client_tin' => '123456789',
            'client_date_added' => now()->toDateString(),
        ]);

        Client::create([
            'client_id' => 'CL002',
            'client_name' => 'XYZ Enterprises',
            'client_email' => 'info@xyz.com',
            'client_phone' => '0788123456',
            'client_address' => 'Arusha',
            'client_otherphone' => null,
            'client_status' => 'active',
            'client_tin' => '987654321',
            'client_date_added' => now()->toDateString(),
        ]);

        Client::create([
            'client_id' => 'CL003',
            'client_name' => 'Mohamed Trading',
            'client_email' => 'mohamed@example.com',
            'client_phone' => '0766123456',
            'client_address' => 'Mwanza',
            'client_otherphone' => '0744123456',
            'client_status' => 'inactive',
            'client_tin' => '456789123',
            'client_date_added' => now()->toDateString(),
        ]);
    }
}
