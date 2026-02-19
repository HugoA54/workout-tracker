import { useState, useEffect, useContext } from 'react';
import { X, Search, Camera, Loader, PlusCircle } from 'lucide-react';
import { FoodContext } from '../context/FoodContext';
import FoodCard from './FoodCard';
import BarcodeScanner from './BarcodeScanner';

const FoodSearchModal = ({ isOpen, onClose, onSelectFood, confirmLabel = "Ajouter au repas" }) => {
  const { searchFoods, scanBarcode, createFood } = useContext(FoodContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ local: [], api: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('local');
  const [showScanner, setShowScanner] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState('100');

  // État du formulaire de création
  const [newFood, setNewFood] = useState({
    name: '',
    calories_per_100g: '',
    protein_per_100g: '',
    carbs_per_100g: '',
    fats_per_100g: '',
  });

  // Debounced search
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
      if (results.local.length > 0) {
        setActiveTab('local');
      } else if (results.api.length > 0) {
        setActiveTab('api');
      }
    } catch (error) {
      console.error('Erreur recherche:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleScan = async (barcode) => {
    try {
      setIsSearching(true);
      const food = await scanBarcode(barcode);
      handleFoodSelect(food);
    } catch (error) {
      console.error('Erreur scan:', error);
      alert('Produit non trouvé. Essayez la saisie manuelle.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleFoodSelect = (food) => {
    setSelectedFood(food);
    setShowCreateForm(false);
  };

  const handleConfirm = () => {
    if (!selectedFood || !quantity) return;

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      alert('Quantité invalide');
      return;
    }

    const ratio = qty / 100;
    const foodWithQuantity = {
      ...selectedFood,
      quantity: qty,
      calories: selectedFood.calories_per_100g * ratio,
      protein: selectedFood.protein_per_100g * ratio,
      carbs: selectedFood.carbs_per_100g * ratio,
      fats: selectedFood.fats_per_100g * ratio
    };

    onSelectFood(foodWithQuantity);
    handleCloseModal();
  };

  const handleCreateFood = async () => {
    if (!newFood.name.trim()) {
      alert('Donnez un nom à votre aliment');
      return;
    }

    try {
      const foodData = {
        name: newFood.name.trim(),
        calories_per_100g: Number(newFood.calories_per_100g) || 0,
        protein_per_100g: Number(newFood.protein_per_100g) || 0,
        carbs_per_100g: Number(newFood.carbs_per_100g) || 0,
        fats_per_100g: Number(newFood.fats_per_100g) || 0,
        serving_size: 100,
        serving_unit: 'g',
        source: 'manual'
      };

      const created = await createFood(foodData);
      // Sélectionner directement l'aliment créé
      handleFoodSelect(created);
    } catch (error) {
      console.error('Erreur création aliment:', error);
      alert("Erreur lors de la création de l'aliment");
    }
  };

  const handleCloseModal = () => {
    setSearchQuery('');
    setSearchResults({ local: [], api: [] });
    setSelectedFood(null);
    setQuantity('100');
    setActiveTab('local');
    setShowCreateForm(false);
    setNewFood({ name: '', calories_per_100g: '', protein_per_100g: '', carbs_per_100g: '', fats_per_100g: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            {selectedFood ? 'Quantité' : showCreateForm ? 'Créer un aliment' : 'Rechercher un aliment'}
          </h2>
          <button
            onClick={handleCloseModal}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {showCreateForm && !selectedFood ? (
            /* Formulaire de création d'aliment personnalisé */
            <div className="max-w-md mx-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'aliment *</label>
                  <input
                    type="text"
                    value={newFood.name}
                    onChange={(e) => setNewFood(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Pomme, Riz blanc, ..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Calories (pour 100g)</label>
                  <input
                    type="number"
                    value={newFood.calories_per_100g}
                    onChange={(e) => setNewFood(prev => ({ ...prev, calories_per_100g: e.target.value }))}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Protéines (g)</label>
                    <input
                      type="number"
                      value={newFood.protein_per_100g}
                      onChange={(e) => setNewFood(prev => ({ ...prev, protein_per_100g: e.target.value }))}
                      placeholder="0"
                      min="0"
                      step="0.1"
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Glucides (g)</label>
                    <input
                      type="number"
                      value={newFood.carbs_per_100g}
                      onChange={(e) => setNewFood(prev => ({ ...prev, carbs_per_100g: e.target.value }))}
                      placeholder="0"
                      min="0"
                      step="0.1"
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lipides (g)</label>
                    <input
                      type="number"
                      value={newFood.fats_per_100g}
                      onChange={(e) => setNewFood(prev => ({ ...prev, fats_per_100g: e.target.value }))}
                      placeholder="0"
                      min="0"
                      step="0.1"
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-500">
                  * Les valeurs nutritionnelles sont pour 100g. Vous pourrez choisir la quantité ensuite.
                </p>
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                >
                  Retour
                </button>
                <button
                  onClick={handleCreateFood}
                  disabled={!newFood.name.trim()}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Créer et sélectionner
                </button>
              </div>
            </div>
          ) : !selectedFood ? (
            <>
              {/* Search Bar */}
              <div className="mb-4 flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un aliment (ex: poulet, banane, pain...)"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    autoFocus
                  />
                </div>
                <button
                  onClick={() => setShowScanner(true)}
                  className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  <span className="hidden md:inline">Scanner</span>
                </button>
              </div>

              {/* Bouton créer un aliment */}
              <button
                onClick={() => {
                  setShowCreateForm(true);
                  setNewFood(prev => ({ ...prev, name: searchQuery }));
                }}
                className="w-full mb-4 px-4 py-3 border-2 border-dashed border-green-400 text-green-700 rounded-lg hover:bg-green-50 transition flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-5 h-5" />
                Créer un aliment personnalisé
              </button>

              {/* Tabs */}
              {searchQuery && (
                <div className="flex gap-2 mb-4 border-b">
                  <button
                    onClick={() => setActiveTab('local')}
                    className={`px-4 py-2 font-medium transition border-b-2 ${
                      activeTab === 'local'
                        ? 'text-indigo-600 border-indigo-600'
                        : 'text-gray-600 border-transparent hover:text-gray-800'
                    }`}
                  >
                    Mes aliments ({searchResults.local.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('api')}
                    className={`px-4 py-2 font-medium transition border-b-2 ${
                      activeTab === 'api'
                        ? 'text-indigo-600 border-indigo-600'
                        : 'text-gray-600 border-transparent hover:text-gray-800'
                    }`}
                  >
                    OpenFoodFacts ({searchResults.api.length})
                  </button>
                </div>
              )}

              {/* Loading */}
              {isSearching && (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
              )}

              {/* Results */}
              {!isSearching && searchQuery && (
                <div className="grid md:grid-cols-2 gap-4">
                  {activeTab === 'local' &&
                    searchResults.local.map((food) => (
                      <FoodCard
                        key={food.id}
                        food={food}
                        onSelect={handleFoodSelect}
                        compact
                      />
                    ))}

                  {activeTab === 'api' &&
                    searchResults.api.map((food, index) => (
                      <FoodCard
                        key={`api-${index}`}
                        food={food}
                        onSelect={handleFoodSelect}
                        compact
                      />
                    ))}

                  {((activeTab === 'local' && searchResults.local.length === 0) ||
                    (activeTab === 'api' && searchResults.api.length === 0)) && (
                    <div className="col-span-2 text-center py-12 text-gray-500">
                      Aucun résultat trouvé
                    </div>
                  )}
                </div>
              )}

              {/* Initial state */}
              {!searchQuery && !isSearching && (
                <div className="text-center py-12 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>Recherchez un aliment ou scannez un code-barres</p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Quantity Selection */}
              <div className="max-w-md mx-auto">
                <FoodCard food={selectedFood} compact />

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantité (en grammes)
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="1"
                    step="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-lg"
                    autoFocus
                  />

                  {/* Calculated macros */}
                  {quantity && parseFloat(quantity) > 0 && (
                    <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Pour {quantity}g :
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Calories:</span>
                          <span className="font-bold text-orange-600 ml-2">
                            {Math.round((selectedFood.calories_per_100g * parseFloat(quantity)) / 100)} kcal
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Protéines:</span>
                          <span className="font-bold text-blue-600 ml-2">
                            {((selectedFood.protein_per_100g * parseFloat(quantity)) / 100).toFixed(1)}g
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Glucides:</span>
                          <span className="font-bold text-green-600 ml-2">
                            {((selectedFood.carbs_per_100g * parseFloat(quantity)) / 100).toFixed(1)}g
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Lipides:</span>
                          <span className="font-bold text-yellow-600 ml-2">
                            {((selectedFood.fats_per_100g * parseFloat(quantity)) / 100).toFixed(1)}g
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex gap-2">
                  <button
                    onClick={() => setSelectedFood(null)}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                  >
                    Retour
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={!quantity || parseFloat(quantity) <= 0}
                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {confirmLabel}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
      />
    </div>
  );
};

export default FoodSearchModal;
