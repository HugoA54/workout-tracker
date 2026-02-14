import React, { useContext } from 'react';
import { WorkoutContext } from '../context/WorkoutContext';
import NavBar from '../components/NavBar';
import { Calendar, Plus } from 'lucide-react';

const DashboardPage = () => {
  const {
    currentUser, getUserSessions, getStreakWeeks, getSessionSets, exerciseById, startRoutine,
    newSessionName, setNewSessionName, createNewSession, openSession
  } = useContext(WorkoutContext);

  const userSessions = getUserSessions();
  const lastSession = userSessions[0];
  const recentSessions = userSessions.slice(0, 5);
  const streakWeeks = getStreakWeeks();

  const groupSetsByExercise = (sessionId) => {
    const sessionSets = getSessionSets(sessionId);
    const grouped = {};
    sessionSets.forEach(set => {
      if (!grouped[set.exercise_id]) grouped[set.exercise_id] = [];
      grouped[set.exercise_id].push(set);
    });
    return grouped;
  };
  
  // Calcul des routines connues (Noms uniques)
  const knownRoutines = Array.from(new Set(userSessions.map(s => s.name))).slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Bienvenue, {currentUser.pseudo} 👋</h1>
          <p className="text-gray-600">Continuez votre progression !</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Bloc 1 : Streak */}
          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-md p-6 text-white">
            <span className="text-lg font-semibold">Streak 🔥</span>
            <p className="text-5xl font-bold mt-2">{streakWeeks}</p>
            <p className="text-sm opacity-90 mt-2">semaines consécutives</p>
          </div>

          {/* Bloc 2 : Dernière séance */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-indigo-600" />
              Dernière Séance
            </h2>
            {lastSession ? (
              <div>
                <p className="text-2xl font-bold text-indigo-600">{lastSession.name}</p>
                <p className="text-gray-600">{new Date(lastSession.date).toLocaleDateString('fr-FR')}</p>
                <div className="mt-4 space-y-3">
                  {Object.entries(groupSetsByExercise(lastSession.id)).map(([exerciseId, ssets]) => {
                    const ex = exerciseById.get(parseInt(exerciseId, 10));
                    return (
                      <div key={exerciseId} className="bg-gray-50 p-3 rounded-lg">
                        <p className="font-semibold text-gray-800 mb-2">{ex?.name}</p>
                        <div className="space-y-1">
                          {ssets.map((set, idx) => (
                            <div key={idx} className="text-sm text-gray-600 flex justify-between">
                              <span>Série {idx + 1}</span>
                              <span className="font-semibold text-indigo-600">
                                {(set.display_weight ?? set.weight)}kg × {set.repetitions}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Aucune séance enregistrée</p>
            )}
          </div>

          {/* Bloc 3 : NOUVELLE LOGIQUE (Routines + Création) */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Plus className="w-6 h-6 text-indigo-600" />
              Lancer une séance
            </h2>

            {/* Liste des routines existantes */}
            {knownRoutines.length > 0 && (
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-3 font-medium">MES ROUTINES HABITUELLES</p>
                <div className="grid grid-cols-2 gap-3">
                  {knownRoutines.map(routineName => (
                    <button
                      key={routineName}
                      onClick={() => startRoutine(routineName)}
                      className="px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-100 transition text-left truncate border border-indigo-100"
                    >
                      {routineName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Création manuelle */}
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-2">OU CRÉER UNE NOUVELLE</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="Ex: Leg Day"
                  className="flex-1 px-4 py-2 border rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button
                  onClick={createNewSession}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
                >
                  Go
                </button>
              </div>
            </div>
          </div>
          
          {/* 🗑️ J'AI SUPPRIMÉ L'ANCIEN BLOC "bg-gradient..." QUI ÉTAIT ICI EN DOUBLE */}

        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">5 Dernières Séances</h2>
          <div className="space-y-3">
            {recentSessions.map(session => (
              <div
                key={session.id}
                onClick={() => openSession(session)}
                className="cursor-pointer flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div>
                  <p className="font-semibold text-gray-800">{session.name}</p>
                  <p className="text-sm text-gray-600">{new Date(session.date).toLocaleDateString('fr-FR')}</p>
                </div>
                <span className="text-sm text-gray-500">{getSessionSets(session.id).length} séries</span>
              </div>
            ))}
            {recentSessions.length === 0 && <p className="text-gray-500">Aucune séance.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;