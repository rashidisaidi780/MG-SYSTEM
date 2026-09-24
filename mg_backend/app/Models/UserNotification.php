<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserNotification extends Model
{
    protected $table = 'user_notifications';

    protected $fillable = [
        'recipient_type',
        'recipient_id',
        'title',
        'message',
        'type',
        'action_url',
        'related_entity',
        'read_at',
    ];

    protected $casts = [
        'read_at' => 'datetime',
    ];
}
