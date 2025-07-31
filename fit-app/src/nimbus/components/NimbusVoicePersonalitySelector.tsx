import React, { useState, useEffect } from 'react';
import { Volume2, Check, X } from 'lucide-react';
import { NimbusCard } from './NimbusCard';
import { NimbusButton } from './NimbusButton';
import { nimbusVoice, VoicePersonality } from '../services/NimbusVoiceService';

interface NimbusVoicePersonalitySelectorProps {
  onClose?: () => void;
  onSelect?: (personalityId: string) => void;
  currentPersonalityId?: string;
}

export const NimbusVoicePersonalitySelector: React.FC<NimbusVoicePersonalitySelectorProps> = ({
  onClose,
  onSelect,
  currentPersonalityId
}) => {
  const [personalities, setPersonalities] = useState<VoicePersonality[]>([]);
  const [selectedId, setSelectedId] = useState<string>(currentPersonalityId || 'motivator');
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  
  useEffect(() => {
    // Get available personalities
    setPersonalities(nimbusVoice.getPersonalities());
  }, []);
  
  const handleSelect = (personalityId: string) => {
    setSelectedId(personalityId);
    nimbusVoice.setPersonality(personalityId);
    onSelect?.(personalityId);
  };
  
  const handlePreview = async (personality: VoicePersonality) => {
    if (isPlaying) return;
    
    setIsPlaying(personality.id);
    
    // Temporarily switch to this personality
    const currentState = nimbusVoice.getState();
    nimbusVoice.setPersonality(personality.id);
    
    // Play a sample greeting
    try {
      await nimbusVoice.speak(personality.phrases.greeting[0]);
    } catch (error) {
      console.error('Failed to preview voice:', error);
    }
    
    // Restore previous personality if different
    if (currentState.currentPersonality.id !== personality.id) {
      nimbusVoice.setPersonality(currentState.currentPersonality.id);
    }
    
    setIsPlaying(null);
  };
  
  const getPersonalityTraitBar = (value: number, color: string) => (
    <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
      <div 
        className={`h-full rounded-full transition-all duration-300 ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <NimbusCard 
        variant="elevated" 
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Choose Your Voice Coach
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Select a personality that matches your training style
            </p>
          </div>
          
          {onClose && (
            <NimbusButton
              variant="ghost"
              size="sm"
              icon={<X className="w-5 h-5" />}
              onClick={onClose}
            />
          )}
        </div>
        
        {/* Personality Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid gap-4 md:grid-cols-2">
            {personalities.map((personality) => {
              const isSelected = selectedId === personality.id;
              
              return (
                <NimbusCard
                  key={personality.id}
                  variant={isSelected ? 'bordered' : 'default'}
                  className={`
                    relative cursor-pointer transition-all duration-200
                    ${isSelected 
                      ? 'ring-2 ring-primary-500 border-primary-500' 
                      : 'hover:shadow-lg'
                    }
                  `}
                  onClick={() => handleSelect(personality.id)}
                >
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                  
                  {/* Personality info */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-4xl">{personality.avatar}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                        {personality.name}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {personality.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Traits */}
                  <div className="space-y-3 mb-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-600 dark:text-neutral-400">Energy</span>
                        <span className="text-neutral-900 dark:text-white">{personality.traits.energy}%</span>
                      </div>
                      {getPersonalityTraitBar(personality.traits.energy, 'bg-orange-500')}
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-600 dark:text-neutral-400">Strictness</span>
                        <span className="text-neutral-900 dark:text-white">{personality.traits.strictness}%</span>
                      </div>
                      {getPersonalityTraitBar(personality.traits.strictness, 'bg-red-500')}
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-600 dark:text-neutral-400">Humor</span>
                        <span className="text-neutral-900 dark:text-white">{personality.traits.humor}%</span>
                      </div>
                      {getPersonalityTraitBar(personality.traits.humor, 'bg-yellow-500')}
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-600 dark:text-neutral-400">Empathy</span>
                        <span className="text-neutral-900 dark:text-white">{personality.traits.empathy}%</span>
                      </div>
                      {getPersonalityTraitBar(personality.traits.empathy, 'bg-blue-500')}
                    </div>
                  </div>
                  
                  {/* Sample phrases */}
                  <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3 mb-4">
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Sample phrase:</p>
                    <p className="text-sm italic text-neutral-800 dark:text-neutral-200">
                      "{personality.phrases.encouragement[0]}"
                    </p>
                  </div>
                  
                  {/* Preview button */}
                  <NimbusButton
                    variant="ghost"
                    size="sm"
                    fullWidth
                    icon={<Volume2 className="w-4 h-4" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(personality);
                    }}
                    loading={isPlaying === personality.id}
                    disabled={isPlaying !== null && isPlaying !== personality.id}
                  >
                    {isPlaying === personality.id ? 'Playing...' : 'Preview Voice'}
                  </NimbusButton>
                </NimbusCard>
              );
            })}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex justify-end gap-3">
            {onClose && (
              <NimbusButton
                variant="ghost"
                onClick={onClose}
              >
                Cancel
              </NimbusButton>
            )}
            <NimbusButton
              variant="primary"
              onClick={() => onClose?.()}
            >
              Confirm Selection
            </NimbusButton>
          </div>
        </div>
      </NimbusCard>
    </div>
  );
};