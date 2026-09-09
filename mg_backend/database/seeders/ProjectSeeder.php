<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Project;

class ProjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Project::create([
            'project_id' => 1001,
            'project_name' => 'Office Building Construction',
            'client_id' => 1,
            'project_budget' => 150000000.00,
            'project_status' => 'in_progress',
            'project_progress' => 45,
            'project_leader' => 1,
            'project_start_date' => '2026-01-15',
            'project_end_date' => '2026-12-30',
            'project_details' => 'Construction of a modern office building.',
        ]);

        Project::create([
            'project_id' => 1002,
            'project_name' => 'School Renovation Project',
            'client_id' => 1,
            'project_budget' => 75000000.00,
            'project_status' => 'pending',
            'project_progress' => 0,
            'project_leader' => 1,
            'project_start_date' => '2026-09-01',
            'project_end_date' => '2027-03-30',
            'project_details' => 'Renovation and improvement of school facilities.',
        ]);
    }

}
