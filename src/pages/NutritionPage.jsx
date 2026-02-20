import { useState, useEffect, useContext, useRef } from 'react';
import { Apple, Droplets, Plus, Minus, TrendingUp, Flame, AlertCircle, User, UtensilsCrossed, Trash2 } from 'lucide-react';
import NavBar from '../components/NavBar';
import { WorkoutContext } from '../context/WorkoutContext';
import { FoodContext } from '../context/FoodContext';
import FoodSearchModal from '../components/FoodSearchModal';

const NutritionPage = () => {
    const {
        getTodayNutrition,
        updateWaterCount,
        getNutritionHistory,
        userProfile,
        calculateTodayCalories,
        setCurrentPage,
        nutritionDataReady
    } = useContext(WorkoutContext);

    const { getTodayMeals, removeMealFromToday, foodRefreshTrigger, quickAddFood } = useContext(FoodContext);

    const [todayMeals, setTodayMeals] = useState([]);
    const [showFoodSearch, setShowFoodSearch] = useState(false);
    const [waterCount, setWaterCount] = useState(0);
    const [waterGoal] = useState(8);
    const [dailyMetrics, setDailyMetrics] = useState({ bmr: 0, tdee: 0, workoutCalories: 0, dailyGoal: 2000, macros: { protein: 0, carbs: 0, fats: 0 } });

    // Calories et macros en lecture seule (depuis nutrition_logs)
    const [todayCalories, setTodayCalories] = useState(0);
    const [proteinGrams, setProteinGrams] = useState(0);
    const [carbsGrams, setCarbsGrams] = useState(0);
    const [fatsGrams, setFatsGrams] = useState(0);

    const isDataLoaded = useRef(false);

    // Recalculer les métriques quand le profil change
    useEffect(() => {
        const metrics = calculateTodayCalories();
        setDailyMetrics(metrics);
    }, [calculateTodayCalories, userProfile]);

    const defaultMacros = useRef({ protein: 0, carbs: 0, fats: 0 });
    const { bmr, tdee, workoutCalories, dailyGoal, macros = defaultMacros.current } = dailyMetrics;

    // Charger les données depuis Supabase
    useEffect(() => {
        if (!nutritionDataReady) return;
        const todayData = getTodayNutrition();
        if (todayData) {
            setTodayCalories(todayData.calories || 0);
            setWaterCount(todayData.water_count || 0);
            setProteinGrams(todayData.protein_grams || 0);
            setCarbsGrams(todayData.carbs_grams || 0);
            setFatsGrams(todayData.fats_grams || 0);
        }
        isDataLoaded.current = true;
    }, [getTodayNutrition, foodRefreshTrigger, nutritionDataReady]);

    // Charger les repas d'aujourd'hui
    useEffect(() => {
        const loadTodayMeals = async () => {
            if (getTodayMeals) {
                const meals = await getTodayMeals();
                setTodayMeals(meals);
            }
        };
        loadTodayMeals();
    }, [getTodayMeals, foodRefreshTrigger]);

    // Sauvegarder uniquement l'eau (calories/macros gérés par le système de repas)
    const updateWaterCountRef = useRef(updateWaterCount);
    useEffect(() => { updateWaterCountRef.current = updateWaterCount; }, [updateWaterCount]);

    useEffect(() => {
        if (!isDataLoaded.current) return;
        const timeoutId = setTimeout(() => {
            updateWaterCountRef.current(waterCount);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [waterCount]);

    // Handlers
    const handleRemoveMeal = async (entryId) => {
        if (window.confirm('Voulez-vous vraiment retirer ce repas ?')) {
            try {
                await removeMealFromToday(entryId);
                const updatedMeals = await getTodayMeals();
                setTodayMeals(updatedMeals);
            } catch (error) {
                console.error("Erreur lors de la suppression", error);
            }
        }
    };

    const handleQuickAddFood = async (foodWithQuantity) => {
        try {
            await quickAddFood(foodWithQuantity);
            const updatedMeals = await getTodayMeals();
            setTodayMeals(updatedMeals);
        } catch (error) {
            console.error('Erreur ajout rapide:', error);
            alert("Erreur lors de l'ajout de l'aliment");
        }
    };

    const addWater = () => {
        if (waterCount < 20) setWaterCount(prev => prev + 1);
    };

    const removeWater = () => {
        if (waterCount > 0) setWaterCount(prev => prev - 1);
    };

    const caloriePercentage = Math.min((todayCalories / dailyGoal) * 100, 100);
    const waterPercentage = Math.min((waterCount / waterGoal) * 100, 100);

    // Historique 7 jours
    const history = getNutritionHistory(7);
    const last7Days = history.map((log, index) => {
        const date = new Date(log.date);
        const isToday = index === history.length - 1;
        return {
            day: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
            calories: isToday ? todayCalories : log.calories,
            goal: isToday ? dailyGoal : (log.total_daily_goal || log.calorieGoal || 2000)
        };
    });
    const maxCalories = Math.max(...last7Days.map(d => d.calories), dailyGoal);

    const getGoalBadge = () => {
        if (!userProfile) return null;
        const goalConfig = {
            cut: { label: 'Sèche', bgColor: 'bg-red-100', textColor: 'text-red-700' },
            maintain: { label: 'Maintien', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
            bulk: { label: 'Prise de masse', bgColor: 'bg-green-100', textColor: 'text-green-700' }
        };
        const config = goalConfig[userProfile.goal] || goalConfig.maintain;
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${config.bgColor} ${config.textColor}`}>
                {config.label}
            </span>
        );
    };

    return (
        <>
            <NavBar />
            <div className="max-w-6xl mx-auto p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Apple className="w-8 h-8 text-indigo-600" /> Nutrition
                    </h1>
                    {getGoalBadge()}
                </div>

                {/* Section Repas d'aujourd'hui */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <UtensilsCrossed className="w-6 h-6 text-indigo-600" />
                        Repas d'aujourd'hui
                    </h2>

                    {todayMeals.length === 0 ? (
                        <p className="text-gray-500 text-sm mb-3">Aucun repas ajouté</p>
                    ) : (
                        <div className="space-y-2 mb-4">
                            {todayMeals.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                                >
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-800">
                                            {(item.meal?.name || 'Repas').replace(/^\[QA\] /, '')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-semibold text-gray-600">
                                            {Math.round(item.calories)} kcal
                                        </span>
                                        <button
                                            onClick={() => handleRemoveMeal(item.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                            title="Retirer ce repas"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowFoodSearch(true)}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Ajouter un aliment
                        </button>
                        <button
                            onClick={() => setCurrentPage('meals')}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Ajouter un repas
                        </button>
                    </div>
                </div>

                {/* Warning si profil incomplet */}
                {!userProfile && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-yellow-400 mr-3" />
                            <div className="flex-1">
                                <p className="text-sm text-yellow-700">
                                    Complétez votre profil pour obtenir des recommandations caloriques personnalisées basées sur votre âge, poids, taille et objectif.
                                </p>
                            </div>
                            <button
                                onClick={() => setCurrentPage('profile')}
                                className="ml-4 px-4 py-2 bg-yellow-400 text-yellow-900 rounded-lg hover:bg-yellow-500 transition-colors text-sm font-semibold flex items-center gap-2"
                            >
                                <User className="w-4 h-4" />
                                Compléter mon profil
                            </button>
                        </div>
                    </div>
                )}

                {/* Breakdown énergétique */}
                {userProfile && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">Breakdown énergétique</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-lg p-4">
                                <div className="text-xs text-gray-600 mb-1">BMR (Métabolisme de base)</div>
                                <div className="text-2xl font-bold text-indigo-600">{bmr}</div>
                                <div className="text-xs text-gray-500">kcal/jour</div>
                            </div>
                            <div className="bg-white rounded-lg p-4">
                                <div className="text-xs text-gray-600 mb-1">TDEE (Dépense totale)</div>
                                <div className="text-2xl font-bold text-purple-600">{tdee}</div>
                                <div className="text-xs text-gray-500">kcal/jour</div>
                            </div>
                            <div className="bg-white rounded-lg p-4">
                                <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                                    <Flame className="w-3 h-3 text-orange-500" />
                                    Workout Bonus
                                </div>
                                <div className="text-2xl font-bold text-orange-600">+{workoutCalories}</div>
                                <div className="text-xs text-gray-500">kcal</div>
                            </div>
                            <div className="bg-white rounded-lg p-4">
                                <div className="text-xs text-gray-600 mb-1">Objectif quotidien</div>
                                <div className="text-2xl font-bold text-green-600">{dailyGoal}</div>
                                <div className="text-xs text-gray-500">kcal/jour</div>
                            </div>
                        </div>
                        {workoutCalories === 0 && (
                            <p className="text-sm text-gray-600 mt-3">
                                Aucune séance enregistrée aujourd'hui - objectif basé sur votre TDEE uniquement.
                            </p>
                        )}
                    </div>
                )}

                {/* Macronutriments (lecture seule) */}
                {userProfile && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">Macronutriments</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Protéines */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">Protéines</span>
                                    <span className="text-sm text-gray-600">/ {macros.protein}g</span>
                                </div>
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-3xl font-bold text-blue-600">{proteinGrams}</span>
                                    <span className="text-sm text-gray-500">g</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 transition-all duration-300"
                                        style={{ width: `${Math.min((proteinGrams / macros.protein) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Glucides */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">Glucides</span>
                                    <span className="text-sm text-gray-600">/ {macros.carbs}g</span>
                                </div>
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-3xl font-bold text-green-600">{carbsGrams}</span>
                                    <span className="text-sm text-gray-500">g</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-green-400 to-green-600 h-3 transition-all duration-300"
                                        style={{ width: `${Math.min((carbsGrams / macros.carbs) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Lipides */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">Lipides</span>
                                    <span className="text-sm text-gray-600">/ {macros.fats}g</span>
                                </div>
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-3xl font-bold text-yellow-600">{fatsGrams}</span>
                                    <span className="text-sm text-gray-500">g</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-3 transition-all duration-300"
                                        style={{ width: `${Math.min((fatsGrams / macros.fats) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600">
                                Ratios recommandés pour votre objectif ({userProfile.goal}) :
                                <br />
                                Protéines: {macros.protein}g ({Math.round((macros.protein * 4 / dailyGoal) * 100)}%),
                                Glucides: {macros.carbs}g ({Math.round((macros.carbs * 4 / dailyGoal) * 100)}%),
                                Lipides: {macros.fats}g ({Math.round((macros.fats * 9 / dailyGoal) * 100)}%)
                            </p>
                        </div>
                    </div>
                )}

                {/* Grille Calories + Hydratation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Calories (lecture seule) */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-6 h-6 text-orange-500" />
                            <h2 className="text-xl font-semibold">Calories</h2>
                        </div>
                        <div className="mb-4">
                            <div className="flex justify-between mb-2">
                                <span className="text-3xl font-bold text-orange-500">{todayCalories}</span>
                                <span className="text-gray-500">/ {dailyGoal} kcal</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-orange-400 to-orange-600 h-4 transition-all duration-300"
                                    style={{ width: `${caloriePercentage}%` }}
                                ></div>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{Math.round(caloriePercentage)}% de l'objectif</p>
                        </div>
                    </div>

                    {/* Hydratation */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Droplets className="w-6 h-6 text-blue-500" />
                            <h2 className="text-xl font-semibold">Hydratation</h2>
                        </div>
                        <div className="mb-4">
                            <div className="flex justify-between mb-2">
                                <span className="text-3xl font-bold text-blue-500">{waterCount * 250}ml</span>
                                <span className="text-gray-500">/ {waterGoal * 250}ml</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-4 transition-all duration-300"
                                    style={{ width: `${waterPercentage}%` }}
                                ></div>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{waterCount} / {waterGoal} verres</p>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={removeWater}
                                disabled={waterCount === 0}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Minus className="w-5 h-5" />
                                Retirer
                            </button>
                            <button
                                onClick={addWater}
                                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                250ml
                            </button>
                        </div>
                        <div className="mt-6 grid grid-cols-8 gap-2">
                            {[...Array(waterGoal)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-8 rounded ${i < waterCount ? 'bg-blue-500' : 'bg-gray-200'} transition-colors`}
                                ></div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Graphique 7 jours */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-indigo-600" />
                        Progression sur 7 jours
                    </h2>
                    <div className="flex items-end justify-between gap-2 h-64">
                        {last7Days.map((day, index) => {
                            const barHeight = maxCalories > 0 ? (day.calories / maxCalories) * 100 : 0;
                            const isToday = index === 6;
                            return (
                                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                    <div className="relative w-full flex flex-col justify-end" style={{ height: '200px' }}>
                                        <div
                                            className="absolute w-full border-t-2 border-dashed border-gray-300"
                                            style={{ bottom: `${(day.goal / maxCalories) * 100}%` }}
                                        ></div>
                                        <div
                                            className={`w-full rounded-t-lg transition-all duration-300 ${
                                                isToday
                                                    ? 'bg-gradient-to-t from-indigo-500 to-indigo-400'
                                                    : 'bg-gradient-to-t from-indigo-300 to-indigo-200'
                                            } relative group cursor-pointer`}
                                            style={{ height: `${barHeight}%` }}
                                        >
                                            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                                {day.calories} kcal
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`text-sm ${isToday ? 'font-bold text-indigo-600' : 'text-gray-600'}`}>
                                        {day.day}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-indigo-500 rounded"></div>
                            <span>Aujourd'hui</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-indigo-300 rounded"></div>
                            <span>Historique</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-0.5 border-t-2 border-dashed border-gray-300"></div>
                            <span>Objectif</span>
                        </div>
                    </div>
                </div>
            </div>

            <FoodSearchModal
                isOpen={showFoodSearch}
                onClose={() => setShowFoodSearch(false)}
                onSelectFood={handleQuickAddFood}
                confirmLabel="Ajouter"
            />
        </>
    );
};

export default NutritionPage;
