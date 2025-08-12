/**
 * Utility functions for repairing and validating JSON strings
 * Specifically designed for AI-generated responses
 */

export interface JSONRepairResult {
  success: boolean;
  data?: any;
  errors: string[];
  repaired: boolean;
  originalLength: number;
  repairedLength?: number;
}

/**
 * Attempt to repair common JSON formatting issues in AI responses
 */
export function repairAndParseJSON(jsonString: string): JSONRepairResult {
  const result: JSONRepairResult = {
    success: false,
    errors: [],
    repaired: false,
    originalLength: jsonString.length
  };

  if (!jsonString || jsonString.trim().length === 0) {
    result.errors.push('Empty JSON string');
    return result;
  }

  // Step 1: Clean the string
  let cleaned = cleanJSONString(jsonString);
  
  // Step 2: Try parsing the cleaned version
  try {
    result.data = JSON.parse(cleaned);
    result.success = true;
    return result;
  } catch (parseError) {
    result.errors.push(`Initial parse failed: ${parseError}`);
  }

  // Step 3: Attempt repairs
  const repaired = attemptJSONRepairs(cleaned);
  if (repaired) {
    result.repairedLength = repaired.length;
    try {
      result.data = JSON.parse(repaired);
      result.success = true;
      result.repaired = true;
      return result;
    } catch (repairError) {
      result.errors.push(`Repair parse failed: ${repairError}`);
    }
  }

  // Step 4: Try extracting JSON from mixed content
  const extracted = extractJSONFromMixedContent(jsonString);
  if (extracted) {
    try {
      result.data = JSON.parse(extracted);
      result.success = true;
      result.repaired = true;
      result.repairedLength = extracted.length;
      return result;
    } catch (extractError) {
      result.errors.push(`Extraction parse failed: ${extractError}`);
    }
  }

  result.errors.push('All repair attempts failed');
  return result;
}

/**
 * Clean JSON string by removing common formatting issues
 */
function cleanJSONString(str: string): string {
  return str
    .trim()
    // Remove markdown code blocks
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    // Remove leading/trailing non-JSON content
    .replace(/^[^{]*({.*})[^}]*$/s, '$1')
    .replace(/^[^[]*(\[.*\])[^\]]*$/s, '$1');
}

/**
 * Attempt various JSON repair strategies
 */
function attemptJSONRepairs(jsonStr: string): string | null {
  let repaired = jsonStr;

  try {
    // Fix 1: Add missing quotes around object keys
    repaired = repaired.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');

    // Fix 2: Fix trailing commas
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

    // Fix 3: Convert single quotes to double quotes (but be careful with apostrophes)
    repaired = repaired.replace(/'/g, '"');
    repaired = repaired.replace(/"([\w\s]+)"s"(\w)/g, '"$1\'s$2"'); // Fix possessives

    // Fix 4: Fix unquoted string values (basic cases)
    repaired = repaired.replace(/:\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*([,}\]])/g, ':"$1"$2');

    // Fix 5: Fix boolean and null values that got quoted
    repaired = repaired.replace(/"(true|false|null)"/g, '$1');

    // Fix 6: Fix numeric values that got quoted
    repaired = repaired.replace(/:"(\d+\.?\d*)"/g, ':$1');

    // Fix 7: Remove extra commas
    repaired = repaired.replace(/,+/g, ',');

    // Fix 8: Fix missing commas between array elements
    repaired = repaired.replace(/}(\s*){/g, '},$1{');
    repaired = repaired.replace(/](\s*)\[/g, '],$1[');

    // Fix 9: Fix incomplete strings at the end
    repaired = repaired.replace(/:\s*"([^"]*)$/g, ':"$1"');

    return repaired;
  } catch (error) {
    console.warn('JSON repair failed:', error);
    return null;
  }
}

/**
 * Extract JSON from mixed content (text + JSON)
 */
function extractJSONFromMixedContent(str: string): string | null {
  // Try to find JSON object
  const objectMatch = str.match(/{[^{}]*(?:{[^{}]*}[^{}]*)*}/);
  if (objectMatch) {
    return objectMatch[0];
  }

  // Try to find JSON array
  const arrayMatch = str.match(/\[[^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*\]/);
  if (arrayMatch) {
    return arrayMatch[0];
  }

  return null;
}

/**
 * Validate that parsed JSON contains expected fields
 */
export function validateAIResponse(data: any, requiredFields: string[] = []): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const field of requiredFields) {
    if (!(field in data)) {
      missing.push(field);
    }
  }

  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Create a standardized error response for AI processing failures
 */
export function createFallbackAIResponse(exerciseNames: string[]): any {
  return {
    canonicalized: exerciseNames.map(name => ({
      original: name,
      canonical: name, // Keep original if AI fails
      muscleGroups: ['Unknown'],
      equipment: ['General'],
      difficulty: 'intermediate',
      category: 'strength'
    })),
    programType: 'Custom',
    confidence: 0.3 // Low confidence for fallback
  };
}

/**
 * Enhanced JSON parsing with multiple fallback strategies
 */
export function parseAIResponseWithFallbacks(response: string, exerciseNames: string[] = []): any {
  // Strategy 1: Direct repair and parse
  const repairResult = repairAndParseJSON(response);
  if (repairResult.success) {
    console.log(`✅ JSON parsed successfully${repairResult.repaired ? ' (after repair)' : ''}`);
    return repairResult.data;
  }

  console.warn('⚠️ JSON parsing failed, attempting fallbacks...');

  // Strategy 2: Extract and parse key-value pairs manually
  try {
    const manualParse = manualJSONExtraction(response);
    if (manualParse) {
      console.log('✅ Manual JSON extraction successful');
      return manualParse;
    }
  } catch (error) {
    console.warn('Manual extraction failed:', error);
  }

  // Strategy 3: Use regex to extract specific data
  try {
    const regexParse = regexBasedExtraction(response, exerciseNames);
    if (regexParse) {
      console.log('✅ Regex extraction successful');
      return regexParse;
    }
  } catch (error) {
    console.warn('Regex extraction failed:', error);
  }

  // Strategy 4: Return fallback response
  console.warn('🔄 All parsing strategies failed, using fallback');
  return createFallbackAIResponse(exerciseNames);
}

/**
 * Manually extract JSON-like data using patterns
 */
function manualJSONExtraction(response: string): any | null {
  try {
    const result: any = {};

    // Extract canonicalized exercises
    const exerciseMatches = response.matchAll(/"original":\s*"([^"]+)".*?"canonical":\s*"([^"]+)"/g);
    result.canonicalized = [];
    
    for (const match of exerciseMatches) {
      result.canonicalized.push({
        original: match[1],
        canonical: match[2],
        muscleGroups: ['General'],
        equipment: ['General'],
        difficulty: 'intermediate',
        category: 'strength'
      });
    }

    // Extract program type
    const programTypeMatch = response.match(/"programType":\s*"([^"]+)"/);
    result.programType = programTypeMatch ? programTypeMatch[1] : 'Custom';

    // Extract confidence
    const confidenceMatch = response.match(/"confidence":\s*([\d.]+)/);
    result.confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5;

    return result.canonicalized.length > 0 ? result : null;
  } catch (error) {
    return null;
  }
}

/**
 * Regex-based extraction for specific patterns
 */
function regexBasedExtraction(response: string, exerciseNames: string[]): any | null {
  try {
    const result: any = {
      canonicalized: [],
      programType: 'Custom',
      confidence: 0.4
    };

    // If we have exercise names, try to find canonical mappings
    for (const exerciseName of exerciseNames) {
      // Look for patterns like "Exercise Name -> Canonical Name"
      const mappingPattern = new RegExp(`${exerciseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*?->.*?([A-Za-z\\s]+)`, 'i');
      const match = response.match(mappingPattern);
      
      result.canonicalized.push({
        original: exerciseName,
        canonical: match ? match[1].trim() : exerciseName,
        muscleGroups: ['General'],
        equipment: ['General'],
        difficulty: 'intermediate',
        category: 'strength'
      });
    }

    return result.canonicalized.length > 0 ? result : null;
  } catch (error) {
    return null;
  }
}
