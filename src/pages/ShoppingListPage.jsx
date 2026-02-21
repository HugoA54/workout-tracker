import { useContext, useMemo } from 'react';
import { ShoppingCart, Check, Trash2 } from 'lucide-react';
import NavBar from '../components/NavBar';
import { FoodContext } from '../context/FoodContext';

const CATEGORIES = {
  produce: { label: 'Fruits & Légumes', color: 'bg-green-100 text-green-700' },
  dairy: { label: 'Produits laitiers', color: 'bg-blue-100 text-blue-700' },
  meat: { label: 'Viandes & Poissons', color: 'bg-red-100 text-red-700' },
  pantry: { label: 'Épicerie', color: 'bg-yellow-100 text-yellow-700' },
  other: { label: 'Autres', color: 'bg-gray-100 text-gray-700' }
};

const ShoppingListPage = () => {
  const { shoppingList, togglePurchased, removeShoppingItem, clearShoppingList } = useContext(FoodContext);

  const groupedItems = useMemo(() => {
    const grouped = {};
    shoppingList.forEach(item => {
      const cat = item.category || 'other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });
    return grouped;
  }, [shoppingList]);

  const stats = useMemo(() => {
    const total = shoppingList.length;
    const purchased = shoppingList.filter(i => i.is_purchased).length;
    return { total, purchased, remaining: total - purchased };
  }, [shoppingList]);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-indigo-600" />
          Liste de courses
        </h1>

        {shoppingList.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">Aucune liste de courses générée</p>
            <p className="text-sm text-gray-400">
              Planifiez vos repas et générez une liste depuis la page Meal Prep
            </p>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-md p-6 mb-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm opacity-90">Total</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <div>
                  <p className="text-sm opacity-90">Achetés</p>
                  <p className="text-3xl font-bold">{stats.purchased}</p>
                </div>
                <div>
                  <p className="text-sm opacity-90">Restants</p>
                  <p className="text-3xl font-bold">{stats.remaining}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-white bg-opacity-20 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-white h-3 transition-all duration-300"
                    style={{ width: `${stats.total > 0 ? (stats.purchased / stats.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <button
                onClick={() => { if (window.confirm('Vider toute la liste de courses ?')) clearShoppingList(); }}
                className="mt-4 w-full py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-semibold transition"
              >
                Vider la liste
              </button>
            </div>

            <div className="space-y-6">
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className={`px-4 py-3 ${CATEGORIES[category].color} font-semibold`}>
                    {CATEGORIES[category].label} ({items.length})
                  </div>
                  <div className="divide-y">
                    {items.map(item => (
                      <div
                        key={item.id}
                        onClick={() => togglePurchased(item.id)}
                        className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition ${
                          item.is_purchased ? 'opacity-50' : ''
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                            item.is_purchased
                              ? 'bg-indigo-600 border-indigo-600'
                              : 'border-gray-300 hover:border-indigo-400'
                          }`}
                        >
                          {item.is_purchased && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${item.is_purchased ? 'line-through' : ''}`}>
                            {item.item_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {Math.round(item.quantity)}{item.unit}
                          </p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeShoppingItem(item.id); }}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShoppingListPage;
