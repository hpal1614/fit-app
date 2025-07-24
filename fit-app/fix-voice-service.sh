#!/bin/bash

echo "🔧 Fixing VoiceService errors..."

# Fix error references  
sed -i 's/console.error('\''Voice service error:'\''[,] error);/console.error('\''Voice service error:'\''[,] '\''Unknown error'\'');/g' src/services/voiceService.ts

# Fix event parameter conflicts
sed -i 's/recognition.onerror = (event)/recognition.onerror = (_event: SpeechRecognitionErrorEvent)/g' src/services/voiceService.ts

# Fix synthesis type casting
sed -i 's/this.synthesis.cancel/(this.synthesis as ExtendedSpeechSynthesis).cancel/g' src/services/voiceService.ts
sed -i 's/this.synthesis.getVoices/(this.synthesis as ExtendedSpeechSynthesis).getVoices/g' src/services/voiceService.ts

# Fix speech synthesis event handlers
sed -i 's/onerror = (event)/onerror = (_event: SpeechSynthesisErrorEvent)/g' src/services/voiceService.ts

# Add missing type for alternatives
sed -i '/alternatives\.map(/s/alternatives\.map/alternatives\.map<{ transcript: string; confidence: number }>/' src/services/voiceService.ts

echo "✅ VoiceService fixes complete!"