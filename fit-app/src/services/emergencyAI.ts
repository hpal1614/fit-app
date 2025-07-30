// Emergency AI service that ALWAYS works
export async function sendEmergencyAI(message: string): Promise<string> {
  console.log('🤖 Emergency AI called with:', message);
  
  // Simple keyword responses (no API needed)
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('workout') || lowerMessage.includes('exercise')) {
    return "Great! I'm here to help with your workout. Focus on proper form and listen to your body. What exercise are you working on?";
  }
  
  if (lowerMessage.includes('weight') || lowerMessage.includes('heavy')) {
    return "Choose a weight that challenges you while maintaining perfect form. You should have 1-2 reps left in the tank at the end of each set.";
  }
  
  if (lowerMessage.includes('tired') || lowerMessage.includes('rest')) {
    return "Rest is crucial! Take longer breaks between sets if needed. Quality over quantity always wins. Stay hydrated!";
  }
  
  if (lowerMessage.includes('form') || lowerMessage.includes('technique')) {
    return "Perfect form is everything! Focus on controlled movements, full range of motion, and mind-muscle connection. Need specific form tips?";
  }
  
  if (lowerMessage.includes('motivation') || lowerMessage.includes('encourage')) {
    return "You're doing amazing! Every rep counts, every workout matters. Progress isn't always linear, but consistency pays off. Keep pushing!";
  }

  if (lowerMessage.includes('squat')) {
    return "For squats: Keep your chest up, knees tracking over toes, and drive through your heels. Go as deep as your mobility allows while maintaining a neutral spine.";
  }

  if (lowerMessage.includes('deadlift')) {
    return "For deadlifts: Keep the bar close to your body, maintain a neutral spine, and engage your lats. Push the floor away rather than pulling the bar up.";
  }

  if (lowerMessage.includes('bench') || lowerMessage.includes('press')) {
    return "For bench press: Plant your feet firmly, maintain a slight arch, and keep your shoulder blades retracted. Control the descent and drive through your feet.";
  }

  if (lowerMessage.includes('nutrition') || lowerMessage.includes('diet') || lowerMessage.includes('eat')) {
    return "Nutrition is key! Focus on whole foods, adequate protein (0.8-1g per lb bodyweight), and stay hydrated. What aspect of nutrition can I help with?";
  }

  if (lowerMessage.includes('protein')) {
    return "Aim for 0.8-1g of protein per pound of body weight. Good sources include chicken, fish, eggs, Greek yogurt, and legumes. Spread intake throughout the day.";
  }

  if (lowerMessage.includes('beginner') || lowerMessage.includes('start')) {
    return "Welcome to your fitness journey! Start with basic compound movements, focus on form over weight, and be consistent. 3-4 days per week is perfect to start.";
  }

  if (lowerMessage.includes('sore') || lowerMessage.includes('pain')) {
    return "Muscle soreness is normal, but sharp pain isn't. Light movement, stretching, and adequate protein/water help recovery. Rest if needed!";
  }

  if (lowerMessage.includes('progress') || lowerMessage.includes('results')) {
    return "Progress takes time! Take photos, track your lifts, and measure consistently. Changes happen slowly but surely. Trust the process!";
  }

  if (lowerMessage.includes('cardio')) {
    return "Cardio is great for heart health! Mix steady-state and HIIT. 150 minutes moderate or 75 minutes vigorous per week is a good target.";
  }

  if (lowerMessage.includes('warmup') || lowerMessage.includes('warm up')) {
    return "Always warm up! Start with 5-10 minutes light cardio, then dynamic stretches and light sets of your main exercises. Your body will thank you!";
  }
  
  // Default response
  return "I'm your AI fitness coach! I can help with workouts, form tips, motivation, and training advice. What would you like to know?";
}

// Emergency workout generator
export function generateEmergencyWorkout(type: string = 'general'): string {
  const workouts = {
    upper: `Upper Body Workout:
1. Push-ups: 3 sets x 10-15 reps
2. Dumbbell Rows: 3 sets x 12 reps
3. Shoulder Press: 3 sets x 10 reps
4. Bicep Curls: 3 sets x 12 reps
5. Tricep Dips: 3 sets x 10 reps
Rest 60-90 seconds between sets`,
    
    lower: `Lower Body Workout:
1. Squats: 3 sets x 12 reps
2. Lunges: 3 sets x 10 per leg
3. Romanian Deadlifts: 3 sets x 12 reps
4. Calf Raises: 3 sets x 15 reps
5. Glute Bridges: 3 sets x 15 reps
Rest 60-90 seconds between sets`,
    
    general: `Full Body Workout:
1. Squats: 3 sets x 10 reps
2. Push-ups: 3 sets x 10 reps
3. Deadlifts: 3 sets x 8 reps
4. Pull-ups/Lat Pulldown: 3 sets x 8 reps
5. Plank: 3 sets x 30-60 seconds
Rest 90 seconds between sets`
  };
  
  return workouts[type] || workouts.general;
}