<?php 
use App\Models\Exercise;

// Récupérer tous les exos jambes
$exos = Exercise::where('muscle_group', 'Jambes')->get();

// Créer un nouvel exo
Exercise::create([
    'name' => 'Fentes Bulgares',
    'muscle_group' => 'Jambes'
]);
?>