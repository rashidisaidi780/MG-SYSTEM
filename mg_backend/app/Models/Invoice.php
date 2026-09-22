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
        'invoice_items',
        'invoice_total_amount',
        'paid_amount',
        'remaining_amount',
        'invoice_status',
        'invoice_date',
        'invoice_due_date',
        'invoice_notes',
    ];

    protected $casts = [
        'invoice_items' => 'array',
        'invoice_date' => 'date:Y-m-d',
        'invoice_due_date' => 'date:Y-m-d',
    ];

    public static function findInvoice(string|int $identifier): ?self
    {
        return is_numeric($identifier)
            ? self::with('client')->find($identifier)
            : self::with('client')->where('invoice_id', $identifier)->first();
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }
}
