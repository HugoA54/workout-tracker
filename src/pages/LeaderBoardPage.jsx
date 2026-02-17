import React, { useContext, useState, useMemo, useEffect } from 'react';
import { Dumbbell, Trophy, Medal, Zap, TrendingUp } from 'lucide-react';
import { WorkoutContext } from '../context/WorkoutContext';
import NavBar from '../components/NavBar';
import { supabase } from '../supabaseClient';

const LeaderBoardPage = () => {
    const { 
        currentUser, 
        exercises
    } = useContext(WorkoutContext);

    const [allSessions, setAllSessions] = useState([]);
    const [allSets, setAllSets] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('volume');
    const [selectedExercise, setSelectedExercise] = useState(null);

    console.log('LeaderBoard Data:', { allSessions: allSessions?.length, allSets: allSets?.length, exercises: exercises?.length });

    // Charger TOUTES les sessions et séries depuis Supabase
    useEffect(() => {
        const loadAllData = async () => {
            try {
                // Charger tous les utilisateurs
                const { data: usersData, error: usersError } = await supabase
                    .from('users')
                    .select('id, pseudo, email');
                
                if (usersError) throw usersError;
                setAllUsers(usersData || []);

                // Charger toutes les sessions
                const { data: sessionsData, error: sessionsError } = await supabase
                    .from('sessions')
                    .select('*');
                
                if (sessionsError) throw sessionsError;
                setAllSessions(sessionsData || []);

                // Charger toutes les séries
                if (sessionsData && sessionsData.length > 0) {
                    const sessionIds = sessionsData.map(s => s.id);
                    const { data: setsData, error: setsError } = await supabase
                        .from('sets')
                        .select('*')
                        .in('session_id', sessionIds);
                    
                    if (setsError) throw setsError;
                    setAllSets(setsData || []);
                }
            } catch (error) {
                console.error('Erreur chargement leaderboard:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadAllData();
    }, []);

    // Calculer les stats par utilisateur directement à partir des sessions
    const userStats = useMemo(() => {
        const statsMap = new Map();

        // Extraire les utilisateurs uniques des sessions
        allSessions.forEach(session => {
            if (!statsMap.has(session.user_id)) {
                const user = allUsers.find(u => u.id === session.user_id);
                statsMap.set(session.user_id, {
                    user_id: session.user_id,
                    user_pseudo: user?.pseudo || 'Utilisateur',
                    user_email: session.user_email || user?.email || 'Inconnu',
                    sessions_count: 0,
                    total_volume: 0,
                    total_sets: 0,
                    avg_weight: 0,
                    exercise_maxes: new Map()
                });
            }

            const userStat = statsMap.get(session.user_id);
            userStat.sessions_count += 1;
        });

        // Ajouter les données des séries
        allSets.forEach(set => {
            const sessionData = allSessions.find(s => s.id === set.session_id);
            if (sessionData && statsMap.has(sessionData.user_id)) {
                const userStat = statsMap.get(sessionData.user_id);
                const weight = parseFloat(set.weight) || 0;
                const reps = parseInt(set.repetitions) || 0;
                userStat.total_volume += weight * reps;
                userStat.total_sets += 1;

                // Tracker le max par exercice
                const exerciseId = set.exercise_id;
                if (!userStat.exercise_maxes.has(exerciseId)) {
                    userStat.exercise_maxes.set(exerciseId, 0);
                }
                if (weight > userStat.exercise_maxes.get(exerciseId)) {
                    userStat.exercise_maxes.set(exerciseId, weight);
                }
            }
        });

        // Calculer les moyennes
        statsMap.forEach(stat => {
            if (stat.total_sets > 0) {
                stat.avg_weight = Math.round(stat.total_volume / stat.total_sets);
            }
        });

        // Retourner tous les utilisateurs avec stats
        return Array.from(statsMap.values());
    }, [allSessions, allSets, allUsers]);

    // Trier selon l'onglet actif
    const sortedUsers = useMemo(() => {
        const sorted = [...userStats];
        if (activeTab === 'volume') {
            sorted.sort((a, b) => b.total_volume - a.total_volume);
        } else if (activeTab === 'sessions') {
            sorted.sort((a, b) => b.sessions_count - a.sessions_count);
        } else if (activeTab === 'sets') {
            sorted.sort((a, b) => b.total_sets - a.total_sets);
        } else if (activeTab === 'exercise' && selectedExercise) {
            sorted.sort((a, b) => 
                (b.exercise_maxes.get(selectedExercise) || 0) - (a.exercise_maxes.get(selectedExercise) || 0)
            );
            // Filtrer ceux qui n'ont pas fait cet exercice
            return sorted.filter(user => user.exercise_maxes.get(selectedExercise) > 0);
        }
        return sorted;
    }, [userStats, activeTab, selectedExercise]);

    const getMedalIcon = (rank) => {
        if (rank === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
        if (rank === 1) return <Medal className="w-6 h-6 text-gray-400" />;
        if (rank === 2) return <Medal className="w-6 h-6 text-orange-600" />;
        return <span className="text-xl font-bold text-gray-600">#{rank + 1}</span>;
    };

    const exerciseById = useMemo(() => {
        const map = new Map();
        exercises.forEach(e => map.set(e.id, e));
        return map;
    }, [exercises]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <NavBar />
                <div className="flex items-center justify-center h-96">
                    <Dumbbell className="w-12 h-12 text-indigo-600 animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <NavBar />
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Trophy className="w-10 h-10 text-yellow-500" />
                        <h1 className="text-4xl font-bold text-gray-900">LeaderBoard</h1>
                    </div>
                    <p className="text-gray-600">Classement des meilleurs athlètes de Nokka</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    <button
                        onClick={() => setActiveTab('volume')}
                        className={`px-6 py-3 rounded-lg font-semibold transition ${
                            activeTab === 'volume'
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <Dumbbell className="w-5 h-5" />
                            Volume Total
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('sessions')}
                        className={`px-6 py-3 rounded-lg font-semibold transition ${
                            activeTab === 'sessions'
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Sessions
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('sets')}
                        className={`px-6 py-3 rounded-lg font-semibold transition ${
                            activeTab === 'sets'
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5" />
                            Séries
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('exercise')}
                        className={`px-6 py-3 rounded-lg font-semibold transition ${
                            activeTab === 'exercise'
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <Dumbbell className="w-5 h-5" />
                            Par Exercice
                        </div>
                    </button>
                </div>

                {/* Exercise Selector */}
                {activeTab === 'exercise' && (
                    <div className="mb-6">
                        <select
                            value={selectedExercise || ''}
                            onChange={(e) => setSelectedExercise(e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">Choisir un exercice...</option>
                            {exercises.map(ex => (
                                <option key={ex.id} value={ex.id}>
                                    {ex.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* LeaderBoard List */}
                {activeTab === 'exercise' && !selectedExercise ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <Dumbbell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg">Sélectionnez un exercice pour voir le classement</p>
                    </div>
                ) : sortedUsers.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg">Aucune donnée disponible</p>
                        <p className="text-gray-500 text-sm mt-2">Soyez le premier à enregistrer une séance !</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sortedUsers.map((user, index) => {
                            const isCurrentUser = currentUser?.id === user.user_id;
                            const isTopThree = index < 3;

                            return (
                                <div
                                    key={user.user_id}
                                    className={`flex items-center gap-4 p-5 rounded-xl transition transform hover:scale-[1.02] ${
                                        isCurrentUser
                                            ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-400 shadow-lg'
                                            : isTopThree
                                            ? 'bg-white border-2 border-yellow-200 shadow-md'
                                            : 'bg-white border border-gray-200 hover:shadow-md'
                                    }`}
                                >
                                    {/* Rank */}
                                    <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center">
                                        {getMedalIcon(index)}
                                    </div>

                                    {/* User Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-gray-900 text-lg truncate">
                                                {user.user_pseudo}
                                            </h3>
                                            {isCurrentUser && (
                                                <span className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                                                    Vous
                                                </span>
                                            )}
                                            {isTopThree && !isCurrentUser && (
                                                <span className="text-yellow-500">⭐</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {user.sessions_count} séance{user.sessions_count > 1 ? 's' : ''} • {user.total_sets} série{user.total_sets > 1 ? 's' : ''}
                                        </p>
                                    </div>

                                    {/* Stats */}
                                    <div className="text-right flex-shrink-0">
                                        {activeTab === 'volume' && (
                                            <div>
                                                <div className="text-3xl font-bold text-indigo-600">
                                                    {Math.round(user.total_volume).toLocaleString()}
                                                </div>
                                                <div className="text-xs text-gray-500 font-medium">kg levés</div>
                                            </div>
                                        )}
                                        {activeTab === 'sessions' && (
                                            <div>
                                                <div className="text-3xl font-bold text-indigo-600">
                                                    {user.sessions_count}
                                                </div>
                                                <div className="text-xs text-gray-500 font-medium">séances</div>
                                            </div>
                                        )}
                                        {activeTab === 'sets' && (
                                            <div>
                                                <div className="text-3xl font-bold text-indigo-600">
                                                    {user.total_sets}
                                                </div>
                                                <div className="text-xs text-gray-500 font-medium">séries</div>
                                            </div>
                                        )}
                                        {activeTab === 'exercise' && selectedExercise && (
                                            <div>
                                                <div className="text-3xl font-bold text-indigo-600">
                                                    {user.exercise_maxes.get(selectedExercise) || '-'}
                                                </div>
                                                <div className="text-xs text-gray-500 font-medium">
                                                    {exerciseById.get(selectedExercise)?.isBodyweight ? 'kg (+ PDC)' : 'kg max'}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Podium visuel pour top 3 */}
                {sortedUsers.length >= 3 && activeTab !== 'exercise' && (
                    <div className="mt-12 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-8 border-2 border-yellow-200">
                        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">🏆 Podium</h2>
                        <div className="flex items-end justify-center gap-4">
                            {/* 2ème place */}
                            {sortedUsers[1] && (
                                <div className="flex flex-col items-center">
                                    <Medal className="w-8 h-8 text-gray-400 mb-2" />
                                    <div className="bg-gray-200 rounded-t-lg p-4 w-28 text-center h-24 flex flex-col justify-center">
                                        <div className="font-bold text-sm truncate">{sortedUsers[1].user_pseudo}</div>
                                        <div className="text-xs text-gray-600 mt-1">
                                            {activeTab === 'volume' && `${Math.round(sortedUsers[1].total_volume).toLocaleString()} kg`}
                                            {activeTab === 'sessions' && `${sortedUsers[1].sessions_count} séances`}
                                            {activeTab === 'sets' && `${sortedUsers[1].total_sets} séries`}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 1ère place */}
                            {sortedUsers[0] && (
                                <div className="flex flex-col items-center">
                                    <Trophy className="w-10 h-10 text-yellow-500 mb-2 animate-pulse" />
                                    <div className="bg-yellow-400 rounded-t-lg p-4 w-32 text-center h-32 flex flex-col justify-center shadow-lg">
                                        <div className="font-bold truncate">{sortedUsers[0].user_pseudo}</div>
                                        <div className="text-sm text-yellow-900 mt-1">
                                            {activeTab === 'volume' && `${Math.round(sortedUsers[0].total_volume).toLocaleString()} kg`}
                                            {activeTab === 'sessions' && `${sortedUsers[0].sessions_count} séances`}
                                            {activeTab === 'sets' && `${sortedUsers[0].total_sets} séries`}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3ème place */}
                            {sortedUsers[2] && (
                                <div className="flex flex-col items-center">
                                    <Medal className="w-8 h-8 text-orange-600 mb-2" />
                                    <div className="bg-orange-300 rounded-t-lg p-4 w-28 text-center h-20 flex flex-col justify-center">
                                        <div className="font-bold text-sm truncate">{sortedUsers[2].user_pseudo}</div>
                                        <div className="text-xs text-orange-900 mt-1">
                                            {activeTab === 'volume' && `${Math.round(sortedUsers[2].total_volume).toLocaleString()} kg`}
                                            {activeTab === 'sessions' && `${sortedUsers[2].sessions_count} séances`}
                                            {activeTab === 'sets' && `${sortedUsers[2].total_sets} séries`}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaderBoardPage;