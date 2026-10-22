<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Admin extends Authenticatable
{
    use HasApiTokens, HasFactory;

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
