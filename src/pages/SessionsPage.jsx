import React, { useContext, useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { WorkoutContext } from '../context/WorkoutContext'; // 👈 Import du context
import NavBar from '../components/NavBar';

const SessionsPage = () => {
  const { getUserSessions, setCurrentPage, openSession, deleteSession, getSessionSets } = useContext(WorkoutContext);
  const userSessions = getUserSessions();

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Toutes mes séances</h1>
          <button onClick={() => setCurrentPage('dashboard')} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-semibold">
            Retour
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {userSessions.length === 0 ? (
            <div className="p-6 text-gray-500">Aucune séance.</div>
          ) : (
            <div className="divide-y">
              {userSessions.map(s => (
                <div key={s.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="cursor-pointer" onClick={() => openSession(s)}>
                    <div className="font-semibold text-gray-800">{s.name}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(s.date).toLocaleDateString('fr-FR')} • {getSessionSets(s.id).length} séries
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => openSession(s)} className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                      Ouvrir
                    </button>
                    <button onClick={() => deleteSession(s.id)} className="px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600">
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionsPage;