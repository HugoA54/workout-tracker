import { useState, useEffect, useContext, useMemo } from 'react';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import NavBar from '../components/NavBar';
import PhotoUpload from '../components/PhotoUpload';
import FoodSearchModal from '../components/FoodSearchModal';
import { FoodContext } from '../context/FoodContext';
import { WorkoutContext } from '../context/WorkoutContext';

const MealEditorPage = () => {
  const { selectedMeal, createMeal, updateMeal, loadMealFoods, mealFoods } = useContext(FoodContext);
  const { setCurrentPage } = useContext(WorkoutContext);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState(null);
  const [foodsList, setFoodsList] = useState([]);
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedMeal) {
      setName(selectedMeal.name);
      setDescription(selectedMeal.description || '');
      setPhotoUrl(selectedMeal.photo_url);
      loadMealFoods(selectedMeal.id);
    }
  }, [selectedMeal]);

  useEffect(() => {
    if (mealFoods.length > 0) {
      const formattedFoods = mealFoods.map(mf => ({
        food_id: mf.food_id,
        food: mf.food,
        quantity: mf.quantity,
        serving_unit: mf.serving_unit,
        calories: mf.calories,
        protein: mf.protein,
        carbs: mf.carbs,
        fats: mf.fats
      }));
      setFoodsList(formattedFoods);
    }
  }, [mealFoods]);

  const totals = useMemo(() => {
    return foodsList.reduce(
      (acc, item) => ({
        calories: acc.calories + (item.calories || 0),
        protein: acc.protein + (item.protein || 0),
        carbs: acc.carbs + (item.carbs || 0),
        fats: acc.fats + (item.fats || 0)
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  }, [foodsList]);

  const handleAddFood = (foodWithQuantity) => {
    setFoodsList(prev => [...prev, {
      food_id: foodWithQuantity.id,
      food: foodWithQuantity,
      quantity: foodWithQuantity.quantity,
      serving_unit: 'g',
      calories: foodWithQuantity.calories,
      protein: foodWithQuantity.protein,
      carbs: foodWithQuantity.carbs,
      fats: foodWithQuantity.fats
    }]);
  };

  const handleRemoveFood = (index) => {
    setFoodsList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Veuillez donner un nom au repas');
      return;
    }

    if (foodsList.length === 0) {
      alert('Ajoutez au moins un aliment au repas');
      return;
    }

    try {
      setIsSaving(true);

      const mealData = {
        name: name.trim(),
        description: description.trim(),
        photo_url: photoUrl,
        total_calories: totals.calories,
        total_protein: totals.protein,
        total_carbs: totals.carbs,
        total_fats: totals.fats
      };

      if (selectedMeal) {
        await updateMeal(selectedMeal.id, mealData, foodsList);
        alert('Repas mis à jour !');
      } else {
        await createMeal(mealData, foodsList);
        alert('Repas créé !');
      }

      setCurrentPage('meals');
    } catch (error) {
      alert('Erreur lors de la sauvegarde');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <button
          onClick={() => setCurrentPage('meals')}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour aux repas
        </button>

        <h1 className="text-3xl font-bold mb-6">
          {selectedMeal ? 'Modifier le repas' : 'Créer un repas'}
        </h1>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Informations générales</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du repas *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Petit-déjeuner protéiné"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description optionnelle..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <PhotoUpload
            currentPhotoUrl={photoUrl}
            onUploadComplete={setPhotoUrl}
          />
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Aliments</h2>
            <button
              onClick={() => setShowFoodSearch(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter un aliment
            </button>
          </div>

          {foodsList.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucun aliment ajouté</p>
          ) : (
            <div className="space-y-2">
              {foodsList.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.food.name}</p>
                    <p className="text-sm text-gray-600">
                      {item.quantity}g • {Math.round(item.calories)} kcal
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveFood(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Résumé nutritionnel</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm opacity-90">Calories</p>
              <p className="text-2xl font-bold">{Math.round(totals.calories)}</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Protéines</p>
              <p className="text-2xl font-bold">{Math.round(totals.protein)}g</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Glucides</p>
              <p className="text-2xl font-bold">{Math.round(totals.carbs)}g</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Lipides</p>
              <p className="text-2xl font-bold">{Math.round(totals.fats)}g</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setCurrentPage('meals')}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <FoodSearchModal
        isOpen={showFoodSearch}
        onClose={() => setShowFoodSearch(false)}
        onSelectFood={handleAddFood}
      />
    </div>
  );
};

export default MealEditorPage;
