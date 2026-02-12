/**
 * Module de calculs caloriques avancés
 * Formules basées sur Mifflin-St Jeor (BMR) et valeurs MET pour l'exercice
 */

// Multiplicateurs d'activité pour le calcul du TDEE
export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,      // Peu ou pas d'exercice
  light: 1.375,        // Exercice léger 1-3 jours/semaine
  moderate: 1.55,      // Exercice modéré 3-5 jours/semaine
  active: 1.725,       // Exercice intense 6-7 jours/semaine
  very_active: 1.9     // Exercice très intense, travail physique
};

// Modificateurs d'objectif (pourcentage d'ajustement du TDEE)
export const GOAL_MODIFIERS = {
  cut: -0.15,        // Déficit de 15% (perte de poids modérée)
  maintain: 0.00,    // Maintenance
  bulk: 0.10         // Surplus de 10% (prise de masse sèche)
};

// Ratios de macronutriments par objectif (en pourcentage des calories totales)
// 1g de protéines = 4 kcal, 1g de glucides = 4 kcal, 1g de lipides = 9 kcal
export const MACRO_RATIOS = {
  cut: {
    protein: 0.40,    // 40% des calories en protéines (élevé pour préserver la masse musculaire)
    carbs: 0.30,      // 30% en glucides (modéré)
    fats: 0.30        // 30% en lipides
  },
  maintain: {
    protein: 0.30,    // 30% en protéines (équilibré)
    carbs: 0.40,      // 40% en glucides (modéré-élevé)
    fats: 0.30        // 30% en lipides
  },
  bulk: {
    protein: 0.30,    // 30% en protéines (suffisant pour la croissance)
    carbs: 0.45,      // 45% en glucides (élevé pour l'énergie)
    fats: 0.25        // 25% en lipides
  }
};

// Valeurs MET de base pour l'entraînement de résistance par groupe musculaire
// Source: Compendium of Physical Activities
export const MUSCLE_GROUP_MET_BASE = {
  chest: 6.0,        // Mouvements de poussée composés (développé couché, dips)
  back: 6.5,         // Mouvements de tirage (rows, tractions) - légèrement plus élevé
  legs: 7.0,         // Intensité la plus élevée (squats, deadlifts)
  shoulders: 5.5,    // Mouvements overhead
  arms: 4.5,         // Travail d'isolation (curls, extensions)
  core: 4.0          // Planches, abdos
};

/**
 * Calcule le BMR (Basal Metabolic Rate) - Métabolisme de base
 * Utilise la formule Mifflin-St Jeor (la plus précise pour les populations modernes)
 *
 * @param {number} weight - Poids en kg
 * @param {number} height - Taille en cm
 * @param {number} age - Âge en années
 * @param {string} gender - 'male', 'female', ou 'other'
 * @returns {number} BMR en kcal
 */
export function calculateBMR(weight, height, age, gender) {
  const base = (10 * weight) + (6.25 * height) - (5 * age);

  if (gender === 'male') {
    return Math.round(base + 5);
  } else if (gender === 'female') {
    return Math.round(base - 161);
  } else {
    // Pour 'other', moyenne des deux formules
    return Math.round((base + 5 + base - 161) / 2);
  }
}

/**
 * Calcule le TDEE (Total Daily Energy Expenditure) - Dépense énergétique totale
 *
 * @param {number} bmr - BMR en kcal
 * @param {string} activityLevel - 'sedentary', 'light', 'moderate', 'active', ou 'very_active'
 * @returns {number} TDEE en kcal
 */
export function calculateTDEE(bmr, activityLevel) {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.moderate;
  return Math.round(bmr * multiplier);
}

/**
 * Obtient le multiplicateur RPE (Rate of Perceived Exertion)
 * Plus le RPE est élevé, plus l'effort et les calories brûlées sont importants
 *
 * @param {number} rpe - RPE sur échelle 1-10
 * @returns {number} Multiplicateur de calories
 */
function getRPEMultiplier(rpe) {
  if (!rpe || rpe < 5) return 0.8;   // Séries faciles
  if (rpe <= 6) return 1.0;          // Modéré
  if (rpe <= 8) return 1.15;         // Difficile
  return 1.3;                         // Effort maximal (RPE 9-10)
}

/**
 * Estime la durée d'une série basée sur le volume
 * Plus de répétitions = plus de temps sous tension
 *
 * @param {number} weight - Poids en kg
 * @param {number} reps - Nombre de répétitions
 * @returns {number} Durée estimée en minutes
 */
function estimateSetDurationMinutes(weight, reps) {
  // Base: ~3.5 secondes par répétition + repos entre répétitions
  // Série typique: 10 reps ≈ 35 secondes = 0.58 min
  const baseSeconds = reps * 3.5;

  // Poids plus lourd = tempo plus lent
  const weightFactor = weight > 100 ? 1.2 : 1.0;

  return (baseSeconds * weightFactor) / 60; // Convertir en minutes
}

/**
 * Calcule les calories brûlées pendant une séance d'entraînement
 * Basé sur le volume (poids × reps), le type d'exercice, et le RPE
 *
 * @param {Array} sets - Tableau des séries avec {exercise_id, weight, repetitions, rpe}
 * @param {Map} exerciseById - Map des exercices avec id → {name, muscle_group, isBodyweight}
 * @param {number} userWeight - Poids de l'utilisateur en kg
 * @returns {number} Calories brûlées estimées
 */
export function calculateWorkoutCalories(sets, exerciseById, userWeight) {
  if (!sets || sets.length === 0) return 0;

  let totalCalories = 0;

  sets.forEach(set => {
    const exercise = exerciseById.get(set.exercise_id);
    if (!exercise) return;

    // Obtenir le MET de base pour le groupe musculaire
    const baseMET = MUSCLE_GROUP_MET_BASE[exercise.muscle_group] || 5.0;

    // Appliquer le multiplicateur RPE
    const rpeMultiplier = getRPEMultiplier(set.rpe);
    const adjustedMET = baseMET * rpeMultiplier;

    // Estimer la durée de cette série
    const durationMinutes = estimateSetDurationMinutes(set.weight, set.repetitions);

    // Formule: Calories = MET × poids_kg × durée_heures
    const calories = adjustedMET * userWeight * (durationMinutes / 60);

    totalCalories += calories;
  });

  // Ajouter les périodes de repos entre séries (approximation)
  // Hypothèse: 1.5-2 min de repos entre séries = activité légère (MET 2.0)
  const estimatedRestMinutes = sets.length * 1.75;
  const restCalories = 2.0 * userWeight * (estimatedRestMinutes / 60);

  return Math.round(totalCalories + restCalories);
}

/**
 * Calcule l'objectif calorique quotidien basé sur le TDEE, les calories d'entraînement, et l'objectif
 *
 * @param {number} tdee - TDEE en kcal
 * @param {number} workoutCalories - Calories brûlées à l'entraînement
 * @param {string} goal - 'cut', 'maintain', ou 'bulk'
 * @returns {number} Objectif calorique quotidien en kcal
 */
export function calculateDailyGoal(tdee, workoutCalories, goal) {
  const baseTDEE = tdee + workoutCalories;
  const modifier = GOAL_MODIFIERS[goal] || GOAL_MODIFIERS.maintain;
  return Math.round(baseTDEE * (1 + modifier));
}

/**
 * Calcule les objectifs de macronutriments en grammes
 * Basé sur des recommandations scientifiques selon le poids corporel
 *
 * @param {number} dailyCalories - Calories quotidiennes totales
 * @param {string} goal - 'cut', 'maintain', ou 'bulk'
 * @param {number} bodyWeight - Poids corporel en kg
 * @returns {Object} Objectifs en grammes {protein, carbs, fats}
 */
export function calculateMacros(dailyCalories, goal, bodyWeight) {
  // Ratios basés sur le poids corporel (plus scientifique et réaliste)
  const proteinPerKg = {
    cut: 2.2,        // 2.2g/kg - élevé pour préserver la masse musculaire en déficit
    maintain: 1.8,   // 1.8g/kg - équilibré pour maintenir
    bulk: 2.0        // 2.0g/kg - suffisant pour la croissance musculaire
  };

  const fatsPerKg = {
    cut: 0.9,        // 0.9g/kg - minimum pour les hormones
    maintain: 1.0,   // 1.0g/kg - équilibré
    bulk: 0.9        // 0.9g/kg - modéré pour laisser place aux glucides
  };

  // Calculer protéines et lipides basés sur le poids
  const proteinGrams = Math.round((proteinPerKg[goal] || 1.8) * bodyWeight);
  const fatsGrams = Math.round((fatsPerKg[goal] || 1.0) * bodyWeight);

  // Calculer les calories utilisées par protéines et lipides
  const proteinCalories = proteinGrams * 4;
  const fatsCalories = fatsGrams * 9;

  // Le reste des calories va aux glucides
  const carbsCalories = dailyCalories - proteinCalories - fatsCalories;
  const carbsGrams = Math.max(0, Math.round(carbsCalories / 4)); // Minimum 0

  return {
    protein: proteinGrams,
    carbs: carbsGrams,
    fats: fatsGrams
  };
}

/**
 * Calcule tous les métriques caloriques pour une journée donnée
 * Fonction utilitaire qui combine tous les calculs
 *
 * @param {Object} userProfile - Profil utilisateur {weight, height, age, gender, activity_level, goal}
 * @param {Array} todaySets - Séries d'entraînement du jour
 * @param {Map} exerciseById - Map des exercices
 * @returns {Object} Objet contenant {bmr, tdee, workoutCalories, dailyGoal, macros}
 */
export function calculateDailyMetrics(userProfile, todaySets, exerciseById) {
  if (!userProfile) {
    return {
      bmr: 0,
      tdee: 0,
      workoutCalories: 0,
      dailyGoal: 2000,
      macros: { protein: 150, carbs: 200, fats: 67 } // Défaut pour 2000 kcal
    };
  }

  const bmr = calculateBMR(
    userProfile.weight,
    userProfile.height,
    userProfile.age,
    userProfile.gender
  );

  const tdee = calculateTDEE(bmr, userProfile.activity_level);

  const workoutCalories = calculateWorkoutCalories(
    todaySets || [],
    exerciseById,
    userProfile.weight
  );

  let dailyGoal;

  // Si mode manuel est activé, utiliser l'objectif manuel
  if (!userProfile.use_auto_calculation && userProfile.manual_calorie_goal) {
    dailyGoal = userProfile.manual_calorie_goal;
  } else {
    dailyGoal = calculateDailyGoal(tdee, workoutCalories, userProfile.goal);
  }

  // Calculer les macros basées sur l'objectif calorique et le goal
  const macros = calculateMacros(dailyGoal, userProfile.goal, userProfile.weight);

  return {
    bmr,
    tdee,
    workoutCalories,
    dailyGoal,
    macros
  };
}
