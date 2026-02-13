import React, { useContext, useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { WorkoutContext } from '../context/WorkoutContext'; // 👈 Import du context
import NavBar from '../components/NavBar';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';

const ExerciseDetailPage = () => {
  const { selectedExercise, setCurrentPage, getExerciseProgressionData, getPersonalRecord, getUserSessions, sets, calculate1RM } = useContext(WorkoutContext);

  if (!selectedExercise) return null;

  const progressionData = getExerciseProgressionData(selectedExercise.id);
  const pr = getPersonalRecord(selectedExercise.id);

  const get1RMProgression = () => {
    const userSessions = getUserSessions();
    const progression = [];

    userSessions.forEach(session => {
      const sessionSets = sets.filter(s => s.session_id === session.id && s.exercise_id === selectedExercise.id);
      if (sessionSets.length > 0) {
        const max1RM = Math.max(...sessionSets.map(s => calculate1RM(s.weight, s.repetitions)));
        progression.push({ date: session.date, rm: parseFloat(max1RM.toFixed(1)) });
      }
    });

    return progression.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getVolumeProgression = () => {
    const userSessions = getUserSessions();
    const volumes = [];

    userSessions.forEach(session => {
      const sessionSets = sets.filter(s => s.session_id === session.id && s.exercise_id === selectedExercise.id);
      if (sessionSets.length > 0) {
        const totalVolume = sessionSets.reduce((sum, set) => sum + (set.weight * set.repetitions), 0);
        volumes.push({ date: session.date, volume: Math.round(totalVolume) });
      }
    });

    return volumes.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const rm1Data = get1RMProgression();
  const volumeData = getVolumeProgression();
  const current1RM = rm1Data.length > 0 ? rm1Data[rm1Data.length - 1].rm : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <button onClick={() => setCurrentPage('exercises')} className="mb-6 text-indigo-600 hover:text-indigo-800 font-semibold">
          ← Retour aux exercices
        </button>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{selectedExercise.name}</h1>
          <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full">
            {selectedExercise.muscle_group}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-md p-8 text-white text-center">
            <p className="text-lg mb-2">Personal Record 🏆</p>
            <p className="text-5xl font-bold">{pr} kg</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md p-8 text-white text-center">
            <p className="text-lg mb-2">1RM Estimé 📈</p>
            <p className="text-5xl font-bold">{current1RM} kg</p>
            <p className="text-sm opacity-90 mt-2">Force maximale théorique</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">📈 Évolution du 1RM Estimé</h2>
          {rm1Data.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rm1Data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => `${value} kg`}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('fr-FR')}
                  />
                  <Line type="monotone" dataKey="rm" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12">Aucune donnée. Commence à tracker cet exercice.</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">📊 Volume Total par Séance</h2>
          {volumeData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => `${value} (kg×reps)`}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('fr-FR')}
                  />
                  <Line type="monotone" dataKey="volume" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12">Aucune donnée de volume.</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Progression Poids Max</h2>
          {progressionData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => `${value} kg`}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('fr-FR')}
                  />
                  <Line type="monotone" dataKey="weight" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12">Aucune donnée de progression.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExerciseDetailPage;