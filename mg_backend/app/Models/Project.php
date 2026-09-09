<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    //fillables for project 
    use Hasfactory;
    protected $fillable = [
        'project_id',
        'project_name',
        'client_id',
        'project_budget',
        'project_status',
        'project_progress',
        'project_leader',
        'project_start_date',
        'project_end_date',
        'project_details',
    ];


    protected $casts = [
        'project_budget' => 'decimal:2',
        'project_progress' => 'integer',
        'project_start_date' => 'date',
        'project_end_date' => 'date',
    ];
}
