import React, { useState } from 'react';
import { X, Send, Brain } from 'lucide-react';

interface SimpleAIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimpleAIChat: React.FC<SimpleAIChatProps> = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);

  const handleSubmit = () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    
    // Generate AI response
    setTimeout(() => {
      let response = "I'm your AI fitness coach! ";
      const lower = userMsg.toLowerCase();
      
      if (lower.includes('workout')) {
        response += "I can help you create a personalized workout plan. What are your fitness goals?";
      } else if (lower.includes('diet') || lower.includes('nutrition')) {
        response += "Nutrition is key! I recommend balanced meals with adequate protein.";
      } else if (lower.includes('hello') || lower.includes('hi')) {
        response = "Hello! How can I help you with your fitness journey today?";
      } else {
        response += "Ask me about workouts, nutrition, or fitness goals!";
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="text-xl font-semibold text-white">AI Fitness Coach</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Hi! I'm your AI fitness coach. Ask me anything!</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] p-3 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-gray-100'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 border-t border-gray-800">
          <div className="flex gap-2">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Ask about fitness, workouts, nutrition..."
              className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button 
              onClick={handleSubmit}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};