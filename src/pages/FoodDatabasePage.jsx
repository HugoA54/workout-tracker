import { useState, useEffect, useContext } from 'react';
import { Search, Camera } from 'lucide-react';
import NavBar from '../components/NavBar';
import FoodCard from '../components/FoodCard';
import BarcodeScanner from '../components/BarcodeScanner';
import { FoodContext } from '../context/FoodContext';

const FoodDatabasePage = () => {
  const { searchFoods, scanBarcode, foods, createFood, updateFood } = useContext(FoodContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ local: [], api: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        performSearch();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults({ local: [], api: [] });
    }
  }, [searchQuery]);

  const performSearch = async () => {
    try {
      setIsSearching(true);
      const results = await searchFoods(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('❌ Erreur recherche:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleScan = async (barcode) => {
    try {
      await scanBarcode(barcode);
      alert('Aliment ajouté à votre base de données !');
    } catch (error) {
      alert('Produit non trouvé');
    }
  };

  const handleSelectFood = async (food) => {
    if (food.id) {
      // Aliment déjà en DB
      console.log('Aliment sélectionné:', food);
    } else {
      // Aliment de l'API, on l'ajoute à la DB
      try {
        await createFood(food);
        alert('Aliment ajouté à votre base de données !');
      } catch (error) {
        console.error('❌ Erreur:', error);
      }
    }
  };

  const handleToggleFavorite = async (food) => {
    try {
      await updateFood(food.id, { is_favorite: !food.is_favorite });
    } catch (error) {
      console.error('❌ Erreur:', error);
    }
  };

  const displayedFoods = searchQuery
    ? activeTab === 'local'
      ? searchResults.local
      : searchResults.api
    : foods.filter(f => activeTab === 'all' || (activeTab === 'favorites' && f.is_favorite));

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <Search className="w-8 h-8 text-indigo-600" />
          Base de données alimentaire
        </h1>

        <div className="mb-6 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un aliment..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setShowScanner(true)}
            className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Scanner
          </button>
        </div>

        <div className="flex gap-2 mb-6 border-b">
          {!searchQuery ? (
            <>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 font-medium transition border-b-2 ${
                  activeTab === 'all' ? 'text-indigo-600 border-indigo-600' : 'text-gray-600 border-transparent'
                }`}
              >
                Tous ({foods.length})
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`px-4 py-2 font-medium transition border-b-2 ${
                  activeTab === 'favorites' ? 'text-indigo-600 border-indigo-600' : 'text-gray-600 border-transparent'
                }`}
              >
                Favoris ({foods.filter(f => f.is_favorite).length})
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('local')}
                className={`px-4 py-2 font-medium transition border-b-2 ${
                  activeTab === 'local' ? 'text-indigo-600 border-indigo-600' : 'text-gray-600 border-transparent'
                }`}
              >
                Mes aliments ({searchResults.local.length})
              </button>
              <button
                onClick={() => setActiveTab('api')}
                className={`px-4 py-2 font-medium transition border-b-2 ${
                  activeTab === 'api' ? 'text-indigo-600 border-indigo-600' : 'text-gray-600 border-transparent'
                }`}
              >
                OpenFoodFacts ({searchResults.api.length})
              </button>
            </>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedFoods.map((food, index) => (
            <FoodCard
              key={food.id || `api-${index}`}
              food={food}
              onSelect={handleSelectFood}
              onToggleFavorite={food.id ? handleToggleFavorite : undefined}
            />
          ))}
        </div>

        {displayedFoods.length === 0 && !isSearching && (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? 'Aucun résultat trouvé' : 'Aucun aliment enregistré'}
          </div>
        )}
      </div>

      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
      />
    </div>
  );
};

export default FoodDatabasePage;
