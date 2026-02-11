// src/components/NavBar.jsx
import React, { useContext } from 'react';
import { Dumbbell, Home, Calendar, BarChart3, LogOut, Menu, X, Apple, User, UtensilsCrossed, CalendarDays, ShoppingCart } from 'lucide-react';
import { WorkoutContext } from '../context/WorkoutContext'; // 👈 Chemin mis à jour

const NavBar = () => {
  const { currentUser, setCurrentPage, handleLogout, mobileMenuOpen, setMobileMenuOpen } = useContext(WorkoutContext);

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <Dumbbell className="w-8 h-8" />
            <span className="text-2xl font-bold">Nokka</span>
          </div>

          {currentUser && (
            <>
              <div className="hidden md:flex gap-6">
                <button onClick={() => setCurrentPage('dashboard')} className="hover:text-indigo-200 transition flex items-center gap-2">
                  <Home className="w-5 h-5" /> Dashboard
                </button>
                <button onClick={() => setCurrentPage('sessions')} className="hover:text-indigo-200 transition flex items-center gap-2">
                  <Calendar className="w-5 h-5" /> Séances
                </button>
                <button onClick={() => setCurrentPage('exercises')} className="hover:text-indigo-200 transition flex items-center gap-2">
                  <Dumbbell className="w-5 h-5" /> Exercices
                </button>
                <button onClick={() => setCurrentPage('stats')} className="hover:text-indigo-200 transition flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" /> Stats
                </button>
                <button onClick={() => setCurrentPage('leaderboard')} className="hover:text-indigo-200 transition flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" /> LeaderBoard
                </button>
                <button onClick={() => setCurrentPage('nutrition')} className="hover:text-indigo-200 transition flex items-center gap-2">
                  <Apple className="w-5 h-5" /> Nutrition
                </button>
                <button onClick={() => setCurrentPage('meals')} className="hover:text-indigo-200 transition flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5" /> Repas
                </button>
                <button onClick={() => setCurrentPage('mealPrep')} className="hover:text-indigo-200 transition flex items-center gap-2">
                  <CalendarDays className="w-5 h-5" /> Meal Prep
                </button>
                <button onClick={() => setCurrentPage('shoppingList')} className="hover:text-indigo-200 transition flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" /> Courses
                </button>
                <button onClick={() => setCurrentPage('profile')} className="hover:text-indigo-200 transition flex items-center gap-2">
                  <User className="w-5 h-5" /> Profil
                </button>
                <button onClick={handleLogout} className="hover:text-indigo-200 transition flex items-center gap-2">
                  <LogOut className="w-5 h-5" /> Déconnexion
                </button>


              </div>

              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden">
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </>
          )}
        </div>
      </div>

      {mobileMenuOpen && currentUser && (
        <div className="md:hidden bg-indigo-700 px-4 py-3 space-y-2">
          <button onClick={() => { setCurrentPage('dashboard'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 hover:bg-indigo-600 px-3 rounded">Dashboard</button>
          <button onClick={() => { setCurrentPage('sessions'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 hover:bg-indigo-600 px-3 rounded">Séances</button>
          <button onClick={() => { setCurrentPage('exercises'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 hover:bg-indigo-600 px-3 rounded">Exercices</button>
          <button onClick={() => { setCurrentPage('stats'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 hover:bg-indigo-600 px-3 rounded">Stats</button>
                    <button onClick={() => { setCurrentPage('leaderboard'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 hover:bg-indigo-600 px-3 rounded">LeaderBoard</button>
                    <button onClick={() => { setCurrentPage('nutrition'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 hover:bg-indigo-600 px-3 rounded">Nutrition</button>
          <button onClick={() => { setCurrentPage('meals'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 hover:bg-indigo-600 px-3 rounded">Repas</button>
          <button onClick={() => { setCurrentPage('mealPrep'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 hover:bg-indigo-600 px-3 rounded">Meal Prep</button>
          <button onClick={() => { setCurrentPage('shoppingList'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 hover:bg-indigo-600 px-3 rounded">Courses</button>
          <button onClick={() => { setCurrentPage('profile'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 hover:bg-indigo-600 px-3 rounded">Profil</button>
          <button onClick={handleLogout} className="block w-full text-left py-2 hover:bg-indigo-600 px-3 rounded">Déconnexion</button>
        </div>
      )}
    </nav>
  );
};

export default NavBar; // N'oublie pas d'exporter !