<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Department;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        Department::create([
            'department_id' => 'DEP001',
            'department_name' => 'Administration',
            'number_of_people' => 5,
            'department_status' => 'active',
            'department_description' => 'Responsible for general administration and management.',
        ]);

        Department::create([
            'department_id' => 'DEP002',
            'department_name' => 'Finance',
            'number_of_people' => 4,
            'department_status' => 'active',
            'department_description' => 'Responsible for financial management, accounting and budgeting.',
        ]);

        Department::create([
            'department_id' => 'DEP003',
            'department_name' => 'Human Resources',
            'number_of_people' => 3,
            'department_status' => 'active',
            'department_description' => 'Responsible for employee management and human resources.',
        ]);

        Department::create([
            'department_id' => 'DEP004',
            'department_name' => 'Procurement',
            'number_of_people' => 4,
            'department_status' => 'active',
            'department_description' => 'Responsible for purchasing and supplier management.',
        ]);

        Department::create([
            'department_id' => 'DEP005',
            'department_name' => 'IT',
            'number_of_people' => 3,
            'department_status' => 'active',
            'department_description' => 'Responsible for information technology and system support.',
        ]);
    }
}