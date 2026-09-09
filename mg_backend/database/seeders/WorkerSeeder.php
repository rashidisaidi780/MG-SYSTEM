<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Worker;

class WorkerSeeder extends Seeder
{
    public function run(): void
    {
        Worker::create([
            'worker_id' => 'WRK001',
            'worker_name' => 'John Michael',
            'worker_email' => 'john@example.com',
            'worker_tin' => 'TIN100001',
            'worker_nida' => 'NIDA100001',
            'worker_phone' => '0712345678',
            'worker_otherphone' => '0755123456',
            'workers_salary' => 850000,
            'department_id' => 1,
            'worker_contact_date' => '2026-01-01',
            'duration' => 12,
            'worker_contact_end_date' => '2026-12-31',
            'worker_role' => 'Accountant',
            'worker_status' => 'active',
            'worker_description' => 'Responsible for accounting and financial records.',
        ]);

        Worker::create([
            'worker_id' => 'WRK002',
            'worker_name' => 'Sarah Joseph',
            'worker_email' => 'sarah@example.com',
            'worker_tin' => 'TIN100002',
            'worker_nida' => 'NIDA100002',
            'worker_phone' => '0788123456',
            'worker_otherphone' => null,
            'workers_salary' => 750000,
            'department_id' => 3,
            'worker_contact_date' => '2026-02-01',
            'duration' => 12,
            'worker_contact_end_date' => '2027-01-31',
            'worker_role' => 'HR Officer',
            'worker_status' => 'active',
            'worker_description' => 'Responsible for human resource activities.',
        ]);

        Worker::create([
            'worker_id' => 'WRK003',
            'worker_name' => 'David Hassan',
            'worker_email' => 'david@example.com',
            'worker_tin' => 'TIN100003',
            'worker_nida' => 'NIDA100003',
            'worker_phone' => '0766123456',
            'worker_otherphone' => '0744123456',
            'workers_salary' => 650000,
            'department_id' => 5,
            'worker_contact_date' => '2026-03-01',
            'duration' => 12,
            'worker_contact_end_date' => '2027-02-28',
            'worker_role' => 'IT Technician',
            'worker_status' => 'active',
            'worker_description' => 'Responsible for IT support and system maintenance.',
        ]);
    }
}