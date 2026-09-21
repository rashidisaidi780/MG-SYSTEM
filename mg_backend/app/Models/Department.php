<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory;

    public function users()
    {
        return $this->hasMany(User::class, 'department_id');
    }

    public function workers()
    {
        return $this->hasMany(Worker::class, 'department_id');
    }

    protected $fillable = [
        'department_id',
        'department_name',
        'department_head',
        'number_of_people',
        'department_status',
        'department_description',
    ];
}
