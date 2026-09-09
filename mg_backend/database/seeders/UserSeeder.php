<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'user_id' => 'USR001',
            'user_name' => 'System Administrator',
            'user_email' => 'admin@example.com',
            'user_password' => Hash::make('password123'),
            'department_id' => null,
            'user_role' => 'admin',
            'user_status' => 'active',
        ]);

        User::create([
            'user_id' => 'USR003',
            'user_name' => 'Staff User',
            'user_email' => 'staff@example.com',
            'user_password' => Hash::make('password123'),
            'department_id' => null,
            'user_role' => 'user',
            'user_status' => 'active',
        ]);
    }
}