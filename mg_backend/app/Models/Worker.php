<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Worker extends Model
{
    use HasFactory;

    protected $fillable = [
        'worker_id',
        'worker_name',
        'worker_email',
        'worker_tin',
        'worker_nida',
        'worker_phone',
        'worker_otherphone',
        'workers_salary',
        'department_id',
        'worker_contact_date',
        'duration',
        'worker_contact_end_date',
        'worker_role',
        'worker_status',
        'worker_description',
        'worker_status',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function documents()
    {
        return $this->hasMany(WorkerDocument::class);
    }
}
