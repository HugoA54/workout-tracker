<?php
namespace App;

use App\Controllers\ExerciseController;
use App\Controllers\UserController;

class Dispatcher {

    public function run() {
        $page = $_GET['page'] ?? 'home';

        switch ($page) {
            case 'exercises':
                $html =  "<h1>Liste des exercices</h1>";
                $this->genererPage($html);
                break;
            
            case 'users':
                break;

            case 'home':
                $html = "<h1>Bienvenue sur GymProgress</h1>";
                $html .= "<a href='?page=exercises'>Voir les exercices</a>";
                $this->genererPage($html);
                break;
        
            default:
                // Gestion 404
                http_response_code(404);
                echo "Page introuvable.";
                break;
        }
    }



    public function genererPage($content) {
        echo "<html><head><title>GymProgress</title></head><body>";
        echo $content;
        echo "</body></html>";
    }
}