import { useContext, useState } from 'react';
import { Plus, UtensilsCrossed } from 'lucide-react';
import NavBar from '../components/NavBar';
import MealCard from '../components/MealCard';
import { FoodContext } from '../context/FoodContext';
import { WorkoutContext } from '../context/WorkoutContext';

const MealsPage = () => {
  const { meals, deleteMeal, setSelectedMeal, addMealToToday } = useContext(FoodContext);
  const { setCurrentPage } = useContext(WorkoutContext);
  const [sortBy, setSortBy] = useState('recent');

  const handleCreateMeal = () => {
    setSelectedMeal(null);
    setCurrentPage('mealEditor');
  };

  const handleEditMeal = (meal) => {
    setSelectedMeal(meal);
    setCurrentPage('mealEditor');
  };

  const handleDeleteMeal = async (meal) => {
    if (confirm(`Supprimer le repas "${meal.name}" ?`)) {
      try {
        await deleteMeal(meal.id);
      } catch (error) {
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleAddToToday = async (meal) => {
    try {
      await addMealToToday(meal.id);
      alert(`"${meal.name}" ajouté à aujourd'hui !`);
    } catch (error) {
      alert('Erreur lors de l\'ajout');
    }
  };

  const sortedMeals = [...meals]
    .filter(m => !m.name.startsWith('[QA] '))
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortBy === 'mostUsed') {
        return b.times_used - a.times_used;
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <UtensilsCrossed className="w-8 h-8 text-indigo-600" />
            Mes Repas
          </h1>
          <button
            onClick={handleCreateMeal}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 font-semibold"
          >
            <Plus className="w-5 h-5" />
            Créer un repas
          </button>
        </div>

        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setSortBy('recent')}
            className={`px-4 py-2 rounded-lg transition ${
              sortBy === 'recent' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Récents
          </button>
          <button
            onClick={() => setSortBy('mostUsed')}
            className={`px-4 py-2 rounded-lg transition ${
              sortBy === 'mostUsed' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Plus utilisés
          </button>
        </div>

        {sortedMeals.length === 0 ? (
          <div className="text-center py-12">
            <UtensilsCrossed className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">Vous n'avez pas encore créé de repas</p>
            <button
              onClick={handleCreateMeal}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Créer mon premier repas
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedMeals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                onEdit={handleEditMeal}
                onDelete={handleDeleteMeal}
                onAddToToday={handleAddToToday}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MealsPage;
