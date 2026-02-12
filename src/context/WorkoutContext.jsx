import React, { createContext, useState, useEffect, useMemo } from 'react';
// 👇 Assure-toi que ce fichier existe bien (étape 1)
import { supabase } from '../supabaseClient';
// 👇 Assure-toi que ce fichier existe bien (étape 3)
import LoadingScreen from '../components/LoadingScreen';
import { calculateDailyMetrics } from '../utils/calorieCalculations'; 

export const WorkoutContext = createContext(null);

export const WorkoutProvider = ({ children }) => {
  // --- ÉTATS (STATE) ---
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);

  // Exercices : chargés depuis la BD uniquement
  const [exercises, setExercises] = useState([]);

  const [sessions, setSessions] = useState([]);
  const [sets, setSets] = useState([]);
  const [nutritionLogs, setNutritionLogs] = useState([]);
  const [nutritionDataReady, setNutritionDataReady] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  
  // Login / Formulaires
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [newSessionName, setNewSessionName] = useState('');
  const [userBodyweight] = useState(75);

  // Navigation / UI
  const [currentSession, setCurrentSession] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Gestion des Séries et Timer
  const [newSet, setNewSet] = useState({ exerciseId: '', weight: '', repetitions: '', rpe: '', note: '' });
  const [restDuration, setRestDuration] = useState(() => {
    const saved = localStorage.getItem('restDuration');
    return saved ? parseInt(saved, 10) : 90;
  });
  const [restTimer, setRestTimer] = useState(0);
  const [isRestTimerActive, setIsRestTimerActive] = useState(() => {
    const savedEnd = localStorage.getItem('restEndTime');
    return savedEnd ? Date.now() < parseInt(savedEnd, 10) : false;
  });
  const [restTimerDone, setRestTimerDone] = useState(false);
  const [restEndTime, setRestEndTime] = useState(() => {
    const savedEnd = localStorage.getItem('restEndTime');
    if (savedEnd) {
      const endTime = parseInt(savedEnd, 10);
      if (Date.now() < endTime) return endTime;
      // Timer expiré pendant la mise en veille, nettoyer
      localStorage.removeItem('restEndTime');
      localStorage.removeItem('restDuration');
    }
    return null;
  });

  // --- MEMOS ---
  const exerciseById = useMemo(() => {
    const map = new Map();
    exercises.forEach(e => map.set(e.id, e));
    return map;
  }, [exercises]);

  // --- FONCTIONS TIMER ---

  // Démarrer le timer de repos
  const startRestTimer = (duration) => {
    const endTime = Date.now() + duration * 1000;
    setRestEndTime(endTime);
    setRestTimer(duration);
    setIsRestTimerActive(true);
    localStorage.setItem('restEndTime', endTime.toString());
    localStorage.setItem('restDuration', duration.toString());
  };

  // --- FONCTIONS SUPABASE ---

  // Charger les exercices depuis la base de données
  const loadExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Transformer is_bodyweight → isBodyweight pour correspondre au format attendu
        const transformedExercises = data.map(ex => ({
          id: ex.id,
          name: ex.name,
          muscle_group: ex.muscle_group,
          isBodyweight: ex.is_bodyweight
        }));
        setExercises(transformedExercises);
        console.log('✅ Exercises loaded from database:', data.length);
      } else {
        console.warn('⚠️ No exercises in database');
      }
    } catch (error) {
      console.error('❌ Error loading exercises:', error.message);
    }
  };

  const loadUserData = async (userId) => {
    try {
      // 1. Sessions
      const { data: sessionsData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId);

      if (sessionError) throw sessionError;
      setSessions(sessionsData || []);

      // 2. Sets
      if (sessionsData && sessionsData.length > 0) {
        const sessionIds = sessionsData.map(s => s.id);
        const { data: setsData, error: setsError } = await supabase
          .from('sets')
          .select('*')
          .in('session_id', sessionIds);

        if (setsError) throw setsError;
        setSets(setsData || []);
      } else {
        setSets([]);
      }

      // 3. Nutrition logs
      await loadNutritionData(userId);

      // 4. User profile
      await loadUserProfile(userId);
    } catch (error) {
      console.error('Erreur chargement données:', error.message);
    }
  };

  // --- FONCTIONS NUTRITION ---

  const loadNutritionData = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;
      setNutritionLogs(data || []);
      setNutritionDataReady(true);
      console.log('✅ Nutrition data loaded:', data?.length || 0);
    } catch (error) {
      console.error('❌ Error loading nutrition data:', error.message);
    }
  };

  const getTodayNutrition = () => {
    const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
    return nutritionLogs.find(log => log.date === today) || null;
  };

const updateNutritionLog = async (calories, waterCount, calorieGoal, macros = null, macroGoals = null) => {
    if (!currentUser) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Vérifier si un log existe déjà pour aujourd'hui
      const existingLog = getTodayNutrition();

      // CORRECTION : On arrondit les valeurs ici
      const updateData = {
        calories: Math.round(calories),          // <--- Arrondi ajouté
        water_count: waterCount,
        calorie_goal: Math.round(calorieGoal)    // <--- Arrondi ajouté
      };

      // Ajouter les macros si fournies
      if (macros) {
        updateData.protein_grams = Math.round(macros.protein || 0); // <--- Arrondi ajouté
        updateData.carbs_grams = Math.round(macros.carbs || 0);     // <--- Arrondi ajouté
        updateData.fats_grams = Math.round(macros.fats || 0);       // <--- Arrondi ajouté
      }

      // Ajouter les objectifs de macros si fournis
      // (Généralement pas besoin d'arrondir ici si ce sont des valeurs fixes, mais par sécurité on peut le faire)
      if (macroGoals) {
        updateData.protein_goal = macroGoals.protein;
        updateData.carbs_goal = macroGoals.carbs;
        updateData.fats_goal = macroGoals.fats;
      }

      if (existingLog) {
        // Mise à jour
        const { data, error } = await supabase
          .from('nutrition_logs')
          .update(updateData)
          .eq('id', existingLog.id)
          .select();

        if (error) throw error;

        // Mettre à jour le state local
        setNutritionLogs(prev =>
          prev.map(log => log.id === existingLog.id ? data[0] : log)
        );
      } else {
        // Insertion
        const { data, error } = await supabase
          .from('nutrition_logs')
          .insert({
            user_id: currentUser.id,
            date: today,
            ...updateData
          })
          .select();

        if (error) throw error;

        // Ajouter au state local
        setNutritionLogs(prev => [data[0], ...prev]);
      }
      
      console.log("✅ Nutrition log sauvegardé avec succès");

    } catch (error) {
      console.error('❌ Error updating nutrition log:', error.message);
    }
  };

  // Mise à jour de l'eau uniquement (sans toucher aux calories/macros)
  const updateWaterCount = async (newWaterCount) => {
    if (!currentUser) return;
    try {
      const existingLog = getTodayNutrition();
      if (existingLog) {
        const { data, error } = await supabase
          .from('nutrition_logs')
          .update({ water_count: newWaterCount })
          .eq('id', existingLog.id)
          .select();

        if (error) throw error;
        setNutritionLogs(prev =>
          prev.map(log => log.id === existingLog.id ? data[0] : log)
        );
      } else {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('nutrition_logs')
          .insert({
            user_id: currentUser.id,
            date: today,
            calories: 0,
            water_count: newWaterCount,
            calorie_goal: 2000
          })
          .select();

        if (error) throw error;
        setNutritionLogs(prev => [data[0], ...prev]);
      }
      console.log("✅ Water count mis à jour:", newWaterCount);
    } catch (error) {
      console.error('❌ Error updating water count:', error.message);
    }
  };

  const getNutritionHistory = (days = 7) => {
    const history = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      const log = nutritionLogs.find(l => l.date === dateString);

      history.push({
        date: dateString,
        calories: log?.calories || 0,
        waterCount: log?.water_count || 0,
        calorieGoal: log?.calorie_goal || 2000
      });
    }

    return history;
  };

  // --- FONCTIONS PROFIL UTILISATEUR ---

  const loadUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Si le profil n'existe pas, créer un profil par défaut
        if (error.code === 'PGRST116') {
          console.log('⚠️ No profile found, creating default profile');
          const defaultProfile = await createDefaultProfile(userId);
          setUserProfile(defaultProfile);
          return;
        }
        throw error;
      }

      setUserProfile(data);
      console.log('✅ User profile loaded');
    } catch (error) {
      console.error('❌ Error loading user profile:', error.message);
    }
  };

  const createDefaultProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          weight: 75.0,
          height: 175,
          age: 25,
          gender: 'male',
          activity_level: 'moderate',
          goal: 'maintain',
          use_auto_calculation: true
        })
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Default profile created');
      return data;
    } catch (error) {
      console.error('❌ Error creating default profile:', error.message);
      return null;
    }
  };

  const updateUserProfile = async (profileData) => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(profileData)
        .eq('user_id', currentUser.id)
        .select()
        .single();

      if (error) throw error;

      setUserProfile(data);
      console.log('✅ Profile updated');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error updating profile:', error.message);
      return { success: false, error: error.message };
    }
  };

  const calculateTodayCalories = () => {
    if (!userProfile) {
      return {
        bmr: 0,
        tdee: 0,
        workoutCalories: 0,
        dailyGoal: 2000
      };
    }

    // Obtenir les séances et sets d'aujourd'hui
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = sessions.filter(s => s.date === today);
    const todaySessionIds = todaySessions.map(s => s.id);
    const todaySets = sets.filter(s => todaySessionIds.includes(s.session_id));

    // Calculer les métriques
    return calculateDailyMetrics(userProfile, todaySets, exerciseById);
  };

  const getTodayWorkoutCalories = () => {
    const metrics = calculateTodayCalories();
    return metrics.workoutCalories;
  };

  const handleRegister = async (pseudo) => {
    if (!loginEmail || !loginPassword || !pseudo) {
      alert('Remplissez tous les champs');
      return;
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email: loginEmail,
        password: loginPassword,
        options: { data: { pseudo: pseudo } },
        emailRedirectTo: 'https://nokka.fr/projets/workout/'
      });
      if (error) throw error;
      alert('Compte créé !');
    } catch (error) {
      console.error(error);
      alert('Erreur inscription : ' + error.message);
    }
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      alert('Remplissez tous les champs');
      return;
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;
    } catch (error) {
      console.error(error);
      alert('Erreur connexion : ' + error.message);
    }
  };

  // --- AJOUT : Démarrer une routine existante ---
  const startRoutine = async (routineName) => {
    if (!currentUser) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // 1. On crée la nouvelle séance
      const { data: newSessionData, error: createError } = await supabase
        .from('sessions')
        .insert({
          user_id: currentUser.id,
          date: today,
          name: routineName // On utilise le nom de la routine (ex: "Push Day")
        })
        .select();

      if (createError) throw createError;
      const newSession = newSessionData[0];

      // 2. On cherche la DERNIÈRE séance qui avait ce même nom (pour copier les exos)
      // On trie par date descendante et on exclut la séance qu'on vient de créer
      const userSessions = getUserSessions();
      const lastSessionSameName = userSessions.find(s => s.name === routineName && s.id !== newSession.id);

      if (lastSessionSameName) {
        // 3. On récupère les exercices qu'on avait faits ce jour-là
        const pastSets = getSessionSets(lastSessionSameName.id);
        
        // On ne veut pas copier 4 séries de développé couché, juste SAVOIR qu'il y avait du développé couché.
        // On utilise un Set pour avoir les IDs uniques.
        const uniqueExerciseIds = [...new Set(pastSets.map(s => s.exercise_id))];

        // 4. Pour chaque exercice, on crée une série "vide" (placeholder) dans la nouvelle séance
        const setsToInsert = uniqueExerciseIds.map(exId => ({
          session_id: newSession.id,
          exercise_id: exId,
          weight: 0,        // Poids 0 pour dire "à remplir"
          repetitions: 0,   // Reps 0 pour dire "à remplir"
          display_weight: 0
        }));

        if (setsToInsert.length > 0) {
          const { data: insertedSets, error: insertError } = await supabase
            .from('sets')
            .insert(setsToInsert)
            .select();
            
          if (insertError) throw insertError;
          
          // Mise à jour locale
          setSets(prev => [...prev, ...insertedSets]);
        }
      }

      // 5. On met à jour l'état et on ouvre la séance
      setSessions(prev => [...prev, newSession]);
      openSession(newSession);

    } catch (error) {
      console.error(error);
      alert('Erreur lors du lancement de la routine : ' + error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Le nettoyage se fait dans le useEffect
  };

  // --- GESTION DES SESSIONS ---

  const getUserSessions = () => {
    if (!currentUser) return [];
    return sessions
      .filter(s => s.user_id === currentUser.id)
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getSessionSets = (sessionId) => sets.filter(s => s.session_id === sessionId);

  const createNewSession = async () => {
    if (!currentUser) return;
    if (!newSessionName.trim()) {
      alert('Donnez un nom à votre séance');
      return;
    }
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase.from('sessions').insert({
        user_id: currentUser.id,
        date: today,
        name: newSessionName.trim()
      }).select(); 

      if (error) throw error;
      if (data && data.length > 0) {
        setSessions(prev => [...prev, data[0]]);
        setNewSessionName('');
        openSession(data[0]);
      }
    } catch (error) {
      console.error(error);
      alert('Erreur création: ' + error.message);
    }
  };

  const openSession = (session) => {
    setCurrentSession(session);
    setCurrentPage('session');
    setMobileMenuOpen(false);
    localStorage.setItem('currentSessionId', session.id);
  };

  const deleteSession = async (sessionId) => {
    if (!window.confirm('Supprimer cette séance ?')) return;
    try {
      await supabase.from('sessions').delete().eq('id', sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      setSets(prev => prev.filter(set => set.session_id !== sessionId));
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        localStorage.removeItem('currentSessionId');
      }
      setCurrentPage('sessions');
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  const updateSession = async (sessionId, patch) => {
    try {
      await supabase.from('sessions').update(patch).eq('id', sessionId);
      setSessions(prev => prev.map(s => (s.id === sessionId ? { ...s, ...patch } : s)));
      if (currentSession?.id === sessionId) {
        setCurrentSession(prev => (prev ? { ...prev, ...patch } : prev));
      }
    } catch (error) {
      alert('Erreur lors de la mise à jour');
    }
  };

  // --- GESTION DES SÉRIES ---

  const addSetToSession = async () => {
    if (!currentUser || !currentSession) {
      alert("Créez/ouvrez une séance d'abord.");
      return;
    }
    if (!newSet.exerciseId || newSet.weight === '' || newSet.repetitions === '') {
      alert('Remplissez exercice, poids et répétitions');
      return;
    }

    const exerciseId = parseInt(newSet.exerciseId, 10);
    const exercise = exerciseById.get(exerciseId);
    const weightInput = parseFloat(newSet.weight);
    const repsInput = parseInt(newSet.repetitions, 10);

    if (!Number.isFinite(weightInput) || weightInput < 0) { alert('Poids invalide'); return; }
    if (!Number.isFinite(repsInput) || repsInput <= 0) { alert('Répétitions invalides'); return; }

    const effectiveWeight = exercise?.isBodyweight ? weightInput + userBodyweight : weightInput;

    try {
      const { data, error } = await supabase.from('sets').insert({
        session_id: currentSession.id,
        exercise_id: exerciseId,
        weight: effectiveWeight,
        display_weight: weightInput,
        repetitions: repsInput,
        rpe: newSet.rpe ? parseInt(newSet.rpe, 10) : null,
        note: (newSet.note || '').trim()
      }).select();

      if (error) throw error;

      if (data && data.length > 0) {
        setSets(prev => [...prev, data[0]]);
      }

      setNewSet({
        exerciseId: newSet.exerciseId,
        weight: newSet.weight,
        repetitions: newSet.repetitions,
        rpe: '',
        note: ''
      });

      // Démarrer le timer de repos
      startRestTimer(restDuration);

    } catch (error) {
      console.error(error);
      alert('Erreur ajout série: ' + error.message);
    }
  };

  const deleteSet = async (setId) => {
    if (!window.confirm('Supprimer cette série ?')) return;
    try {
      await supabase.from('sets').delete().eq('id', setId);
      setSets(prev => prev.filter(s => s.id !== setId));
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  // --- AJOUT : Modifier une série existante ---
  const updateSet = async (setId, patch) => {
    try {
      const { data, error } = await supabase
        .from('sets')
        .update(patch)
        .eq('id', setId)
        .select();

      if (error) throw error;

      // On met à jour l'affichage local instantanément
      setSets(prev => prev.map(s => s.id === setId ? data[0] : s));
    } catch (error) {
      console.error(error);
      alert('Erreur lors de la modification de la série');
    }
  };

  // --- STATISTIQUES & CALCULS ---

  const calculate1RM = (weight, reps) => weight * (1 + (0.0333 * reps));

  const getLastPerformance = (exerciseId) => {
    const userSessions = getUserSessions();
    const completedSessions = userSessions.filter(s => s.id !== currentSession?.id);
    if (completedSessions.length === 0) return null;
    // Parcourt les séances précédentes (de la plus récente à la plus ancienne) et renvoie la première qui contient l'exercice
    for (const session of completedSessions) {
      const lastSets = sets.filter(s => s.session_id === session.id && s.exercise_id === exerciseId);
      if (lastSets.length > 0) {
        return { date: session.date, sets: lastSets };
      }
    }
    return null;
  };

  const getExerciseProgressionData = (exerciseId) => {
    const userSessions = getUserSessions();
    const progressionData = {};
    userSessions.forEach(session => {
      const sessionSets = sets.filter(s => s.session_id === session.id && s.exercise_id === exerciseId);
      if (sessionSets.length > 0) {
        const maxWeight = Math.max(...sessionSets.map(s => s.weight));
        progressionData[session.date] = maxWeight;
      }
    });
    return Object.entries(progressionData)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .map(([date, weight]) => ({ date, weight }));
  };

  const getPersonalRecord = (exerciseId) => {
    const userSessions = getUserSessions();
    let maxWeight = 0;
    userSessions.forEach(session => {
      const sessionSets = sets.filter(s => s.session_id === session.id && s.exercise_id === exerciseId);
      sessionSets.forEach(set => {
        if (set.weight > maxWeight) maxWeight = set.weight;
      });
    });
    return maxWeight;
  };

  const getMuscleDistribution = () => {
    const userSessions = getUserSessions();
    const muscleCount = {};
    userSessions.forEach(session => {
      const sessionSets = sets.filter(s => s.session_id === session.id);
      sessionSets.forEach(set => {
        const exercise = exerciseById.get(set.exercise_id);
        if (exercise) {
          muscleCount[exercise.muscle_group] = (muscleCount[exercise.muscle_group] || 0) + 1;
        }
      });
    });
    return Object.entries(muscleCount).map(([name, value]) => ({ name, value }));
  };

  const getWeekStartMonday = (dateObj) => {
    const d = new Date(dateObj);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diffToMonday = (day === 0 ? -6 : 1 - day);
    d.setDate(d.getDate() + diffToMonday);
    return d;
  };

  const getStreakWeeks = () => {
    const userSessions = getUserSessions();
    if (userSessions.length === 0) return 0;
    const weekStarts = new Set(
      userSessions.map(s => getWeekStartMonday(new Date(s.date)).toISOString().slice(0, 10))
    );
    const sorted = Array.from(weekStarts)
      .map(d => new Date(d))
      .sort((a, b) => b - a);
    let streak = 1;
    for (let i = 0; i < sorted.length - 1; i++) {
      const diffDays = Math.round((sorted[i] - sorted[i + 1]) / (1000 * 60 * 60 * 24));
      if (diffDays === 7) streak += 1;
      else break;
    }
    return streak;
  };

  const getYearHeatmapData = () => {
    const userSessions = getUserSessions();
    const heatmap = {};
    userSessions.forEach(session => {
      const sessionSets = sets.filter(s => s.session_id === session.id);
      const volume = sessionSets.reduce((sum, set) => sum + (set.weight * set.repetitions), 0);
      heatmap[session.date] = (heatmap[session.date] || 0) + volume;
    });
    return heatmap;
  };

  // --- EFFECTS ---

  // Timer du repos avec système de timestamp
  useEffect(() => {
    if (!isRestTimerActive || !restEndTime) return;

    const checkTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((restEndTime - now) / 1000));

      setRestTimer(remaining);

      if (remaining <= 0) {
        setIsRestTimerActive(false);
        setRestEndTime(null);
        localStorage.removeItem('restEndTime');
        localStorage.removeItem('restDuration');
        setRestTimerDone(true);
        setTimeout(() => setRestTimerDone(false), 3000);
      }
    };

    checkTimer();
    const id = setInterval(checkTimer, 1000);

    return () => clearInterval(id);
  }, [isRestTimerActive, restEndTime]);

  // Recalculer le timer au retour de mise en veille
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const savedEnd = localStorage.getItem('restEndTime');
        if (savedEnd) {
          const endTime = parseInt(savedEnd, 10);
          const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
          if (remaining > 0) {
            setRestEndTime(endTime);
            setRestTimer(remaining);
            setIsRestTimerActive(true);
          } else {
            setIsRestTimerActive(false);
            setRestEndTime(null);
            setRestTimer(0);
            localStorage.removeItem('restEndTime');
            localStorage.removeItem('restDuration');
            setRestTimerDone(true);
            setTimeout(() => setRestTimerDone(false), 3000);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Restaurer la session active depuis le localStorage
  useEffect(() => {
    if (!currentSession && sessions.length > 0) {
      const savedSessionId = localStorage.getItem('currentSessionId');
      if (savedSessionId) {
        const found = sessions.find(s => s.id === parseInt(savedSessionId, 10));
        if (found) {
          setCurrentSession(found);
        } else {
          localStorage.removeItem('currentSessionId');
        }
      }
    }
  }, [sessions]);

  // Sauvegarder la page actuelle dans localStorage
  useEffect(() => {
    if (currentPage !== 'login') {
      localStorage.setItem('lastPage', currentPage);
    }
  }, [currentPage]);

  // Auth & Chargement initial
  useEffect(() => {
    // Charger les exercices AVANT l'auth check (non-bloquant)
    loadExercises();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const userWithPseudo = {
          ...session.user,
          pseudo: session.user.user_metadata?.pseudo || 'Utilisateur'
        };
        setCurrentUser(userWithPseudo);
        loadUserData(session.user.id);

        // Restaurer la dernière page visitée ou aller sur dashboard
        const lastPage = localStorage.getItem('lastPage');
        setCurrentPage(lastPage || 'dashboard');
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const userWithPseudo = {
          ...session.user,
          pseudo: session.user.user_metadata?.pseudo || 'Utilisateur'
        };
        setCurrentUser(userWithPseudo);
        loadUserData(session.user.id);

        // Restaurer la dernière page visitée ou aller sur dashboard
        const lastPage = localStorage.getItem('lastPage');
        setCurrentPage(lastPage || 'dashboard');
      } else {
        // Nettoyage sans appeler signOut pour éviter la boucle infinie
        setCurrentUser(null);
        setCurrentSession(null);
        setSelectedExercise(null);
        setCurrentPage('login');
        setMobileMenuOpen(false);
        setIsRestTimerActive(false);
        setRestTimer(0);
        setSessions([]);
        setSets([]);
        setNutritionLogs([]);
        setNutritionDataReady(false);
        setUserProfile(null);
        // Nettoyer la dernière page sauvegardée
        localStorage.removeItem('lastPage');
        localStorage.removeItem('currentSessionId');
        localStorage.removeItem('restEndTime');
        localStorage.removeItem('restDuration');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // --- VALEUR DU CONTEXT ---
  
  const contextValue = {
    // State
    isLoading, currentPage, setCurrentPage,
    currentUser, setCurrentUser,
    exercises, sessions, setSessions, sets, setSets, updateSet,
    currentSession, setCurrentSession,
    selectedExercise, setSelectedExercise,
    newSet, setNewSet,
    restDuration, setRestDuration, restTimer, setRestTimer,
    isRestTimerActive, setIsRestTimerActive,
    restTimerDone,
    userBodyweight, exerciseById,
    mobileMenuOpen, setMobileMenuOpen,
    loginEmail, setLoginEmail, loginPassword, setLoginPassword,
    newSessionName, setNewSessionName,
    nutritionLogs,
    nutritionDataReady,
    userProfile,
    // Fonctions Auth & Data
    loadUserData, handleRegister, handleLogin, handleLogout,
    // Fonctions Sessions
    getUserSessions, getSessionSets, createNewSession, openSession, deleteSession, updateSession,
    // Fonctions Sets
    addSetToSession, deleteSet,
    // Fonctions Stats
    getLastPerformance, getExerciseProgressionData, getPersonalRecord,
    getMuscleDistribution, getStreakWeeks, getYearHeatmapData, calculate1RM,
    // Fonctions Routines
    startRoutine,
    // Fonctions Nutrition
    getTodayNutrition, updateNutritionLog, updateWaterCount, getNutritionHistory,
    // Fonctions Profil
    loadUserProfile, updateUserProfile, calculateTodayCalories, getTodayWorkoutCalories,
    // Fonctions Timer
    startRestTimer
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <WorkoutContext.Provider value={contextValue}>
      {children}
    </WorkoutContext.Provider>
  );
};