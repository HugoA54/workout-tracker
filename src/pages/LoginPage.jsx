import React, { useContext, useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { WorkoutContext } from '../context/WorkoutContext'; // 👈 Import du context

const LoginPage = () => {
  const { loginEmail, setLoginEmail, loginPassword, setLoginPassword, handleLogin, handleRegister } = useContext(WorkoutContext);
  const [isRegister, setIsRegister] = useState(false);
  const [registerPseudo, setRegisterPseudo] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-full">
              <Dumbbell className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Nokka</h1>
          <p className="text-gray-600 mt-2">Votre tracker d'entraînement</p>
        </div>

        <div className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pseudo</label>
              <input type="text" value={registerPseudo} onChange={(e) => setRegisterPseudo(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Votre pseudo" />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="votre@email.com" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
            <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="••••••••" />
          </div>

          {!isRegister ? (
            <>
              <button onClick={handleLogin} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition shadow-lg">Se connecter</button>
              <button onClick={() => setIsRegister(true)} className="w-full text-indigo-600 py-2 font-semibold hover:text-indigo-800 transition">Créer un compte</button>
            </>
          ) : (
            <>
              <button onClick={() => handleRegister(registerPseudo)} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition shadow-lg">S'inscrire</button>
              <button onClick={() => setIsRegister(false)} className="w-full text-indigo-600 py-2 font-semibold hover:text-indigo-800 transition">Retour à la connexion</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;