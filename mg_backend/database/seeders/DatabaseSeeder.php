<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ClientSeeder::class,
            DepartmentSeeder::class,
            ProjectSeeder::class,
            WorkerSeeder::class,
            // BookingSeeder::class,
            // InvoiceSeeder::class,
            // OfficeOrderSeeder::class,
            // UpdateSeeder::class,
            AdminSeeder::class,
            
        ]);
    }
}
