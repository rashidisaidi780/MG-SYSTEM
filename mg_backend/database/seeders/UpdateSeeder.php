<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Update;

class UpdateSeeder extends Seeder
{
    public function run(): void
    {
        Update::create([
            'update_id' => 'UPD001',
            'update_title' => 'System Maintenance',
            'update_description' => 'The system will undergo scheduled maintenance to improve performance and reliability.',
            'update_image' => null,
            'update_date' => '2026-09-01',
            'update_duration' => 7,
            'update_status' => 'active',
        ]);

        Update::create([
            'update_id' => 'UPD002',
            'update_title' => 'New System Features',
            'update_description' => 'New features have been added to improve project and client management.',
            'update_image' => null,
            'update_date' => '2026-09-05',
            'update_duration' => 30,
            'update_status' => 'active',
        ]);

        Update::create([
            'update_id' => 'UPD003',
            'update_title' => 'Company Announcement',
            'update_description' => 'Important company updates and announcements for all employees.',
            'update_image' => null,
            'update_date' => '2026-09-10',
            'update_duration' => 14,
            'update_status' => 'active',
        ]);
    }
}
    