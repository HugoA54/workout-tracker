import { useState, useEffect, useContext } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ShoppingCart, Plus, X } from 'lucide-react';
import NavBar from '../components/NavBar';
import { FoodContext } from '../context/FoodContext';
import { WorkoutContext } from '../context/WorkoutContext';

const MEAL_TIMES = [
  { id: 'breakfast', label: 'Petit-déjeuner', color: 'bg-orange-100 text-orange-700' },
  { id: 'lunch', label: 'Déjeuner', color: 'bg-green-100 text-green-700' },
  { id: 'dinner', label: 'Dîner', color: 'bg-blue-100 text-blue-700' },
  { id: 'snack', label: 'Snack', color: 'bg-purple-100 text-purple-700' }
];

const MealPrepPage = () => {
  const { meals, mealPlans, assignMealToPlan, removeMealFromPlan, generateShoppingList, loadMealPlans } = useContext(FoodContext);
  const { setCurrentPage } = useContext(WorkoutContext);

  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showMealSelector, setShowMealSelector] = useState(false);

  useEffect(() => {
    loadMealPlans();
  }, [weekStart]);

  function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  const getDaysOfWeek = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getPlanForSlot = (date, mealTime) => {
    const dateStr = date.toISOString().split('T')[0];
    return mealPlans.find(p => p.date === dateStr && p.meal_time === mealTime);
  };

  const handleSlotClick = (date, mealTime) => {
    setSelectedSlot({ date, mealTime });
    setShowMealSelector(true);
  };

  const handleAssignMeal = async (mealId) => {
    if (!selectedSlot) return;
    try {
      const dateStr = selectedSlot.date.toISOString().split('T')[0];
      await assignMealToPlan(dateStr, selectedSlot.mealTime, mealId);
      setShowMealSelector(false);
      setSelectedSlot(null);
    } catch (error) {
      alert('Erreur lors de l\'assignation');
    }
  };

  const handleRemovePlan = async (planId) => {
    if (confirm('Retirer ce repas de la planification ?')) {
      try {
        await removeMealFromPlan(planId);
      } catch (error) {
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleGenerateShoppingList = async () => {
    const endDate = new Date(weekStart);
    endDate.setDate(weekStart.getDate() + 6);
    try {
      await generateShoppingList(
        weekStart.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      alert('Liste de courses générée !');
      setCurrentPage('shoppingList');
    } catch (error) {
      alert('Erreur lors de la génération');
    }
  };

  const days = getDaysOfWeek();

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="w-8 h-8 text-indigo-600" />
            Planification des repas
          </h1>
          <button
            onClick={handleGenerateShoppingList}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            Générer liste de courses
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex items-center justify-between">
          <button
            onClick={() => {
              const prev = new Date(weekStart);
              prev.setDate(prev.getDate() - 7);
              setWeekStart(getMonday(prev));
            }}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <p className="font-semibold">Semaine du {weekStart.toLocaleDateString('fr-FR')}</p>
          </div>
          <button
            onClick={() => {
              const next = new Date(weekStart);
              next.setDate(next.getDate() + 7);
              setWeekStart(getMonday(next));
            }}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-xl shadow-md">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left w-32">Repas</th>
                {days.map((day, i) => (
                  <th key={i} className="p-3 text-center">
                    <div className="font-semibold">{day.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
                    <div className="text-sm text-gray-500">{day.getDate()}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MEAL_TIMES.map(mealTime => (
                <tr key={mealTime.id} className="border-b">
                  <td className="p-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${mealTime.color}`}>
                      {mealTime.label}
                    </span>
                  </td>
                  {days.map((day, i) => {
                    const plan = getPlanForSlot(day, mealTime.id);
                    return (
                      <td key={i} className="p-2">
                        {plan && plan.meal ? (
                          <div className="relative bg-indigo-50 border border-indigo-200 rounded-lg p-2 cursor-pointer hover:bg-indigo-100 transition">
                            <button
                              onClick={() => handleRemovePlan(plan.id)}
                              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <p className="text-xs font-medium truncate">{plan.meal.name}</p>
                            <p className="text-xs text-gray-600">{Math.round(plan.meal.total_calories)} kcal</p>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSlotClick(day, mealTime.id)}
                            className="w-full p-3 border-2 border-dashed border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition"
                          >
                            <Plus className="w-5 h-5 mx-auto text-gray-400" />
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showMealSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">Choisir un repas</h2>
              <button onClick={() => setShowMealSelector(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid md:grid-cols-2 gap-4">
                {meals.filter(m => !m.name.startsWith('[QA] ')).map(meal => (
                  <div
                    key={meal.id}
                    onClick={() => handleAssignMeal(meal.id)}
                    className="p-4 border rounded-lg hover:bg-indigo-50 hover:border-indigo-400 cursor-pointer transition"
                  >
                    <p className="font-semibold">{meal.name}</p>
                    <p className="text-sm text-gray-600">{Math.round(meal.total_calories)} kcal</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPrepPage;
