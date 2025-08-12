import { FoodItem, AustralianProductInfo } from '../types/nutrition.types';

export class AustralianProductEnhancer {
  private static AUSTRALIAN_BRANDS = [
    'Coles', 'Woolworths', 'ALDI', 'IGA', 'Arnott\'s', 'Bega', 
    'Dairy Farmers', 'Golden Circle', 'SPC', 'Cadbury', 'Tim Tam',
    'Vegemite', 'Weet-Bix', 'Uncle Tobys', 'Masterfoods', 'Kraft',
    'Nestle', 'Unilever', 'Mars', 'PepsiCo', 'Coca-Cola', 'Fonterra',
    'Lion', 'Asahi', 'CUB', 'Treasury Wine Estates', 'Woolworths Group',
    'Coles Group', 'Metcash', 'Wesfarmers', 'Harvey Norman', 'JB Hi-Fi',
    'Flight Centre', 'Qantas', 'Virgin Australia', 'Telstra', 'Optus',
    'Commonwealth Bank', 'ANZ', 'Westpac', 'NAB', 'Macquarie Group',
    'BHP', 'Rio Tinto', 'Fortescue', 'Woodside', 'Santos', 'Origin',
    'AGL', 'Energy Australia', 'Origin Energy', 'Alinta Energy',
    'Red Rooster', 'Hungry Jack\'s', 'Domino\'s', 'Pizza Hut',
    'KFC', 'McDonald\'s', 'Subway', 'Guzman y Gomez', 'Boost Juice',
    'Gloria Jean\'s', 'The Coffee Club', 'Zambrero', 'Mad Mex',
    'Nando\'s', 'Oporto', 'Grill\'d', 'Betty\'s Burgers', 'Lord of the Fries'
  ];

  private static AUSTRALIAN_RETAILERS = [
    'Coles', 'Woolworths', 'ALDI', 'IGA', 'Foodland', 'Drakes',
    'Ritchies', 'Supabarn', 'Harris Farm Markets', 'Fresh Market',
    'Fruit and Veg City', 'The Fresh Market', 'Fresh Choice',
    'FoodWorks', 'Supa IGA', 'IGA X-Press', 'IGA Express',
    'IGA Marketplace', 'IGA Supermarket', 'IGA Liquor',
    'Coles Express', 'Coles Local', 'Coles Online', 'Coles Mobile',
    'Woolworths Metro', 'Woolworths Online', 'Woolworths Mobile',
    'Woolworths Petrol', 'Woolworths Liquor', 'Dan Murphy\'s',
    'BWS', 'Cellarmasters', 'Langton\'s', 'Woolworths Rewards',
    'Coles Flybuys', 'Coles Rewards', 'Coles Mobile Rewards'
  ];

  private static AUSTRALIAN_PRODUCT_INDICATORS = [
    'made in australia', 'product of australia', 'grown in australia',
    'australian owned', 'australian made', 'proudly australian',
    'australian beef', 'australian lamb', 'australian chicken',
    'australian dairy', 'australian honey', 'australian wine',
    'australian beer', 'australian seafood', 'australian fruit',
    'australian vegetables', 'australian grains', 'australian nuts',
    'australian herbs', 'australian spices', 'australian tea',
    'australian coffee', 'australian olive oil', 'australian vinegar',
    'australian salt', 'australian sugar', 'australian flour',
    'australian rice', 'australian pasta', 'australian bread',
    'australian cheese', 'australian yogurt', 'australian milk',
    'australian cream', 'australian butter', 'australian eggs',
    'australian bacon', 'australian ham', 'australian sausage',
    'australian fish', 'australian prawns', 'australian oysters',
    'australian mussels', 'australian scallops', 'australian crab',
    'australian lobster', 'australian barramundi', 'australian salmon',
    'australian tuna', 'australian mackerel', 'australian sardines',
    'australian anchovies', 'australian herring', 'australian whiting',
    'australian flathead', 'australian snapper', 'australian bream',
    'australian mullet', 'australian garfish', 'australian leatherjacket',
    'australian trevally', 'australian kingfish', 'australian cobia',
    'australian mahi mahi', 'australian wahoo', 'australian sailfish',
    'australian marlin', 'australian swordfish', 'australian shark',
    'australian ray', 'australian eel', 'australian octopus',
    'australian squid', 'australian cuttlefish', 'australian abalone',
    'australian sea urchin', 'australian sea cucumber', 'australian jellyfish'
  ];

  static detectAustralianProduct(product: any): AustralianProductInfo {
    const name = (product.name || '').toLowerCase();
    const brand = (product.brand || '').toLowerCase();
    const description = (product.description || '').toLowerCase();
    const ingredients = (product.ingredients || '').toLowerCase();
    const barcode = product.barcode || '';

    // Check for Australian brands
    const isAustralianBrand = this.AUSTRALIAN_BRANDS.some(brandName => 
      brand.includes(brandName.toLowerCase()) || name.includes(brandName.toLowerCase())
    );

    // Check for Australian retailers
    const isAustralianRetailer = this.AUSTRALIAN_RETAILERS.some(retailer => 
      name.includes(retailer.toLowerCase()) || brand.includes(retailer.toLowerCase())
    );

    // Check for Australian product indicators
    const hasAustralianIndicators = this.AUSTRALIAN_PRODUCT_INDICATORS.some(indicator => 
      name.includes(indicator) || description.includes(indicator) || ingredients.includes(indicator)
    );

    // Check for Australian barcode patterns (93xxxxx for Australia)
    const isAustralianBarcode = barcode.startsWith('93') && barcode.length >= 8;

    // Check for Australian serving sizes (metric system)
    const hasAustralianServingSize = this.hasAustralianServingSize(product);

    const isAustralian = isAustralianBrand || isAustralianRetailer || hasAustralianIndicators || isAustralianBarcode;

    return {
      isAustralian,
      brand: isAustralianBrand ? this.extractBrand(product) : undefined,
      retailer: this.detectRetailer(product),
      healthStarRating: this.extractHealthStarRating(product),
      nutritionPanelCompliant: this.isNutritionPanelCompliant(product),
      servingSizeAustralian: hasAustralianServingSize
    };
  }

  static enhanceNutritionData(product: FoodItem): FoodItem {
    const australianInfo = this.detectAustralianProduct(product);
    
    if (!australianInfo.isAustralian) {
      return product;
    }

    // Enhance with Australian-specific data
    const enhanced = { ...product };
    
    // Add Australian product flag
    enhanced.australianProduct = true;

    // Add Health Star Rating if available
    if (australianInfo.healthStarRating) {
      enhanced.healthStarRating = australianInfo.healthStarRating;
    }

    // Enhance confidence score for Australian products
    enhanced.confidence = Math.min(enhanced.confidence + 0.1, 1.0);

    // Add Australian compliance information
    if (australianInfo.nutritionPanelCompliant) {
      enhanced.verified = true;
    }

    // Convert serving sizes to Australian standards if needed
    if (!australianInfo.servingSizeAustralian) {
      enhanced.serving_size = this.convertToAustralianServingSize(enhanced.serving_size);
    }

    return enhanced;
  }

  static getHealthStarRating(nutrition: any): number | null {
    // Extract Health Star Rating from various possible sources
    const sources = [
      nutrition.healthStarRating,
      nutrition.health_star_rating,
      nutrition.health_star,
      nutrition.star_rating,
      nutrition.rating
    ];

    for (const source of sources) {
      if (source !== null && source !== undefined) {
        const rating = parseFloat(source);
        if (!isNaN(rating) && rating >= 0 && rating <= 5) {
          return rating;
        }
      }
    }

    return null;
  }

  static addAustralianCompliance(product: FoodItem): FoodItem {
    const australianInfo = this.detectAustralianProduct(product);
    
    if (!australianInfo.isAustralian) {
      return product;
    }

    // Add Australian nutrition panel compliance
    const enhanced = { ...product };
    
    // Australian nutrition panels must include:
    // - Energy (kJ and kcal)
    // - Protein (g)
    // - Total fat (g)
    // - Saturated fat (g)
    // - Carbohydrate (g)
    // - Sugars (g)
    // - Sodium (mg)
    // - Per 100g and per serving

    if (enhanced.calories && enhanced.protein && enhanced.fat && enhanced.carbs) {
      enhanced.verified = true;
    }

    return enhanced;
  }

  private static extractBrand(product: any): string | undefined {
    const brand = product.brand || product.brands || product.manufacturer;
    if (brand) {
      return brand;
    }

    // Try to extract from name
    const name = product.name || '';
    for (const australianBrand of this.AUSTRALIAN_BRANDS) {
      if (name.toLowerCase().includes(australianBrand.toLowerCase())) {
        return australianBrand;
      }
    }

    return undefined;
  }

  private static detectRetailer(product: any): 'Coles' | 'Woolworths' | 'ALDI' | 'IGA' | 'Other' {
    const name = (product.name || '').toLowerCase();
    const brand = (product.brand || '').toLowerCase();

    if (name.includes('coles') || brand.includes('coles')) {
      return 'Coles';
    }
    if (name.includes('woolworths') || brand.includes('woolworths') || name.includes('woolies')) {
      return 'Woolworths';
    }
    if (name.includes('aldi') || brand.includes('aldi')) {
      return 'ALDI';
    }
    if (name.includes('iga') || brand.includes('iga')) {
      return 'IGA';
    }

    return 'Other';
  }

  private static extractHealthStarRating(product: any): number | null {
    return this.getHealthStarRating(product);
  }

  private static isNutritionPanelCompliant(product: any): boolean {
    // Check if product has required nutrition information for Australian standards
    const requiredFields = ['calories', 'protein', 'fat', 'carbs'];
    return requiredFields.every(field => 
      product[field] !== null && product[field] !== undefined && product[field] > 0
    );
  }

  private static hasAustralianServingSize(product: any): boolean {
    const servingSize = (product.serving_size || '').toLowerCase();
    
    // Australian serving sizes typically use metric units
    const australianUnits = ['g', 'gram', 'grams', 'ml', 'millilitre', 'millilitres', 'l', 'litre', 'litres'];
    const hasAustralianUnits = australianUnits.some(unit => servingSize.includes(unit));
    
    // Check for common Australian serving descriptions
    const australianServingTerms = [
      'serve', 'serving', 'portion', 'piece', 'slice', 'cup', 'tablespoon', 'teaspoon',
      'tbsp', 'tsp', 'ml', 'g', 'kg', 'l', 'pack', 'container', 'bottle', 'can',
      'tin', 'jar', 'packet', 'bag', 'box', 'tub', 'pot', 'sachet', 'sachets'
    ];
    
    const hasAustralianTerms = australianServingTerms.some(term => servingSize.includes(term));
    
    return hasAustralianUnits || hasAustralianTerms;
  }

  private static convertToAustralianServingSize(servingSize: string): string {
    // Convert common US serving sizes to Australian equivalents
    const conversions: { [key: string]: string } = {
      'cup': '250ml',
      'cups': '250ml',
      'tablespoon': '15ml',
      'tablespoons': '15ml',
      'tbsp': '15ml',
      'teaspoon': '5ml',
      'teaspoons': '5ml',
      'tsp': '5ml',
      'ounce': '28g',
      'ounces': '28g',
      'oz': '28g',
      'pound': '454g',
      'pounds': '454g',
      'lb': '454g',
      'fluid ounce': '30ml',
      'fluid ounces': '30ml',
      'fl oz': '30ml'
    };

    let converted = servingSize;
    Object.entries(conversions).forEach(([us, au]) => {
      const regex = new RegExp(`\\b${us}\\b`, 'gi');
      converted = converted.replace(regex, au);
    });

    return converted;
  }

  // Get Australian nutrition recommendations
  static getAustralianNutritionRecommendations(): {
    dailyCalories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
  } {
    return {
      dailyCalories: 8700, // kJ (2080 kcal)
      protein: 64, // g for adult male
      carbs: 310, // g
      fat: 70, // g
      fiber: 30, // g
      sodium: 2000 // mg
    };
  }

  // Check if product meets Australian dietary guidelines
  static checkAustralianDietaryGuidelines(product: FoodItem): {
    isHealthy: boolean;
    recommendations: string[];
    warnings: string[];
  } {
    const recommendations: string[] = [];
    const warnings: string[] = [];

    // Check sodium content (Australian recommendation: <2000mg/day)
    if (product.sodium && product.sodium > 400) { // per 100g
      warnings.push('High sodium content - consider lower sodium alternatives');
    }

    // Check sugar content (Australian recommendation: <50g/day)
    if (product.sugar && product.sugar > 15) { // per 100g
      warnings.push('High sugar content - consider lower sugar alternatives');
    }

    // Check fiber content (Australian recommendation: 25-30g/day)
    if (product.fiber && product.fiber > 3) { // per 100g
      recommendations.push('Good source of dietary fiber');
    } else if (product.fiber && product.fiber < 1) {
      warnings.push('Low fiber content');
    }

    // Check protein content
    if (product.protein && product.protein > 10) { // per 100g
      recommendations.push('Good source of protein');
    }

    const isHealthy = warnings.length === 0 && recommendations.length > 0;

    return {
      isHealthy,
      recommendations,
      warnings
    };
  }
}
