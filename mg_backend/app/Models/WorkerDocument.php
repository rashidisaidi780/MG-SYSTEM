<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkerDocument extends Model
{
    protected $fillable = [
        'worker_id',
        'original_name',
        'file_path',
        'file_size',
        'content_base64',
    ];

    public function worker()
    {
        return $this->belongsTo(Worker::class);
    }
}
