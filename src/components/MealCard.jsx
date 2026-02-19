import { Edit2, Trash2, Plus, UtensilsCrossed, Flame } from 'lucide-react';

const MealCard = ({ meal, onEdit, onDelete, onAddToToday, compact = false }) => {
  return (
    <div className={`bg-white rounded-xl shadow-md hover:shadow-xl transition ${compact ? 'p-4' : 'p-6'}`}>
      {/* Photo du repas */}
      {meal.photo_url && !compact && (
        <div className="mb-4 rounded-lg overflow-hidden h-48 bg-gray-100">
          <img
            src={meal.photo_url}
            alt={meal.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Header avec nom */}
      <div className="mb-3">
        <h3 className={`font-bold text-gray-800 flex items-center gap-2 ${compact ? 'text-base' : 'text-xl'}`}>
          <UtensilsCrossed className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-indigo-600`} />
          {meal.name}
        </h3>
        {meal.description && !compact && (
          <p className="text-sm text-gray-600 mt-2">{meal.description}</p>
        )}
      </div>

      {/* Calories totales */}
      <div className="mb-3 flex items-center gap-2">
        <Flame className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-orange-500`} />
        <div>
          <span className={`font-bold text-orange-600 ${compact ? 'text-lg' : 'text-2xl'}`}>
            {Math.round(meal.total_calories)}
          </span>
          <span className="text-sm text-gray-500 ml-1">kcal</span>
        </div>
      </div>

      {/* Macros totaux */}
      <div className={`grid grid-cols-3 gap-2 ${compact ? 'mb-2' : 'mb-4'}`}>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-xs text-gray-600">Protéines</div>
          <div className={`font-bold text-blue-600 ${compact ? 'text-sm' : 'text-lg'}`}>
            {Math.round(meal.total_protein)}g
          </div>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="text-xs text-gray-600">Glucides</div>
          <div className={`font-bold text-green-600 ${compact ? 'text-sm' : 'text-lg'}`}>
            {Math.round(meal.total_carbs)}g
          </div>
        </div>
        <div className="text-center p-2 bg-yellow-50 rounded-lg">
          <div className="text-xs text-gray-600">Lipides</div>
          <div className={`font-bold text-yellow-600 ${compact ? 'text-sm' : 'text-lg'}`}>
            {Math.round(meal.total_fats)}g
          </div>
        </div>
      </div>

      {/* Métadonnées */}
      {!compact && (
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          {meal.is_template && (
            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
              Template
            </span>
          )}
          {meal.times_used > 0 && (
            <span>Utilisé {meal.times_used} fois</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className={`flex gap-2 ${compact ? 'pt-2 border-t' : 'pt-4 border-t'}`}>
        {onAddToToday && (
          <button
            onClick={() => onAddToToday(meal)}
            className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            {compact ? 'Ajouter' : 'Ajouter aujourd\'hui'}
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(meal)}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(meal)}
            className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default MealCard;
