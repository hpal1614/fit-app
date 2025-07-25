import React from 'react';
import { Send } from 'lucide-react';
import { StreamingMessage } from '../../services/ai/ConversationManager';

interface QuickReplyGeneratorProps {
  conversation: StreamingMessage[];
  workoutContext?: any;
  onSelectReply: (reply: string) => void;
}

export const QuickReplyGenerator: React.FC<QuickReplyGeneratorProps> = ({
  conversation,
  workoutContext,
  onSelectReply
}) => {
  const generateReplies = (): string[] => {
    if (conversation.length === 0) {
      // Initial conversation starters
      return [
        "Create a workout plan for me",
        "Help me with nutrition",
        "Check my exercise form",
        "I need motivation",
        "What should I eat today?"
      ];
    }

    const lastMessage = conversation[conversation.length - 1];
    const messageContent = lastMessage.content.toLowerCase();
    
    // Workout-specific replies
    if (messageContent.includes('workout') || messageContent.includes('exercise')) {
      if (workoutContext?.isActive) {
        return [
          "What's the next exercise?",
          "Show proper form",
          "How many reps?",
          "Alternative exercise?",
          "End workout"
        ];
      }
      return [
        "Show me a workout plan",
        "How's my form?",
        "What muscles does this target?",
        "How many sets should I do?",
        "Alternative exercises?"
      ];
    }
    
    // Nutrition-specific replies
    if (messageContent.includes('nutrition') || messageContent.includes('diet') || messageContent.includes('eat')) {
      return [
        "Calculate my macros",
        "Healthy meal ideas",
        "Post-workout nutrition",
        "How many calories?",
        "Supplement advice?"
      ];
    }
    
    // Form check replies
    if (messageContent.includes('form') || messageContent.includes('technique')) {
      return [
        "Common mistakes?",
        "Safety tips",
        "Video demonstration",
        "Muscle activation cues",
        "Progression tips"
      ];
    }
    
    // Progress-related replies
    if (messageContent.includes('progress') || messageContent.includes('results')) {
      return [
        "How to track progress?",
        "When will I see results?",
        "Plateau breakers",
        "Measurement tips",
        "Success indicators"
      ];
    }
    
    // Motivation-specific replies
    if (messageContent.includes('tired') || messageContent.includes('motivation') || messageContent.includes('hard')) {
      return [
        "Give me motivation",
        "Why is this important?",
        "Success stories",
        "Quick energy boost",
        "Easier alternatives?"
      ];
    }

    // Plan-related replies
    if (messageContent.includes('plan') || messageContent.includes('schedule')) {
      return [
        "Weekly schedule",
        "Rest day advice",
        "How to stay consistent",
        "Adjust my plan",
        "Recovery tips"
      ];
    }

    // Injury or pain related
    if (messageContent.includes('pain') || messageContent.includes('hurt') || messageContent.includes('injury')) {
      return [
        "Should I rest?",
        "Recovery exercises",
        "When to see a doctor",
        "Injury prevention",
        "Safe alternatives"
      ];
    }
    
    // Default contextual replies based on assistant's last response
    if (lastMessage.role === 'assistant') {
      if (messageContent.includes('?')) {
        // Assistant asked a question
        return [
          "Yes, that sounds good",
          "No, I prefer something else",
          "Tell me more",
          "I need clarification",
          "Let's try that"
        ];
      }
      
      if (messageContent.includes('try') || messageContent.includes('recommend')) {
        // Assistant made a recommendation
        return [
          "Show me how",
          "Any alternatives?",
          "Why this specifically?",
          "I'll try it",
          "What's next?"
        ];
      }
    }
    
    // Default fitness replies
    return [
      "Tell me more",
      "What's next?",
      "Any tips?",
      "Show me examples",
      "How often?"
    ];
  };

  const replies = generateReplies();

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      <p className="text-xs text-gray-500 dark:text-gray-400 w-full mb-1">Suggested replies:</p>
      {replies.map((reply, index) => (
        <button
          key={index}
          onClick={() => onSelectReply(reply)}
          className="group flex items-center gap-1.5 px-3 py-1.5 text-sm 
            bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 
            rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 
            hover:border-blue-300 dark:hover:border-blue-600 
            transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <span className="text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {reply}
          </span>
          <Send className="w-3 h-3 text-gray-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      ))}
    </div>
  );
};

export default QuickReplyGenerator;