// src/App.jsx
import React, { useContext } from 'react';
import { WorkoutProvider, WorkoutContext } from './context/WorkoutContext';
import { FoodProvider } from './context/FoodContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen';


// Import des pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SessionsPage from './pages/SessionsPage';
import SessionPage from './pages/SessionPage';
import ExercisesPage from './pages/ExercisesPage';
import ExerciseDetailPage from './pages/ExerciseDetailPage';
import StatsPage from './pages/StatsPage';
import LeaderBoardPage from './pages/LeaderBoardPage';
import NutritionPage from './pages/NutritionPage';
import ProfilePage from './pages/ProfilePage';
// Pages système alimentaire
import FoodDatabasePage from './pages/FoodDatabasePage';
import MealsPage from './pages/MealsPage';
import MealEditorPage from './pages/MealEditorPage';
import MealPrepPage from './pages/MealPrepPage';
import ShoppingListPage from './pages/ShoppingListPage';

// Ce petit composant sert juste à choisir quelle page afficher
const AppContent = () => {
  const { currentUser, currentPage, isLoading } = useContext(WorkoutContext);

  if (isLoading) return <LoadingScreen />;

  return (
    <FoodProvider currentUser={currentUser}>
      <div className="min-h-screen bg-gray-50">
        {!currentUser && <LoginPage />}
        {currentUser && currentPage === 'dashboard' && <DashboardPage />}
        {currentUser && currentPage === 'sessions' && <SessionsPage />}
        {currentUser && currentPage === 'session' && <SessionPage />}
        {currentUser && currentPage === 'exercises' && <ExercisesPage />}
        {currentUser && currentPage === 'exerciseDetail' && <ExerciseDetailPage />}
        {currentUser && currentPage === 'stats' && <StatsPage />}
        {currentUser && currentPage === 'leaderboard' && <LeaderBoardPage />}
        {currentUser && currentPage === 'nutrition' && <NutritionPage />}
        {currentUser && currentPage === 'profile' && <ProfilePage />}
        {/* Pages système alimentaire */}
        {currentUser && currentPage === 'foodDatabase' && <FoodDatabasePage />}
        {currentUser && currentPage === 'meals' && <MealsPage />}
        {currentUser && currentPage === 'mealEditor' && <MealEditorPage />}
        {currentUser && currentPage === 'mealPrep' && <MealPrepPage />}
        {currentUser && currentPage === 'shoppingList' && <ShoppingListPage />}
      </div>
    </FoodProvider>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <WorkoutProvider>
        <AppContent />
      </WorkoutProvider>
    </ErrorBoundary>
  );
};

export default App;