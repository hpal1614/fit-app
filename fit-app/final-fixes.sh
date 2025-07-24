#!/bin/bash

echo "🚀 Final comprehensive error fixes..."

# Fix all remaining any types with proper replacements
echo "✅ Replacing remaining any types..."

# Replace any[] with unknown[]
find src -name "*.ts*" -type f -exec sed -i 's/: any\[\]/: unknown[]/g' {} \;

# Replace specific any usages with proper types
find src -name "*.ts*" -type f -exec sed -i \
  -e 's/props: any/props: Record<string, unknown>/g' \
  -e 's/state: any/state: Record<string, unknown>/g' \
  -e 's/data: any/data: unknown/g' \
  -e 's/result: any/result: unknown/g' \
  -e 's/response: any/response: unknown/g' \
  -e 's/request: any/request: unknown/g' \
  -e 's/value: any/value: unknown/g' \
  -e 's/item: any/item: unknown/g' \
  -e 's/element: any/element: unknown/g' \
  -e 's/object: any/object: Record<string, unknown>/g' \
  -e 's/array: any/array: unknown[]/g' \
  -e 's/callback: any/callback: (...args: unknown[]) => unknown/g' \
  -e 's/handler: any/handler: (...args: unknown[]) => void/g' \
  -e 's/listener: any/listener: (event: Event) => void/g' \
  -e 's/options?: any/options?: Record<string, unknown>/g' \
  -e 's/config: any/config: Record<string, unknown>/g' \
  -e 's/params: any/params: Record<string, unknown>/g' \
  -e 's/args: any/args: unknown[]/g' \
  -e 's/\.\.\._args: any/\.\.\._args: unknown/g' \
  {} \;

# Fix specific service any types
sed -i 's/api: any/api: { get: (url: string) => Promise<unknown>; post: (url: string, data: unknown) => Promise<unknown> }/g' src/services/*.ts 2>/dev/null || true

# Fix voiceService specific types
echo "✅ Adding voice service types..."
cat >> src/services/voiceService.ts << 'EOF'

// Speech API type definitions
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
EOF

# Add missing LearningMetrics if not already added
grep -q "LearningMetrics" src/types/ai.ts || echo "export interface LearningMetrics { accuracy: number; responseTime: number; userSatisfaction: number; }" >> src/types/ai.ts

echo "✨ Final fixes applied! Running app..."