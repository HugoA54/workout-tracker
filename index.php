<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../src/config/db.php';

use App\models\Exercise; 
use App\models\Set;

echo "<h1>Bienvenue sur mon Tracker de Muscu</h1>";

try {
    $exos = Set::where('reps', '=', '12')->get();

    echo "<pre>";
    print_r($exos->toArray()); 
    echo "</pre>";

} catch (Exception $e) {
    echo "Erreur : " . $e->getMessage();
}