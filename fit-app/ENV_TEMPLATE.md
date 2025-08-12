# 🔑 Environment Variables Setup

## **Step 1: Create .env file**

Create a file named `.env` in your project root (same directory as `package.json`) with the following content:

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

1. **Restart your development server:**
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

2. **Navigate to the debug page:**
   - Go to: http://localhost:5176
   - Click "Debug" button
   - Click "Check Environment Variables"

3. **Expected Results:**
   - ✅ All environment variables should show as "Set"
   - ✅ Open Food Facts should work (no API key needed)
   - ❌ Other APIs will show errors until you add valid keys

## **Step 4: Quick Test with Open Food Facts Only**

If you want to test immediately without setting up other APIs:

1. **Open Food Facts works without any API key**
2. **Test with this barcode:** `3017620422003` (Nutella)
3. **You should see nutrition data**

## **Step 5: Troubleshooting**

### **Common Issues:**

1. **"Environment variables not set"**
   - Make sure `.env` file is in the project root
   - Restart the development server after creating `.env`
   - Check that variable names start with `VITE_`

2. **"API not available"**
   - Verify API keys are correct
   - Check API quotas haven't been exceeded
   - Test API keys individually

3. **"CORS errors"**
   - Some APIs may have CORS restrictions
   - Check browser console for specific errors

### **Testing Commands:**

```bash
# Check if .env file exists
ls -la .env

# Restart development server
npm run dev

# Check environment variables in browser console
console.log(import.meta.env.VITE_FATSECRET_CONSUMER_KEY)
```

## **Step 6: Next Steps**

Once your environment variables are set:

1. **Test individual APIs** using the Debug page
2. **Verify Australian barcodes** work
3. **Check nutrition tracker** functionality
4. **Monitor API usage** and quotas

---

## 🎯 **Success Indicators**

✅ **Environment variables are set**  
✅ **Open Food Facts returns data**  
✅ **Other APIs show proper errors (not "not set")**  
✅ **No console errors**  
✅ **Nutrition tracker works with Open Food Facts**

If you see these indicators, your setup is working correctly! 🚀
