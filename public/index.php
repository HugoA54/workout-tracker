<?php
// 1. Charger l'autoloader de Composer (on remonte d'un dossier avec /../)
require_once __DIR__ . '/../vendor/autoload.php';

// 2. Démarrer la base de données (Eloquent)
require_once __DIR__ . '/../src/config/db.php';

// Test simple pour voir si ça marche
use App\models\Exercise; // Attention à la majuscule/minuscule selon ton dossier

echo "<h1>Bienvenue sur mon Tracker de Muscu</h1>";

// Si tu as créé la BDD, tu peux tester une requête ici plus tard
// $exos = Exercise::all();
// var_dump($exos);