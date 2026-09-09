<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Booking;

class BookingSeeder extends Seeder
{
    public function run(): void
    {
        Booking::create([
            'booking_id' => 'BOOK001',
            'client_id' => 1,
            'service_id' => 1,
            'assignee' => 1,
            'booking_date' => '2026-09-05',
            'booking_time' => '09:00',
            'booking_status' => 'pending',
            'booking_notes' => 'Initial client booking.',
        ]);

        Booking::create([
            'booking_id' => 'BOOK002',
            'client_id' => 2,
            'service_id' => 2,
            'assignee' => 2,
            'booking_date' => '2026-09-06',
            'booking_time' => '14:00',
            'booking_status' => 'confirmed',
            'booking_notes' => 'Client confirmed the appointment.',
        ]);

        Booking::create([
            'booking_id' => 'BOOK003',
            'client_id' => 3,
            'service_id' => 1,
            'assignee' => 3,
            'booking_date' => '2026-09-08',
            'booking_time' => '10:30',
            'booking_status' => 'completed',
            'booking_notes' => 'Service completed successfully.',
        ]);
    }
}