<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Admin::create([
            'full_name' => 'Rashid Said',
            'username' => 'rashid',
            'email' => 'admin@makezy.co.tz',
            'password' => Hash::make('rashid123'),
        ]);

    }
}
