<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class client extends Model
{
    use HasFactory;
    protected $fillable = [
        'client_id',
        'client_name',
        'client_email',
        'client_phone',
        'client_address',
        'client_otherphone',
        'client_status',
        'client_tin',
        'client_date_added',
    
    ];
}
