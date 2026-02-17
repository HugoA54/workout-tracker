import React, { useContext, useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { WorkoutContext } from '../context/WorkoutContext'; // 👈 Import du context
import NavBar from '../components/NavBar';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffbb96'];

const StatsPage = () => {
  const { getMuscleDistribution, getYearHeatmapData, getStreakWeeks, getUserSessions } = useContext(WorkoutContext);
  const muscleData = getMuscleDistribution();
  const heatmapData = getYearHeatmapData();
  const streakWeeks = getStreakWeeks();

  // Génère une grille organisée par semaines (colonnes) et jours (lignes) pour un rendu style GitHub
  const generateWeeks = () => {
    const today = new Date();
    const year = today.getFullYear();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const weeks = [];
    let week = new Array(7).fill(null);
    const d = new Date(startDate);
    while (d <= endDate) {
      const dateStr = d.toISOString().split('T')[0];
      const volume = heatmapData[dateStr] || 0;
      const dayOfWeek = d.getDay(); // 0 = dimanche ... 6 = samedi
      week[dayOfWeek] = { date: dateStr, volume };
      if (dayOfWeek === 6) {
        weeks.push(week);
        week = new Array(7).fill(null);
      }
      d.setDate(d.getDate() + 1);
    }
    // pousser la dernière semaine (même si incomplète)
    weeks.push(week);
    return weeks;
  };

  const weeks = generateWeeks();
  const nonZeroDays = Object.values(heatmapData).filter(v => v > 0).length;
  const maxVolume = Math.max(...Object.values(heatmapData), 1);

  const getIntensityColor = (volume) => {
    if (volume === 0) return 'bg-gray-100';
    const intensity = volume / maxVolume;
    if (intensity > 0.75) return 'bg-green-600';
    if (intensity > 0.5) return 'bg-green-500';
    if (intensity > 0.25) return 'bg-green-400';
    return 'bg-green-300';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Statistiques Globales</h1>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-md p-8 text-white text-center">
            <p className="text-2xl mb-2">Streak Actuel 🔥</p>
            <p className="text-6xl font-bold">{streakWeeks}</p>
            <p className="text-lg opacity-90 mt-3">semaines consécutives</p>
            <p className="text-sm opacity-75 mt-2">Don't break the chain!</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md p-8 text-white text-center">
            <p className="text-2xl mb-2">Total Séances 📅</p>
            <p className="text-6xl font-bold">{getUserSessions().length}</p>
            <p className="text-lg opacity-90 mt-3">séances enregistrées</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🟩 Heatmap de l'année</h2>
          <p className="text-sm text-gray-600 mb-6">Plus le vert est foncé, plus le volume était élevé</p>

          <p className="text-sm text-gray-500 mb-2">Jours actifs : <strong>{nonZeroDays}</strong> — Volume max : <strong>{Math.round(maxVolume)}</strong></p>

          <div className="overflow-x-auto pb-4">
            <div className="inline-flex gap-1">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1">
                  {week.map((day, idx) => (
                    <div
                      key={`${wIdx}-${idx}`}
                      className={`w-3 h-3 rounded-sm ${getIntensityColor(day?.volume || 0)} hover:ring-2 hover:ring-indigo-400 transition-all cursor-pointer`}
                      title={day ? `${new Date(day.date).toLocaleDateString('fr-FR')} - ${Math.round(day.volume)} (kg×reps)` : ''}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4 text-xs text-gray-600">
            <span>Moins</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-300 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
            </div>
            <span>Plus</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Répartition Musculaire</h2>
          {muscleData.length > 0 ? (
            <div style={{ width: '100%', height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={muscleData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {muscleData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12">Commence à enregistrer des séances pour voir tes stats.</p>
          )}
        </div>
      </div>
    </div>
  );
};


export default StatsPage;