<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;
    protected $fillable = [
        'invoice_id',
        'client_id',
        'company_name',
        'client_tin',
        'client_email',
        'client_phone',
        'client_address',
        'country',
        'item_description',
        'item_quantity',
        'item_unit_price',
        'item_total_price',
        'invoice_total_amount',
        'paid_amount',
        'remaining_amount',
        'invoice_status',
        'invoice_date',
        'invoice_due_date',
        'invoice_notes',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }
}
