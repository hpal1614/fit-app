#!/bin/bash

# Create .env file with all API keys
cat > .env << 'EOF'
# FatSecret Platform API (5,000 free calls/day)
VITE_FATSECRET_CONSUMER_KEY=70f7cbfa2c4e429daa30f5e282d1215c
VITE_FATSECRET_CONSUMER_SECRET=8011af8a055d4025af9922d9f1e0b83e

# Spoonacular API (150 free calls/day)
VITE_SPOONACULAR_API_KEY=fccd4e5cf10847ddaca489ebd5848df4

# Nutritionix API (500 free calls/month)
VITE_NUTRITIONIX_APP_ID=1a1b536363a2acc29f0ee1968bb0f734
VITE_NUTRITIONIX_APP_KEY=1a1b536363a2acc29f0ee1968bb0f734

# USDA Food Data Central (unlimited free)
VITE_USDA_API_KEY=LT6yr1TmI3oFf1QIcUk5nLZoFc3nhIuWag0BymLq
EOF

echo "✅ .env file created successfully!"
echo "🔑 All API keys have been added:"
echo "   - FatSecret: ✅"
echo "   - Spoonacular: ✅"
echo "   - Nutritionix: ✅"
echo "   - USDA: ✅"
echo ""
echo "🚀 Next steps:"
echo "1. Restart your development server: npm run dev"
echo "2. Go to http://localhost:5176"
echo "3. Click 'Debug' button to test all APIs"
echo "4. Test with barcode: 3017620422003 (Nutella)"
