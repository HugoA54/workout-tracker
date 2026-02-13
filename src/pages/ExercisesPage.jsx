import React, { useContext, useState } from 'react';
import { Dumbbell, TrendingUp } from 'lucide-react';
import { WorkoutContext } from '../context/WorkoutContext'; // 👈 Import du context
import NavBar from '../components/NavBar';

const ExercisesPage = () => {
  const { exercises, getPersonalRecord, setSelectedExercise, setCurrentPage } = useContext(WorkoutContext);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Bibliothèque d'Exercices</h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercises.map(exercise => {
            const pr = getPersonalRecord(exercise.id);
            return (
              <div
                key={exercise.id}
                onClick={() => { setSelectedExercise(exercise); setCurrentPage('exerciseDetail'); }}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{exercise.name}</h3>
                    <span className="inline-block mt-2 px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                      {exercise.muscle_group}
                    </span>
                  </div>
                  <TrendingUp className="w-6 h-6 text-indigo-600" />
                </div>

                {pr > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">Personal Record</p>
                    <p className="text-2xl font-bold text-indigo-600">{pr} kg</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


export default ExercisesPage;