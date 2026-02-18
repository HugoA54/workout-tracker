// Service API pour OpenFoodFacts
// API gratuite pour rechercher des aliments et scanner des codes-barres

const API_BASE = 'https://world.openfoodfacts.org/api/v2';

export class OpenFoodFactsService {
  /**
   * Rechercher des aliments par texte
   */
/**
   * Rechercher des aliments par texte
   * NOTE : On utilise cgi/search.pl car l'API v2 ne gère pas encore bien
   * la recherche textuelle simple (search_terms est ignoré).
   */
/**
   * Rechercher des aliments par texte
   * Version corrigée : URL cgi/search.pl + Filtre anti-produits vides
   */
  async searchFoods(query, page = 1, pageSize = 20) {
    try {
      // 1. On utilise l'URL qui marche pour la recherche texte
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page=${page}&page_size=${pageSize}&fields=product_name,brands,code,_id,nutriments`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        foods: (data.products || [])
          .map(product => this.transformProduct(product)) // Transforme et sécurise les nombres
          .filter(item => item !== null) // Retire les erreurs techniques
          // 2. NOUVEAU FILTRE : Retire les produits incomplets (tout à 0)
          .filter(item => {
             // On garde l'aliment seulement s'il a au moins une valeur nutritionnelle
             const hasNutrition = item.calories_per_100g > 0 || 
                                  item.protein_per_100g > 0 || 
                                  item.carbs_per_100g > 0 || 
                                  item.fats_per_100g > 0;
             return hasNutrition;
          }),
        count: data.count || 0,
        page: parseInt(data.page) || 1
      };
    } catch (error) {
      console.error('❌ Erreur recherche OpenFoodFacts:', error);
      return { foods: [], count: 0, page: 1 };
    }
  }

  /**
   * Récupérer un aliment par code-barres
   */
  async getFoodByBarcode(barcode) {
    try {
      const url = `${API_BASE}/product/${barcode}.json?fields=product_name,brands,code,_id,nutriments`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 0) {
        throw new Error('Produit non trouvé');
      }

      return this.transformProduct(data.product);
    } catch (error) {
      console.error('❌ Erreur scan code-barres:', error);
      throw error;
    }
  }

  /**
   * Transformer un produit OpenFoodFacts vers notre format
   * CORRIGÉ : Gestion sécurisée des nombres pour éviter .toFixed is not a function
   */
  transformProduct(product) {
    if (!product) {
      return null;
    }

    const nutriments = product.nutriments || {};

    // Fonction utilitaire pour convertir n'importe quoi en nombre (ou 0)
    const safeParse = (val) => {
      if (val === null || val === undefined) return 0;
      
      // Si c'est une chaine, on nettoie (ex: "10,5" devient "10.5")
      if (typeof val === 'string') {
          val = val.replace(',', '.');
      }
      
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    };

    // Extraction et nettoyage des valeurs
    const calories = safeParse(
         nutriments['energy-kcal_100g'] 
      || nutriments['energy-kcal'] 
      || (nutriments['energy_100g'] ? nutriments['energy_100g'] / 4.184 : 0)
    );

    const protein = safeParse(nutriments.proteins_100g || nutriments.proteins);
    const carbs = safeParse(nutriments.carbohydrates_100g || nutriments.carbohydrates);
    const fats = safeParse(nutriments.fat_100g || nutriments.fat);

    return {
      name: product.product_name || product.product_name_fr || 'Produit inconnu',
      brand: product.brands || '',
      barcode: product.code || '',
      openfoodfacts_id: product._id || product.code || '',

      // Maintenant que les variables sont des nombres garantis, toFixed fonctionne
      calories_per_100g: parseFloat(calories.toFixed(2)),
      protein_per_100g: parseFloat(protein.toFixed(2)),
      carbs_per_100g: parseFloat(carbs.toFixed(2)),
      fats_per_100g: parseFloat(fats.toFixed(2)),

      // Portion standard
      serving_size: safeParse(nutriments.serving_quantity) || 100,
      serving_unit: 'g',

      source: 'openfoodfacts'
    };
  }

  /**
   * Obtenir des suggestions d'aliments populaires
   */
  async getPopularFoods() {
    const popularTerms = ['banana', 'chicken', 'rice', 'apple', 'egg', 'pasta', 'yogurt'];
    const randomTerm = popularTerms[Math.floor(Math.random() * popularTerms.length)];

    const result = await this.searchFoods(randomTerm, 1, 5);
    return result.foods;
  }
}

export const openFoodFactsApi = new OpenFoodFactsService();