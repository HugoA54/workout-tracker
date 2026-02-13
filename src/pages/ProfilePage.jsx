import { useState, useEffect, useContext } from 'react';
import { User, Scale, Ruler, Calendar, Activity, Target, Save, AlertCircle, Apple } from 'lucide-react';
import NavBar from '../components/NavBar';
import { WorkoutContext } from '../context/WorkoutContext';
import { calculateBMR, calculateTDEE } from '../utils/calorieCalculations';

const ProfilePage = () => {
    const { userProfile, updateUserProfile, setCurrentPage } = useContext(WorkoutContext);

    const [weight, setWeight] = useState(75);
    const [height, setHeight] = useState(175);
    const [age, setAge] = useState(25);
    const [gender, setGender] = useState('male');
    const [activityLevel, setActivityLevel] = useState('moderate');
    const [goal, setGoal] = useState('maintain');
    const [useAutoCalculation, setUseAutoCalculation] = useState(true);
    const [manualCalorieGoal, setManualCalorieGoal] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [errors, setErrors] = useState({});

    // Charger les données du profil
    useEffect(() => {
        if (userProfile) {
            setWeight(userProfile.weight || 75);
            setHeight(userProfile.height || 175);
            setAge(userProfile.age || 25);
            setGender(userProfile.gender || 'male');
            setActivityLevel(userProfile.activity_level || 'moderate');
            setGoal(userProfile.goal || 'maintain');
            setUseAutoCalculation(userProfile.use_auto_calculation !== false);
            setManualCalorieGoal(userProfile.manual_calorie_goal || '');
        }
    }, [userProfile]);

    // Calculer BMR et TDEE en temps réel
    const bmr = calculateBMR(weight, height, age, gender);
    const tdee = calculateTDEE(bmr, activityLevel);

    // Validation
    const validateForm = () => {
        const newErrors = {};

        if (weight < 30 || weight > 300) {
            newErrors.weight = 'Le poids doit être entre 30 et 300 kg';
        }
        if (height < 100 || height > 250) {
            newErrors.height = 'La taille doit être entre 100 et 250 cm';
        }
        if (age < 13 || age > 100) {
            newErrors.age = 'L\'âge doit être entre 13 et 100 ans';
        }
        if (!useAutoCalculation && (!manualCalorieGoal || manualCalorieGoal < 1000 || manualCalorieGoal > 10000)) {
            newErrors.manualGoal = 'L\'objectif manuel doit être entre 1000 et 10000 kcal';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Sauvegarder le profil
    const handleSave = async () => {
        if (!validateForm()) {
            setSaveMessage('Veuillez corriger les erreurs');
            return;
        }

        setIsSaving(true);
        setSaveMessage('');

        const profileData = {
            weight: parseFloat(weight),
            height: parseInt(height),
            age: parseInt(age),
            gender,
            activity_level: activityLevel,
            goal,
            use_auto_calculation: useAutoCalculation,
            manual_calorie_goal: useAutoCalculation ? null : parseInt(manualCalorieGoal) || null
        };

        const result = await updateUserProfile(profileData);

        setIsSaving(false);

        if (result.success) {
            setSaveMessage('✅ Profil sauvegardé! Vos objectifs caloriques ont été mis à jour.');
            setTimeout(() => setSaveMessage(''), 5000);
        } else {
            setSaveMessage('❌ Erreur lors de la sauvegarde: ' + (result.error || 'Erreur inconnue'));
        }
    };

    return (
        <>
            <NavBar />
            <div className="max-w-4xl mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
                    <User className="w-8 h-8 text-indigo-600" /> Mon Profil
                </h1>

                {/* Données biométriques */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Scale className="w-6 h-6 text-indigo-600" />
                        Données biométriques
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Poids */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Poids (kg)
                            </label>
                            <input
                                type="number"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.weight ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.weight && <p className="text-red-500 text-sm mt-1">{errors.weight}</p>}
                        </div>

                        {/* Taille */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Taille (cm)
                            </label>
                            <input
                                type="number"
                                value={height}
                                onChange={(e) => setHeight(e.target.value)}
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.height ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.height && <p className="text-red-500 text-sm mt-1">{errors.height}</p>}
                        </div>

                        {/* Âge */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Âge (années)
                            </label>
                            <input
                                type="number"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.age ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
                        </div>

                        {/* Sexe */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sexe
                            </label>
                            <select
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="male">Homme</option>
                                <option value="female">Femme</option>
                                <option value="other">Autre</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Activité & Objectifs */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-indigo-600" />
                        Activité & Objectifs
                    </h2>

                    <div className="space-y-4">
                        {/* Niveau d'activité */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Niveau d'activité quotidien
                            </label>
                            <select
                                value={activityLevel}
                                onChange={(e) => setActivityLevel(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="sedentary">Sédentaire (peu ou pas d'exercice)</option>
                                <option value="light">Légèrement actif (exercice léger 1-3 jours/semaine)</option>
                                <option value="moderate">Modérément actif (exercice modéré 3-5 jours/semaine)</option>
                                <option value="active">Actif (exercice intense 6-7 jours/semaine)</option>
                                <option value="very_active">Très actif (exercice très intense, travail physique)</option>
                            </select>
                        </div>

                        {/* Objectif */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Objectif
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => setGoal('cut')}
                                    className={`px-4 py-3 rounded-lg border-2 transition-all ${goal === 'cut' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-300 hover:border-red-300'}`}
                                >
                                    <Target className="w-5 h-5 mx-auto mb-1" />
                                    <div className="text-sm font-semibold">Sèche</div>
                                    <div className="text-xs">-15% calories</div>
                                </button>
                                <button
                                    onClick={() => setGoal('maintain')}
                                    className={`px-4 py-3 rounded-lg border-2 transition-all ${goal === 'maintain' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-blue-300'}`}
                                >
                                    <Target className="w-5 h-5 mx-auto mb-1" />
                                    <div className="text-sm font-semibold">Maintien</div>
                                    <div className="text-xs">Maintenance</div>
                                </button>
                                <button
                                    onClick={() => setGoal('bulk')}
                                    className={`px-4 py-3 rounded-lg border-2 transition-all ${goal === 'bulk' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 hover:border-green-300'}`}
                                >
                                    <Target className="w-5 h-5 mx-auto mb-1" />
                                    <div className="text-sm font-semibold">Prise de masse</div>
                                    <div className="text-xs">+10% calories</div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Métriques calculées */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Métriques calculées</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4">
                            <div className="text-sm text-gray-600 mb-1">BMR (Métabolisme de base)</div>
                            <div className="text-3xl font-bold text-indigo-600">{bmr}</div>
                            <div className="text-xs text-gray-500">kcal/jour</div>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                            <div className="text-sm text-gray-600 mb-1">TDEE (Dépense totale)</div>
                            <div className="text-3xl font-bold text-purple-600">{tdee}</div>
                            <div className="text-xs text-gray-500">kcal/jour</div>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                        Ces valeurs sont calculées en temps réel en fonction de vos données biométriques et de votre niveau d'activité.
                    </p>
                </div>

                {/* Mode manuel (optionnel) */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Mode manuel</h2>
                        <label className="flex items-center cursor-pointer">
                            <span className="mr-3 text-sm text-gray-600">
                                {useAutoCalculation ? 'Auto' : 'Manuel'}
                            </span>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={!useAutoCalculation}
                                    onChange={() => setUseAutoCalculation(!useAutoCalculation)}
                                    className="sr-only"
                                />
                                <div
                                    className={`block w-14 h-8 rounded-full transition-colors ${!useAutoCalculation ? 'bg-indigo-600' : 'bg-gray-300'}`}
                                ></div>
                                <div
                                    className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${!useAutoCalculation ? 'transform translate-x-6' : ''}`}
                                ></div>
                            </div>
                        </label>
                    </div>

                    {!useAutoCalculation && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Objectif calorique manuel (kcal)
                            </label>
                            <input
                                type="number"
                                value={manualCalorieGoal}
                                onChange={(e) => setManualCalorieGoal(e.target.value)}
                                placeholder="Ex: 2500"
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.manualGoal ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.manualGoal && <p className="text-red-500 text-sm mt-1">{errors.manualGoal}</p>}
                            <p className="text-sm text-gray-500 mt-2">
                                <AlertCircle className="w-4 h-4 inline mr-1" />
                                En mode manuel, vos calories ne s'ajusteront pas automatiquement.
                            </p>
                        </div>
                    )}
                </div>

                {/* Boutons */}
                <div className="flex flex-col gap-4">
                    {saveMessage && (
                        <div className={`p-4 rounded-lg ${saveMessage.includes('✅') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            <p className={`text-sm ${saveMessage.includes('✅') ? 'text-green-700' : 'text-red-700'}`}>
                                {saveMessage}
                            </p>
                            {saveMessage.includes('✅') && (
                                <button
                                    onClick={() => setCurrentPage('nutrition')}
                                    className="mt-2 text-sm text-green-700 hover:text-green-800 font-semibold flex items-center gap-1"
                                >
                                    <Apple className="w-4 h-4" />
                                    Voir mes nouveaux objectifs caloriques →
                                </button>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-5 h-5" />
                            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProfilePage;
