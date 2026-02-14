import React, { useContext, useState, useEffect } from 'react';
import { WorkoutContext } from '../context/WorkoutContext';
import NavBar from '../components/NavBar';
import { Trash2, Edit2, CheckCircle, XCircle, Clock } from 'lucide-react'; // Imports icônes

const SessionPage = () => {
  const {
    currentSession, updateSession, deleteSession, setCurrentPage,
    isRestTimerActive, setIsRestTimerActive, restTimer, setRestTimer,
    restTimerDone,
    restDuration, setRestDuration, newSet, setNewSet, exercises,
    exerciseById, addSetToSession, sets, deleteSet, updateSet, // ðŸ'ˆ On a besoin de updateSet
    getLastPerformance, userBodyweight, startRestTimer
  } = useContext(WorkoutContext); // 👆 On a besoin de updateSet elsewhere

  const [isEditingSession, setIsEditingSession] = useState(false);
  const [editSessionName, setEditSessionName] = useState('');
  const [editSessionDate, setEditSessionDate] = useState('');

  // NOUVEAU : État pour savoir si on modifie une série
  const [editingSetId, setEditingSetId] = useState(null);

  useEffect(() => {
    if (!currentSession) return;
    setEditSessionName(currentSession.name);
    setEditSessionDate(currentSession.date);
    setIsEditingSession(false);
  }, [currentSession]);

  if (!currentSession) return null;

  const currentSets = sets.filter(s => s.session_id === currentSession.id);
  // On trie pour garder l'ordre d'ajout (important pour les routines)
  currentSets.sort((a, b) => a.id - b.id);

  const selectedExerciseObj = newSet.exerciseId ? exerciseById.get(parseInt(newSet.exerciseId, 10)) : null;
  const lastPerf = newSet.exerciseId ? getLastPerformance(parseInt(newSet.exerciseId, 10)) : null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // --- FONCTION INTELLIGENTE DE VALIDATION ---
  const handleSaveSet = async () => {
    if (editingSetId) {
      // MODE MODIFICATION
      const weightInput = parseFloat(newSet.weight);
      const repsInput = parseInt(newSet.repetitions, 10);

      // On recalcule le poids effectif
      const ex = exerciseById.get(parseInt(newSet.exerciseId));
      const effectiveWeight = ex?.isBodyweight ? weightInput + userBodyweight : weightInput;

      await updateSet(editingSetId, {
        weight: effectiveWeight,
        display_weight: weightInput,
        repetitions: repsInput,
        rpe: newSet.rpe ? parseInt(newSet.rpe) : null,
        note: newSet.note
      });

      // On quitte le mode d'édition
      setEditingSetId(null);
      setNewSet({ exerciseId: newSet.exerciseId, weight: '', repetitions: '', rpe: '', note: '' });

      // On lance le repos
      startRestTimer(restDuration);

    } else {
      // MODE CRÉATION (Classique)
      await addSetToSession();
    }
  };

  // --- QUAND ON CLIQUE SUR UNE SÉRIE DE LA LISTE ---
  const handleEditClick = (set) => {
    setEditingSetId(set.id);
    // On remplit le formulaire avec les infos de la série cliquée
    setNewSet({
      exerciseId: set.exercise_id,
      weight: set.display_weight || 0,
      repetitions: set.repetitions || 0,
      rpe: set.rpe || '',
      note: set.note || ''
    });
    // On remonte en haut de page pour voir le formulaire
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingSetId(null);
    setNewSet({ exerciseId: '', weight: '', repetitions: '', rpe: '', note: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <NavBar />
      <div className="max-w-4xl mx-auto p-4 md:p-8">

        {/* --- EN-TÊTE SÉANCE --- */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              {!isEditingSession ? (
                <>
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">{currentSession.name}</h1>
                  <p className="text-gray-600">{new Date(currentSession.date).toLocaleDateString('fr-FR')}</p>
                </>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Nom</label>
                    <input value={editSessionName} onChange={(e) => setEditSessionName(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Date</label>
                    <input type="date" value={editSessionDate} onChange={(e) => setEditSessionDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {!isEditingSession ? (
                <button onClick={() => setIsEditingSession(true)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-semibold text-sm">
                  Modifier
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      updateSession(currentSession.id, { name: editSessionName, date: editSessionDate });
                      setIsEditingSession(false);
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-sm"
                  >
                    OK
                  </button>
                  <button onClick={() => setIsEditingSession(false)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-semibold text-sm">
                    X
                  </button>
                </>
              )}
              <button onClick={() => deleteSession(currentSession.id)} className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-semibold text-sm">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* --- TIMER --- */}
        {isRestTimerActive && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg p-4 mb-6 text-white flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6" />
              <span className="text-2xl font-bold">{formatTime(Math.max(restTimer, 0))}</span>
            </div>
            <button onClick={() => { setIsRestTimerActive(false); setRestTimer(0); localStorage.removeItem('restEndTime'); localStorage.removeItem('restDuration'); }} className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-semibold">
              Passer
            </button>
          </div>
        )}
        {!isRestTimerActive && restTimerDone && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg p-4 mb-6 text-white flex items-center justify-center gap-3">
            <CheckCircle className="w-6 h-6" />
            <span className="text-2xl font-bold">Timer fini !</span>
          </div>
        )}

        {/* --- FORMULAIRE --- */}
        <div className={`bg-white rounded-xl shadow-md p-6 mb-6 transition-all ${editingSetId ? 'ring-2 ring-indigo-500' : ''}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {editingSetId ? '✍️ Modifier la série' : 'Ajouter une série'}
            </h2>
            <div className="flex items-center gap-2 text-sm">
              <label className="text-gray-600">Repos:</label>
              <select value={restDuration} onChange={(e) => setRestDuration(parseInt(e.target.value, 10))} className="px-2 py-1 border border-gray-300 rounded">
                <option value="10">10s</option>
                <option value="60">1min</option>
                <option value="90">1min30</option>
                <option value="120">2min</option>
                <option value="180">3min</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Exercice</label>
              <select
                value={newSet.exerciseId}
                onChange={(e) => setNewSet({ exerciseId: e.target.value, weight: '', repetitions: '', rpe: '', note: '' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                disabled={!!editingSetId} // On empêche de changer l'exo en mode d'édition pour éviter les erreurs
              >
                <option value="">Choisir exercice</option>
                {exercises.map(ex => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
            </div>

            {lastPerf  && (
              <div className="md:col-span-2 bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center gap-3">
                 <span className="text-blue-500 font-bold text-sm">Précédent :</span>
                 <div className="flex gap-2 overflow-x-auto">
                  {lastPerf.sets.map((s, idx) => (
                    <span key={idx} className="text-xs bg-white px-2 py-1 rounded border border-blue-100 text-blue-700">
                      {s.display_weight}kg × {s.repetitions}
                    </span>
                  ))}
                 </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poids (kg) {selectedExerciseObj?.isBodyweight ? `+ ${userBodyweight}kg PDC` : ''}
              </label>
              <input type="number" step="0.5" value={newSet.weight} onChange={(e) => setNewSet(prev => ({ ...prev, weight: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="0" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Répétitions</label>
              <input type="number" value={newSet.repetitions} onChange={(e) => setNewSet(prev => ({ ...prev, repetitions: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="0" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">RPE (1-10)</label>
              <input type="number" min="1" max="10" value={newSet.rpe} onChange={(e) => setNewSet(prev => ({ ...prev, rpe: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="-" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
              <input type="text" value={newSet.note} onChange={(e) => setNewSet(prev => ({ ...prev, note: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="..." />
            </div>
          </div>

          <div className="flex gap-3">
             {editingSetId && (
               <button onClick={handleCancelEdit} className="w-1/3 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition">
                 Annuler
               </button>
             )}
             <button onClick={handleSaveSet} className={`flex-1 ${editingSetId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'} text-white py-3 rounded-lg font-semibold transition shadow-lg`}>
               {editingSetId ? '✓ Sauvegarder la modification' : 'Valider la série'}
             </button>
          </div>
        </div>

        {/* --- LISTE DES SÉRIES --- */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Séries enregistrées ({currentSets.length})</h2>

          <div className="space-y-4">
            {(() => {
              // Grouper par exercice en conservant l’ordre de première apparition
              const groups = [];
              const seen = new Map();
              currentSets.forEach(s => {
                if (!seen.has(s.exercise_id)) {
                  seen.set(s.exercise_id, groups.length);
                  groups.push({ exercise_id: s.exercise_id, sets: [] });
                }
                groups[seen.get(s.exercise_id)].sets.push(s);
              });

              if (groups.length === 0) return <p className="text-gray-500 text-center py-4">Commence ta séance !</p>;

              return groups.map(group => {
                const ex = exerciseById.get(group.exercise_id);
                return (
                  <div key={group.exercise_id} className="rounded-xl border border-gray-200 overflow-hidden">
                    {/* En-tête du groupe */}
                    <div className="bg-indigo-50 px-4 py-2 flex items-center justify-between">
                      <span className="font-bold text-indigo-700">{ex?.name}</span>
                      <span className="text-xs text-indigo-400">{group.sets.length} série{group.sets.length > 1 ? "s" : ""}</span>
                    </div>
                    {/* Séries du groupe */}
                    <div className="divide-y divide-gray-100">
                      {group.sets.map((s, idx) => {
                        const isPlaceholder = s.weight === 0 && s.repetitions === 0;
                        return (
                          <div
                            key={s.id}
                            onClick={() => handleEditClick(s)}
                            className={`flex justify-between items-center px-4 py-3 transition cursor-pointer group ${
                              isPlaceholder
                                ? "bg-yellow-50 hover:bg-yellow-100"
                                : "bg-white hover:bg-gray-50"
                            } ${editingSetId === s.id ? "ring-2 ring-inset ring-indigo-500 bg-indigo-50" : ""}`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-400 w-5">#{idx + 1}</span>
                                {isPlaceholder ? (
                                  <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full font-bold">
                                    À FAIRE
                                  </span>
                                ) : (
                                  <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded">
                                    {(s.display_weight ?? s.weight)}kg × {s.repetitions}
                                  </span>
                                )}
                                {s.rpe && <span className="text-xs text-gray-400">RPE {s.rpe}</span>}
                              </div>
                              {s.note && <p className="text-sm text-gray-500 mt-1 italic ml-8">💬 {s.note}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              <Edit2 className="w-4 h-4 text-gray-300 group-hover:text-indigo-400" />
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteSet(s.id); }}
                                className="p-1.5 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          <button onClick={() => setCurrentPage('sessions')} className="mt-8 w-full bg-gray-100 text-gray-600 py-3 rounded-lg font-semibold hover:bg-gray-200 transition">
            Retour aux séances
          </button>
        </div>

      </div>
    </div>
  );
};

export default SessionPage;
