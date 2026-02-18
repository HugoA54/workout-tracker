import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';
import { openFoodFactsApi } from '../services/openFoodFactsApi';
import { WorkoutContext } from './WorkoutContext';

export const FoodContext = createContext(null);



export const FoodProvider = ({ children, currentUser }) => {
  // États
  const [foodRefreshTrigger, setFoodRefreshTrigger] = useState(0);
  const [foods, setFoods] = useState([]);
  const [meals, setMeals] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);

  // État pour le repas en cours d'édition
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [mealFoods, setMealFoods] = useState([]); // Aliments du repas sélectionné

  // Accès au WorkoutContext pour updateNutritionLog
  const workoutContext = useContext(WorkoutContext);

  // Charger les données au montage
  useEffect(() => {
    if (currentUser) {
      loadFoods();
      loadMeals();
      loadMealPlans();
      loadShoppingList();
    }
  }, [currentUser]);

  // ===================================================================
  // FOODS - Gestion des aliments
  // ===================================================================

// Fonction utilitaire pour s'assurer qu'un aliment existe en BDD
  const ensureFoodExists = async (item) => {
    // Debug : Voir ce qui arrive vraiment
    if (!item) {
      console.error("❌ ensureFoodExists a reçu un item null ou undefined");
      return null;
    }
    
    // Cas 1: C'est déjà un aliment de notre BDD (il a un ID)
    if (item.id && !item.source) return item.id;
    if (item.food_id) return item.food_id;

    // Cas 2: C'est un aliment OpenFoodFacts ou externe
    // On vérifie le cache local
    const existing = foods.find(f => f.barcode === item.barcode && item.barcode);
    if (existing) return existing.id;

    // PROTECTION : On cherche le nom partout ou on met une valeur par défaut
    // Cela empêche l'erreur "column name violates not-null constraint"
    const safeName = item.name || item.product_name || item.label || 'Aliment sans nom';

    // Sinon, on le crée
    const newFoodData = {
      name: safeName, // Utilisation du nom sécurisé
      brand: item.brand || '',
      calories_per_100g: Number(item.calories_per_100g) || 0,
      protein_per_100g: Number(item.protein_per_100g) || 0,
      carbs_per_100g: Number(item.carbs_per_100g) || 0,
      fats_per_100g: Number(item.fats_per_100g) || 0,
      serving_size: Number(item.serving_size) || 100,
      serving_unit: item.serving_unit || 'g',
      barcode: item.barcode || null,
      source: 'openfoodfacts'
    };

    console.log('Création aliment manquant:', newFoodData.name); // Log pour vérifier

    const createdFood = await createFood(newFoodData);
    return createdFood.id;
  };

  const loadFoods = async () => {
    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('times_used', { ascending: false });

      if (error) throw error;
      setFoods(data || []);
      console.log('✅ Aliments chargés:', data?.length || 0);
    } catch (error) {
      console.error('❌ Erreur loadFoods:', error);
    }
  };

  const createFood = async (foodData) => {
    try {
      const { data, error } = await supabase
        .from('foods')
        .insert({
          user_id: currentUser.id,
          ...foodData
        })
        .select()
        .single();

      if (error) throw error;
      setFoods(prev => [data, ...prev]);
      console.log('✅ Aliment créé:', data.name);
      return data;
    } catch (error) {
      console.error('❌ Erreur createFood:', error);
      throw error;
    }
  };

  const updateFood = async (foodId, updates) => {
    try {
      const { data, error } = await supabase
        .from('foods')
        .update(updates)
        .eq('id', foodId)
        .eq('user_id', currentUser.id)
        .select()
        .single();

      if (error) throw error;
      setFoods(prev => prev.map(f => f.id === foodId ? data : f));
      console.log('✅ Aliment mis à jour:', data.name);
      return data;
    } catch (error) {
      console.error('❌ Erreur updateFood:', error);
      throw error;
    }
  };

  const deleteFood = async (foodId) => {
    try {
      const { error } = await supabase
        .from('foods')
        .delete()
        .eq('id', foodId)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      setFoods(prev => prev.filter(f => f.id !== foodId));
      console.log('✅ Aliment supprimé');
    } catch (error) {
      console.error('❌ Erreur deleteFood:', error);
      throw error;
    }
  };

  // Rechercher des aliments (local + API)
  const searchFoods = async (query) => {
    try {
      // 1. Recherche locale
      const localResults = foods.filter(f =>
        f.name.toLowerCase().includes(query.toLowerCase()) ||
        (f.brand && f.brand.toLowerCase().includes(query.toLowerCase()))
      );

      // 2. Recherche API OpenFoodFacts
      const apiResults = await openFoodFactsApi.searchFoods(query, 1, 10);

      return {
        local: localResults,
        api: apiResults.foods || []
      };
    } catch (error) {
      console.error('❌ Erreur searchFoods:', error);
      return { local: [], api: [] };
    }
  };

  // Scanner un code-barres
  const scanBarcode = async (barcode) => {
    try {
      // Vérifier d'abord en cache local
      const cached = foods.find(f => f.barcode === barcode);
      if (cached) {
        console.log('✅ Aliment trouvé en cache');
        return cached;
      }

      // Sinon, scanner via OpenFoodFacts
      const apiFood = await openFoodFactsApi.getFoodByBarcode(barcode);

      // Créer l'aliment en cache
      const newFood = await createFood(apiFood);
      return newFood;
    } catch (error) {
      console.error('❌ Erreur scanBarcode:', error);
      throw error;
    }
  };

  // ===================================================================
  // MEALS - Gestion des repas
  // ===================================================================

  const loadMeals = async () => {
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMeals(data || []);
      console.log('✅ Repas chargés:', data?.length || 0);
    } catch (error) {
      console.error('❌ Erreur loadMeals:', error);
    }
  };

const createMeal = async (mealData, foodsList) => {
    try {
      // 1. Créer le repas (l'enveloppe)
      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .insert({
          user_id: currentUser.id,
          ...mealData
        })
        .select()
        .single();

      if (mealError) throw mealError;

      // 2. Ajouter les aliments au repas
      if (foodsList && foodsList.length > 0) {
        
        // On prépare les données proprement en attendant que chaque aliment soit vérifié/créé
        const mealFoodsData = await Promise.all(foodsList.map(async (item) => {
          // ÉTAPE CRUCIALE : On récupère un ID valide (existant ou nouvellement créé)
          const validFoodId = await ensureFoodExists(item);

          return {
            meal_id: meal.id,
            food_id: validFoodId, // Maintenant on est sûr que ce n'est pas null
            quantity: item.quantity,
            serving_unit: item.serving_unit || 'g',
            // On stocke les macros calculées pour cette portion spécifique
            calories: item.calories, 
            protein: item.protein,
            carbs: item.carbs,
            fats: item.fats
          };
        }));

        const { error: foodsError } = await supabase
          .from('meal_foods')
          .insert(mealFoodsData);

        if (foodsError) throw foodsError;
      }

      // Recharger la liste pour avoir les totaux à jour
      // (Optionnel mais recommandé si vous avez des triggers SQL qui calculent les totaux)
      // await loadMeals(); 
      
      // Mise à jour optimiste de l'état local
      setMeals(prev => [meal, ...prev]);
      console.log('✅ Repas créé avec succès:', meal.name);
      return meal;

    } catch (error) {
      console.error('❌ Erreur createMeal:', error);
      throw error;
    }
  };

const updateMeal = async (mealId, updates, foodsList) => {
    try {
      // 1. Mettre à jour le repas
      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .update(updates)
        .eq('id', mealId)
        .eq('user_id', currentUser.id)
        .select()
        .single();

      if (mealError) throw mealError;

      // 2. Si foodsList fourni, mettre à jour les aliments
      if (foodsList) {
        // Supprimer les anciens aliments
        await supabase
          .from('meal_foods')
          .delete()
          .eq('meal_id', mealId);

        // Ajouter les nouveaux (avec la même sécurité que createMeal)
        if (foodsList.length > 0) {
          const mealFoodsData = await Promise.all(foodsList.map(async (item) => {
            const validFoodId = await ensureFoodExists(item);

            return {
              meal_id: mealId,
              food_id: validFoodId,
              quantity: item.quantity,
              serving_unit: item.serving_unit || 'g',
              calories: item.calories,
              protein: item.protein,
              carbs: item.carbs,
              fats: item.fats
            };
          }));

          const { error: insertError } = await supabase
            .from('meal_foods')
            .insert(mealFoodsData);
            
          if (insertError) throw insertError;
        }
      }

      setMeals(prev => prev.map(m => m.id === mealId ? meal : m));
      console.log('✅ Repas mis à jour:', meal.name);
      return meal;
    } catch (error) {
      console.error('❌ Erreur updateMeal:', error);
      throw error;
    }
  };

  const deleteMeal = async (mealId) => {
    try {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      setMeals(prev => prev.filter(m => m.id !== mealId));
      console.log('✅ Repas supprimé');
    } catch (error) {
      console.error('❌ Erreur deleteMeal:', error);
      throw error;
    }
  };

  // Charger les aliments d'un repas
  const loadMealFoods = async (mealId) => {
    try {
      const { data, error } = await supabase
        .from('meal_foods')
        .select('*, food:foods(*)')
        .eq('meal_id', mealId);

      if (error) throw error;
      setMealFoods(data || []);
      return data || [];
    } catch (error) {
      console.error('❌ Erreur loadMealFoods:', error);
      return [];
    }
  };

  // Ajouter un repas à la nutrition du jour
  const addMealToToday = async (mealId) => {
    try {
      const meal = meals.find(m => m.id === mealId);
      if (!meal) {
        throw new Error('Repas non trouvé');
      }

      // Incrémenter le compteur d'utilisation
      await supabase.rpc('increment_meal_usage', { meal_id_param: mealId });

      // Utiliser la fonction updateNutritionLog du WorkoutContext
      if (workoutContext && workoutContext.updateNutritionLog) {
        const today = workoutContext.getTodayNutrition();
const newCalories = Math.round((today?.calories || 0) + meal.total_calories);
        const newProtein = Math.round((today?.protein_grams || 0) + meal.total_protein);
        const newCarbs = Math.round((today?.carbs_grams || 0) + meal.total_carbs);
        const newFats = Math.round((today?.fats_grams || 0) + meal.total_fats);
        // Mettre à jour nutrition_logs
        await workoutContext.updateNutritionLog(
          newCalories,
          today?.water_count || 0,
          today?.calorie_goal || 2000,
          {
            protein: newProtein,
            carbs: newCarbs,
            fats: newFats
          },
          today?.macros || {}
        );

        // Créer l'entrée de jonction nutrition_log_meals
        const todayLog = workoutContext.getTodayNutrition();
        if (todayLog) {
          await supabase.from('nutrition_log_meals').insert({
            nutrition_log_id: todayLog.id,
            meal_id: mealId,
            calories: meal.total_calories,
            protein: meal.total_protein,
            carbs: meal.total_carbs,
            fats: meal.total_fats
          });
        }
        setFoodRefreshTrigger(prev => prev + 1);

        console.log('✅ Repas ajouté à aujourd\'hui');
        return true;
      }

      throw new Error('WorkoutContext non disponible');
    } catch (error) {
      console.error('❌ Erreur addMealToToday:', error);
      throw error;
    }
  };

  // Ajout rapide d'un aliment seul à la journée
  const quickAddFood = async (foodWithQuantity) => {
    try {
      const mealData = {
        name: `[QA] ${foodWithQuantity.name || 'Aliment'}`,
        total_calories: Math.round(foodWithQuantity.calories),
        total_protein: Math.round(foodWithQuantity.protein * 10) / 10,
        total_carbs: Math.round(foodWithQuantity.carbs * 10) / 10,
        total_fats: Math.round(foodWithQuantity.fats * 10) / 10,
      };

      const foodsList = [{
        ...foodWithQuantity,
        food_id: foodWithQuantity.id,
        serving_unit: foodWithQuantity.serving_unit || 'g',
      }];

      // Créer le repas rapide
      const meal = await createMeal(mealData, foodsList);

      // Ajouter directement à aujourd'hui sans passer par addMealToToday
      // (car le state meals n'est pas encore mis à jour après createMeal)
      if (!workoutContext || !workoutContext.updateNutritionLog) {
        throw new Error('WorkoutContext non disponible');
      }

      await supabase.rpc('increment_meal_usage', { meal_id_param: meal.id });

      const today = workoutContext.getTodayNutrition();
      const newCalories = Math.round((today?.calories || 0) + meal.total_calories);
      const newProtein = Math.round((today?.protein_grams || 0) + meal.total_protein);
      const newCarbs = Math.round((today?.carbs_grams || 0) + meal.total_carbs);
      const newFats = Math.round((today?.fats_grams || 0) + meal.total_fats);

      await workoutContext.updateNutritionLog(
        newCalories,
        today?.water_count || 0,
        today?.calorie_goal || 2000,
        { protein: newProtein, carbs: newCarbs, fats: newFats },
        today?.macros || {}
      );

      const todayLog = workoutContext.getTodayNutrition();
      if (todayLog) {
        await supabase.from('nutrition_log_meals').insert({
          nutrition_log_id: todayLog.id,
          meal_id: meal.id,
          calories: meal.total_calories,
          protein: meal.total_protein,
          carbs: meal.total_carbs,
          fats: meal.total_fats
        });
      }

      setFoodRefreshTrigger(prev => prev + 1);
      console.log('✅ Aliment ajouté rapidement:', foodWithQuantity.name);
      return true;
    } catch (error) {
      console.error('❌ Erreur quickAddFood:', error);
      throw error;
    }
  };

// Retirer un repas de la nutrition du jour
  // On utilise 'entryId' (l'ID de la ligne dans nutrition_log_meals) et non meal_id
  const removeMealFromToday = async (entryId) => {
    try {
      const today = workoutContext?.getTodayNutrition();
      if (!today) throw new Error('Aucun journal nutritionnel trouvé');

      // 1. Récupérer les infos du repas qu'on va supprimer pour savoir combien soustraire
      const { data: entryToDelete, error: fetchError } = await supabase
        .from('nutrition_log_meals')
        .select('*')
        .eq('id', entryId)
        .single();

      if (fetchError) throw fetchError;

      // 2. Supprimer la ligne dans la table de liaison
      const { error: deleteError } = await supabase
        .from('nutrition_log_meals')
        .delete()
        .eq('id', entryId);

      if (deleteError) throw deleteError;

      // 3. Calculer les nouveaux totaux pour la journée
      // On s'assure de ne pas descendre en dessous de 0 avec Math.max
      const newCalories = Math.max(0, (today.calories || 0) - (entryToDelete.calories || 0));
      
      const newMacros = {
        protein: Math.max(0, (today.protein_grams || 0) - (entryToDelete.protein || 0)),
        carbs: Math.max(0, (today.carbs_grams || 0) - (entryToDelete.carbs || 0)),
        fats: Math.max(0, (today.fats_grams || 0) - (entryToDelete.fats || 0))
      };

      // 4. Mettre à jour le journal global via le WorkoutContext
      if (workoutContext && workoutContext.updateNutritionLog) {
        await workoutContext.updateNutritionLog(
          newCalories,
          today.water_count,
          today.calorie_goal,
          newMacros,
          today.macros || {} // On garde les objectifs inchangés
        );
      }
      setFoodRefreshTrigger(prev => prev + 1);
      
      console.log('✅ Repas retiré et totaux mis à jour');
      return true; // Succès
    } catch (error) {
      console.error('❌ Erreur removeMealFromToday:', error);
      throw error;
    }
  };

  // Obtenir les repas d'aujourd'hui
  const getTodayMeals = async () => {
    try {
      const today = workoutContext?.getTodayNutrition();
      if (!today) return [];

      const { data, error } = await supabase
        .from('nutrition_log_meals')
        .select('*, meal:meals(*)')
        .eq('nutrition_log_id', today.id);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Erreur getTodayMeals:', error);
      return [];
    }
  };

  // ===================================================================
  // MEAL PLANS - Planification
  // ===================================================================

  const loadMealPlans = async () => {
    try {
      // Charger les 14 prochains jours
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const { data, error } = await supabase
        .from('meal_plans')
        .select('*, meal:meals(*)')
        .eq('user_id', currentUser.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      setMealPlans(data || []);
      console.log('✅ Meal plans chargés:', data?.length || 0);
    } catch (error) {
      console.error('❌ Erreur loadMealPlans:', error);
    }
  };

  const assignMealToPlan = async (date, mealTime, mealId) => {
    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .upsert({
          user_id: currentUser.id,
          date: date,
          meal_time: mealTime,
          meal_id: mealId
        }, {
          onConflict: 'user_id,date,meal_time'
        })
        .select()
        .single();

      if (error) throw error;
      await loadMealPlans(); // Recharger
      console.log('✅ Meal plan assigné');
      return data;
    } catch (error) {
      console.error('❌ Erreur assignMealToPlan:', error);
      throw error;
    }
  };

  const removeMealFromPlan = async (planId) => {
    try {
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', planId)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      await loadMealPlans();
      console.log('✅ Meal plan retiré');
    } catch (error) {
      console.error('❌ Erreur removeMealFromPlan:', error);
      throw error;
    }
  };

  const completeMealPlan = async (planId) => {
    try {
      const { error } = await supabase
        .from('meal_plans')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', planId)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      await loadMealPlans();
      console.log('✅ Meal plan complété');
    } catch (error) {
      console.error('❌ Erreur completeMealPlan:', error);
      throw error;
    }
  };

  // ===================================================================
  // SHOPPING LIST - Liste de courses
  // ===================================================================

  const loadShoppingList = async () => {
    try {
      // Charger la liste de la semaine en cours
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
      const weekStart = monday.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('week_start', weekStart)
        .order('category', { ascending: true })
        .order('item_name', { ascending: true });

      if (error) throw error;
      setShoppingList(data || []);
      console.log('✅ Shopping list chargée:', data?.length || 0);
    } catch (error) {
      console.error('❌ Erreur loadShoppingList:', error);
    }
  };

  const generateShoppingList = async (startDate, endDate) => {
    try {
      // Récupérer les meal plans pour la période
      const { data: plans, error: plansError } = await supabase
        .from('meal_plans')
        .select('*, meal:meals!inner(*)')
        .eq('user_id', currentUser.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .not('meal_id', 'is', null);

      if (plansError) throw plansError;

      if (!plans || plans.length === 0) {
        console.log('⚠️ Aucun meal plan trouvé');
        return;
      }

      // Récupérer tous les meal_foods pour ces repas
      const mealIds = [...new Set(plans.map(p => p.meal_id))];
      const { data: allMealFoods, error: foodsError } = await supabase
        .from('meal_foods')
        .select('*, food:foods(*)')
        .in('meal_id', mealIds);

      if (foodsError) throw foodsError;

      // Agréger les quantités par aliment
      const aggregated = {};
      allMealFoods.forEach(mf => {
        const key = mf.food_id;
        if (!aggregated[key]) {
          aggregated[key] = {
            food_id: mf.food_id,
            item_name: mf.food.name,
            quantity: 0,
            unit: mf.serving_unit,
            category: categorizeFood(mf.food.name)
          };
        }
        aggregated[key].quantity += mf.quantity;
      });

      // Supprimer l'ancienne liste
      const monday = new Date(startDate);
      const weekStart = monday.toISOString().split('T')[0];

      await supabase
        .from('shopping_lists')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('week_start', weekStart);

      // Créer la nouvelle liste
      const shoppingItems = Object.values(aggregated).map(item => ({
        user_id: currentUser.id,
        ...item,
        week_start: weekStart
      }));

      const { error: insertError } = await supabase
        .from('shopping_lists')
        .insert(shoppingItems);

      if (insertError) throw insertError;

      await loadShoppingList();
      console.log('✅ Shopping list générée:', shoppingItems.length, 'items');
    } catch (error) {
      console.error('❌ Erreur generateShoppingList:', error);
      throw error;
    }
  };

  const togglePurchased = async (itemId) => {
    try {
      const item = shoppingList.find(i => i.id === itemId);
      const { error } = await supabase
        .from('shopping_lists')
        .update({
          is_purchased: !item.is_purchased,
          purchased_at: !item.is_purchased ? new Date().toISOString() : null
        })
        .eq('id', itemId)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      await loadShoppingList();
    } catch (error) {
      console.error('❌ Erreur togglePurchased:', error);
      throw error;
    }
  };

  const removeShoppingItem = async (itemId) => {
    try {
      const { error } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id', itemId)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      setShoppingList(prev => prev.filter(i => i.id !== itemId));
    } catch (error) {
      console.error('❌ Erreur removeShoppingItem:', error);
      throw error;
    }
  };

  const clearShoppingList = async () => {
    try {
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
      const weekStart = monday.toISOString().split('T')[0];

      const { error } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('week_start', weekStart);

      if (error) throw error;
      setShoppingList([]);
    } catch (error) {
      console.error('❌ Erreur clearShoppingList:', error);
      throw error;
    }
  };

  // Helper: catégoriser un aliment
  const categorizeFood = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('fruit') || lowerName.includes('légume') || lowerName.includes('salade')) return 'produce';
    if (lowerName.includes('lait') || lowerName.includes('fromage') || lowerName.includes('yaourt')) return 'dairy';
    if (lowerName.includes('poulet') || lowerName.includes('viande') || lowerName.includes('poisson')) return 'meat';
    if (lowerName.includes('pain') || lowerName.includes('pâtes') || lowerName.includes('riz')) return 'pantry';
    return 'other';
  };

  // ===================================================================
  // CONTEXT VALUE
  // ===================================================================
// ===================================================================
  // CONTEXT VALUE
  // ===================================================================

  const contextValue = {
    // States
    foods,
    meals,
    mealPlans,
    shoppingList,
    selectedMeal,
    mealFoods,

    // Foods
    foodRefreshTrigger,
    loadFoods,
    createFood,
    updateFood,
    deleteFood,
    searchFoods,
    scanBarcode,

    // Meals
    loadMeals,
    createMeal,
    updateMeal,
    deleteMeal,
    loadMealFoods,
    setSelectedMeal,
    addMealToToday,
    getTodayMeals,
    removeMealFromToday,
    quickAddFood,

    // Meal Plans
    loadMealPlans,
    assignMealToPlan,
    removeMealFromPlan,
    completeMealPlan,

    // Shopping List
    loadShoppingList,
    generateShoppingList,
    togglePurchased,
    removeShoppingItem,
    clearShoppingList
  };

  return (
    <FoodContext.Provider value={contextValue}>
      {children}
    </FoodContext.Provider>
  );
};
