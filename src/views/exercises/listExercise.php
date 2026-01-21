<?php 
namespace App\views\exercises;

class listExercise {

    public function render($exercises) {
        $html = "<h1>Liste des exercices</h1>";
        foreach ($exercises as $exercise) {
            $html .= "Exercise: " . $exercise->name . "<br>";
            $html .= "Muscle Group: " . $exercise->muscle_group . "<br>";
            $html .= "Description: " . $exercise->description . "<br><br>";
        }
        return $html;
    }



}

?>