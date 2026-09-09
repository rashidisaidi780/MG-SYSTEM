<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class Admin extends Model
{
    use HasFactory, HasApiTokens;

    protected $fillable = [
        'full_name',
        'username',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
    ];

    /**
     * Check if admin has permission to manage users
     */
    public function canManageUsers(): bool
    {
        return true;
    }

    /**
     * Get all users
     */
    public function getAllUsers()
    {
        return User::all();
    }
}
