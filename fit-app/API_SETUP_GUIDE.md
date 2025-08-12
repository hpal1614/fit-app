# 🔑 API Setup Guide

## **Step 1: Create Environment File**

Create a `.env` file in your project root with your API keys:

```bash
# FatSecret Platform API (5,000 free calls/day)
VITE_FATSECRET_CONSUMER_KEY=your_fatsecret_consumer_key_here
VITE_FATSECRET_CONSUMER_SECRET=your_fatsecret_consumer_secret_here

# Spoonacular API (150 free calls/day)
VITE_SPOONACULAR_API_KEY=your_spoonacular_api_key_here

# Nutritionix API (500 free calls/month)
VITE_NUTRITIONIX_APP_ID=your_nutritionix_app_id_here
VITE_NUTRITIONIX_APP_KEY=your_nutritionix_app_key_here

# USDA Food Data Central (unlimited free)
VITE_USDA_API_KEY=your_usda_api_key_here
```

## **Step 2: Get Your API Keys**

### **FatSecret Platform API**
1. Go to: https://platform.fatsecret.com/api/
2. Sign up for a developer account
3. Create a new application
4. Get your Consumer Key and Consumer Secret

### **Spoonacular API**
1. Go to: https://spoonacular.com/food-api
2. Sign up for a free account
3. Get your API key from the dashboard

### **Nutritionix API**
1. Go to: https://www.nutritionix.com/business/api
2. Sign up for a developer account
3. Create a new application
4. Get your App ID and App Key

### **USDA Food Data Central**
1. Go to: https://fdc.nal.usda.gov/api-key-signup.html
2. Sign up for a free API key
3. Get your API key via email

## **Step 3: Test Your Setup**

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to the app:**
   - Go to: http://localhost:5173
   - Click "API Test" button

3. **Test Australian barcodes:**
   - Tim Tam: `9310072011691`
   - Vegemite: `9300675024235`

4. **Verify API status:**
   - Check that all APIs show green status
   - Test search functionality
   - Verify caching works

## **Step 4: Troubleshooting**

### **Common Issues:**

1. **"API not available" errors:**
   - Check your API keys are correct
   - Verify API quotas haven't been exceeded
   - Check network connectivity

2. **FatSecret OAuth errors:**
   - Ensure Consumer Key and Secret are correct
   - Check OAuth 1.0 implementation

3. **CORS errors:**
   - Some APIs may have CORS restrictions
   - Check browser console for specific errors

4. **Rate limiting:**
   - Check quota usage in the API Test interface
   - Wait for daily/monthly limits to reset

### **Testing Commands:**

```bash
# Check if dependencies are installed
npm list oauth-1.0a crypto-js

# Restart development server
npm run dev

# Clear browser cache and reload
# (Ctrl+Shift+R or Cmd+Shift+R)
```

## **Step 5: Next Steps**

Once your APIs are working:

1. **Test the Nutrition Tracker:**
   - Click "Nutrition Tracker" button
   - Try searching for foods
   - Test adding items to your daily log

2. **Explore Advanced Features:**
   - Test bulk barcode lookup
   - Check cache statistics
   - Monitor API usage

3. **Plan Enhancements:**
   - Add barcode scanner
   - Implement voice input
   - Create AI meal suggestions

---

## 🎯 **Success Indicators**

✅ **All APIs show green status**  
✅ **Australian barcodes return results**  
✅ **Search functionality works**  
✅ **Cache statistics are tracking**  
✅ **No console errors**  
✅ **Nutrition tracker updates work**

If you see all these indicators, your nutrition API is ready for production use! 🚀
