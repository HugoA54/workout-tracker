<?php

namespace App\controllers;


use App\models\Exercise;

class ExerciseController {

    public function listExercises() {
        $exercises = Exercise::all();
        $view = new \App\views\exercises\listExercise();
        return $view->render($exercises);
    }

    public function getExercise($id) {
        // Logic to get a specific exercise by ID
    }

    public function createExercise($data) {
        // Logic to create a new exercise
    }

    public function updateExercise($id, $data) {
        // Logic to update an existing exercise
    }

    public function deleteExercise($id) {
        // Logic to delete an exercise
    }
}
?>