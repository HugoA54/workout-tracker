import React, { useContext, useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { WorkoutContext } from '../context/WorkoutContext'; // 👈 Import du context

const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center">
    <div className="text-center">
      <Dumbbell className="w-16 h-16 text-indigo-600 animate-pulse mx-auto mb-4" />
      <p className="text-gray-600">Chargement...</p>
    </div>
  </div>
);
export default LoadingScreen;