<?php

namespace App\models; 

use Illuminate\Database\Eloquent\Model;

class Exercise extends Model {
    
    public $timestamps = true;
    protected $fillable = ['name', 'muscle_group', 'description'];


    public static function getAllExercices() {
        return self::all();
    }

}