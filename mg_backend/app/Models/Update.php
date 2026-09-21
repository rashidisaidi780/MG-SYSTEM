<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Update extends Model
{
    use HasFactory;

    protected $fillable = [
        'update_id',
        'update_title',
        'update_description',
        'update_image',
        'update_date',
        'update_duration',
        'update_status',
        'is_new',
    ];

    protected $casts = [
        'update_date' => 'date',
        'is_new' => 'boolean',
    ];
}
