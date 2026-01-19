<?php

namespace App\models; 

use Illuminate\Database\Eloquent\Model;

class User extends Model {
    
    public $timestamps = true;

    protected $fillable = ['username', 'email', 'password'];
}