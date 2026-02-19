import { Heart, Flame, Plus } from 'lucide-react';

const FoodCard = ({ food, onSelect, onToggleFavorite, compact = false }) => {
  const handleClick = () => {
    if (onSelect) {
      onSelect(food);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`bg-white rounded-xl shadow-md hover:shadow-xl transition cursor-pointer ${
        compact ? 'p-4' : 'p-6'
      }`}
    >
      {/* Header avec nom et favoris */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className={`font-bold text-gray-800 ${compact ? 'text-base' : 'text-lg'}`}>
            {food.name}
          </h3>
          {food.brand && (
            <p className="text-sm text-gray-500 mt-1">{food.brand}</p>
          )}
          {food.source === 'openfoodfacts' && (
            <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
              OpenFoodFacts
            </span>
          )}
        </div>

        {/* Bouton favoris (seulement pour les aliments déjà dans la DB) */}
        {food.id && onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(food);
            }}
            className={`p-2 rounded-full transition ${
              food.is_favorite
                ? 'bg-red-100 text-red-600'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
          >
            <Heart className={`w-5 h-5 ${food.is_favorite ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      {/* Calories */}
      <div className="mb-3 flex items-center gap-2">
        <Flame className="w-5 h-5 text-orange-500" />
        <div>
          <span className="text-2xl font-bold text-orange-600">
            {food.calories_per_100g}
          </span>
          <span className="text-sm text-gray-500 ml-1">kcal / 100g</span>
        </div>
      </div>

      {/* Macros */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-xs text-gray-600">Protéines</div>
          <div className="text-lg font-bold text-blue-600">
            {food.protein_per_100g}g
          </div>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="text-xs text-gray-600">Glucides</div>
          <div className="text-lg font-bold text-green-600">
            {food.carbs_per_100g}g
          </div>
        </div>
        <div className="text-center p-2 bg-yellow-50 rounded-lg">
          <div className="text-xs text-gray-600">Lipides</div>
          <div className="text-lg font-bold text-yellow-600">
            {food.fats_per_100g}g
          </div>
        </div>
      </div>

      {/* Portion standard */}
      {food.serving_size && (
        <p className="text-xs text-gray-500 mb-2">
          Portion: {food.serving_size}{food.serving_unit}
        </p>
      )}

      {/* Nombre d'utilisations */}
      {food.times_used > 0 && (
        <p className="text-xs text-gray-400">
          Utilisé {food.times_used} fois
        </p>
      )}

      {/* Bouton d'action */}
      {onSelect && (
        <div className="mt-3 pt-3 border-t">
          <button
            onClick={handleClick}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
      )}
    </div>
  );
};

export default FoodCard;
