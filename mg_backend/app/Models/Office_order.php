<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Office_order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'department_id',
        'order_subject',
        'requester_name',
        'client_email',
        'order_date',
        'order_status',
        'order_notes',
    ];

    protected $casts = [
        'order_date' => 'date',
    ];

}
