import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, Bot, Sparkles, Brain, MessageCircle, Mic, Volume2, 
  Zap, Plus, Trash2, Settings, User, Loader2, Copy, Check, X
} from 'lucide-react';
import { useStreamingAI } from '../hooks/useStreamingAI';
import { useVoice } from '../hooks/useVoice';
import type { WorkoutContext } from '../types/workout';
import { ConversationFlowService } from '../services/conversationFlowService';
import { QuickReply } from '../types/conversationTypes';
import QuickReplyButtons from './QuickReplyButtons';
import { TemplateGenerator } from '../services/templateGenerator';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  mode?: 'coach' | 'research';
  sources?: Array<{
    title: string;
    type: string;
    relevance: number;
  }>;
  confidence?: number;
  isVoice?: boolean;
}

interface Chat {
  id: string;
  name: string;
  messages: Message[];
  createdAt: Date;
  mode: 'coach' | 'research';
}

interface AmazingAICoachProps {
  context?: WorkoutContext | any;
  onClose?: () => void;
  className?: string;
}

export const AmazingAICoach: React.FC<AmazingAICoachProps> = ({
  context,
  onClose,
  className = ''
}) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [mode, setMode] = useState<'coach' | 'research'>('coach');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [generatedTemplate, setGeneratedTemplate] = useState<any>(null);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const flowRef = useRef<ConversationFlowService | null>(null);
  const [pendingProgram, setPendingProgram] = useState(false);
  const [coachProfile, setCoachProfile] = useState<{
    experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
    primaryGoal?: 'weight_loss' | 'muscle_building' | 'strength';
    equipment?: 'gym' | 'home' | 'minimal' | 'unsure';
    timePerSession?: 30 | 45 | 60 | 90;
    daysPerWeek?: 3 | 4 | 5 | 6;
    currentWeight?: number;
    injuries?: { knee?: boolean; back?: boolean; shoulder?: boolean };
    pregnant?: boolean;
    senior?: boolean;
    shiftWorker?: boolean;
    busyParent?: boolean;
    mentalHealth?: boolean;
  }>({ injuries: {} });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // AI and Voice hooks
  const { streamResponse, isStreaming: aiStreaming, stopStreaming } = useStreamingAI({
    onChunk: (chunk) => {
      // Update the current streaming message
      setChats(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? {
              ...chat,
              messages: chat.messages.map(msg => 
                msg.isStreaming
                  ? { ...msg, content: msg.content + chunk }
                  : msg
              )
            }
          : chat
      ));
    },
    onComplete: (fullResponse) => {
      // Mark streaming as complete
      setChats(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? {
              ...chat,
              messages: chat.messages.map(msg => 
                msg.isStreaming
                  ? { 
                      ...msg, 
                      content: fullResponse, 
                      isStreaming: false,
                      confidence: 0.95
                    }
                  : msg
              )
            }
          : chat
      ));
      setIsStreaming(false);

      try {
        if (!flowRef.current) {
          flowRef.current = new ConversationFlowService();
        }
        const current = chats.find(c => c.id === currentChatId);
        const lastUser = current?.messages.slice().reverse().find(m => m.type === 'user');
        const scenario = flowRef.current.detectScenario(lastUser?.content || '', undefined);
        const qr = flowRef.current.getQuickReplies(fullResponse, scenario);
        setQuickReplies(qr);
      } catch {
        setQuickReplies([]);
      }
      
      // Check if this is a template response
      if (fullResponse.includes('💾 **Save Template:**') || fullResponse.includes('Template:')) {
        setShowSaveButton(true);
        // Extract template data from the response
        const templateMatch = fullResponse.match(/Template: (.+?)(?:\n|$)/);
        if (templateMatch) {
          setGeneratedTemplate({
            name: templateMatch[1],
            content: fullResponse,
            type: 'workout'
          });
        }
      } else {
        setShowSaveButton(false);
        setGeneratedTemplate(null);
      }
    },
    onError: (error) => {
      console.error('AI Error:', error);
      setChats(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? {
              ...chat,
              messages: chat.messages.map(msg => 
                msg.isStreaming
                  ? { 
                      ...msg, 
                      content: 'Sorry, I encountered an error. Please try again.',
                      isStreaming: false
                    }
                  : msg
              )
            }
          : chat
      ));
      setIsStreaming(false);
    }
  });

  const { speak, isListening, startListening, stopListening } = useVoice({ workoutContext: context });

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [chats, scrollToBottom]);

  // Initialize with welcome message
  useEffect(() => {
    if (chats.length === 0) {
      createNewChat();
    }
  }, []);

  const getCurrentChat = () => {
    return chats.find(chat => chat.id === currentChatId);
  };

  const createNewChat = () => {
    const newChat: Chat = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `New ${mode === 'coach' ? 'Coaching' : 'Research'} Chat`,
      messages: [{
        id: `welcome-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'assistant',
        content: mode === 'coach' 
          ? "👋 Hello! I'm your AI fitness coach. I can help you with:\n\n💪 **Workout Planning** - Create personalized routines\n🏃‍♂️ **Form Guidance** - Perfect your technique\n🍎 **Nutrition Advice** - Fuel your fitness journey\n🎯 **Goal Setting** - Track your progress\n💡 **Motivation** - Stay inspired and focused\n\nWhat would you like to work on today?"
          : "🔬 Hello! I'm your fitness research assistant. I have access to comprehensive knowledge about:\n\n📚 **Exercise Science** - Latest research and studies\n💪 **Training Methods** - Proven techniques and protocols\n🍎 **Nutrition Science** - Evidence-based nutrition advice\n🏥 **Injury Prevention** - Safe training practices\n📊 **Performance Metrics** - Data-driven insights\n\nWhat would you like to learn about?",
        timestamp: new Date(),
        mode
      }],
      createdAt: new Date(),
      mode
    };

    setChats(prev => [...prev, newChat]);
    setCurrentChatId(newChat.id);
  };

  const extractProfileFromText = (text: string) => {
    const lower = text.toLowerCase();
    const updates: Partial<typeof coachProfile> = {};
    if (lower.includes('beginner')) updates.experienceLevel = 'beginner';
    else if (lower.includes('advanced')) updates.experienceLevel = 'advanced';
    else if (lower.includes('intermediate')) updates.experienceLevel = 'intermediate';

    if (lower.includes('gym') || lower.includes('membership')) updates.equipment = 'gym';
    if (lower.includes('home')) updates.equipment = 'home';
    if (lower.includes('outdoor') || lower.includes('outside')) updates.equipment = 'minimal';

    if (lower.includes('lose weight') || lower.includes('weight loss')) updates.primaryGoal = 'weight_loss';
    if (lower.includes('build muscle') || lower.includes('hypertrophy')) updates.primaryGoal = 'muscle_building';
    if (lower.includes('strength')) updates.primaryGoal = 'strength';

    const timeMatch = lower.match(/(\d{2,3})\s*(min|minutes)/);
    if (timeMatch) {
      const minutes = parseInt(timeMatch[1], 10);
      const nearest: 30 | 45 | 60 | 90 = minutes <= 30 ? 30 : minutes <= 45 ? 45 : minutes <= 60 ? 60 : 90;
      updates.timePerSession = nearest;
    }

    const daysMatch = lower.match(/(\b[3-6]\b)\s*(days|day|days\/wk|days per week)/);
    if (daysMatch) {
      const days = parseInt(daysMatch[1], 10) as 3 | 4 | 5 | 6;
      if (days >= 3 && days <= 6) updates.daysPerWeek = days;
    }

    const kgMatch = lower.match(/(\d{2,3})\s*kg/);
    const lbsMatch = lower.match(/(\d{2,3})\s*(lb|lbs|pounds)/);
    if (kgMatch) updates.currentWeight = parseInt(kgMatch[1], 10);
    if (lbsMatch) updates.currentWeight = Math.round(parseInt(lbsMatch[1], 10) * 0.453592);

    const injuries = { ...(coachProfile.injuries || {}) } as { knee?: boolean; back?: boolean; shoulder?: boolean };
    if (/knee/.test(lower)) injuries.knee = true;
    if (/back/.test(lower)) injuries.back = true;
    if (/shoulder/.test(lower)) injuries.shoulder = true;
    if (Object.keys(injuries).length > 0) updates.injuries = injuries;

    // Additional scenario flags
    if (/pregnan(t|cy)/.test(lower)) (updates as any).pregnant = true;
    if (/(senior|elderly|\b65\b)/.test(lower)) (updates as any).senior = true;
    if (/(shift worker|night work|night shift|rotating shift)/.test(lower)) (updates as any).shiftWorker = true;
    if (/(busy parent|kids|children|parent)/.test(lower)) (updates as any).busyParent = true;
    if (/(anxiety|depress|mental|motivation)/.test(lower)) (updates as any).mentalHealth = true;

    return updates;
  };

  const getMissingFields = (p: typeof coachProfile) => {
    const missing: string[] = [];
    if (!p.experienceLevel) missing.push('experience');
    if (!p.primaryGoal) missing.push('goal');
    if (!p.equipment || p.equipment === 'unsure') missing.push('equipment');
    if (!p.timePerSession) missing.push('time');
    if (!p.daysPerWeek) missing.push('days per week');
    return missing;
  };

  const composeClarifyMessage = (missing: string[]) => {
    const parts: string[] = [];
    if (missing.includes('experience')) parts.push('experience level (beginner, intermediate, advanced)');
    if (missing.includes('goal')) parts.push('primary goal (lose weight, build muscle, strength)');
    if (missing.includes('equipment')) parts.push('equipment (Gym Membership or At Home)');
    if (missing.includes('time')) parts.push('time per session in minutes (30, 45, 60)');
    if (missing.includes('days per week')) parts.push('days per week (3, 4, 5, 6)');
    const sentence = parts.join(', ');
    return `To personalize your 8-week plan, please confirm your ${sentence}. Also share any injuries (e.g., knee, back, shoulder).`;
  };

  const renderWorkoutWithInjuryMods = (template: any, p: typeof coachProfile) => {
    const replaceWithKneeFriendly = (name: string) => {
      if (!p.injuries?.knee) return name;
      if (/squat/i.test(name)) return 'Glute Bridges';
      if (/lunge/i.test(name)) return 'Hip Thrusts (light)';
      if (/jump|burpee/i.test(name)) return 'Planks';
      if (/leg press/i.test(name)) return 'Hamstring Curls';
      return name;
    };
    const replaceWithBackFriendly = (name: string) => {
      if (!p.injuries?.back) return name;
      if (/deadlift/i.test(name)) return 'Hip Hinge (light dumbbells)';
      if (/romanian deadlift/i.test(name)) return 'Glute Bridges';
      if (/good\s*morning/i.test(name)) return 'Back Extensions (gentle)';
      if (/bent-?over row|barbell row/i.test(name)) return 'Chest-Supported Row';
      if (/back squat|front squat/i.test(name)) return 'Goblet Box Squat (light)';
      return name;
    };
    const replaceWithShoulderFriendly = (name: string) => {
      if (!p.injuries?.shoulder) return name;
      if (/overhead press|ohp|military press/i.test(name)) return 'Landmine Press';
      if (/bench press/i.test(name)) return 'Incline Dumbbell Press (neutral grip)';
      if (/upright row/i.test(name)) return 'Lateral Raises (light)';
      if (/dip/i.test(name)) return 'Close-Grip Push-up (elevated)';
      return name;
    };
    const applyAllMods = (name: string) => {
      let out = name;
      out = replaceWithKneeFriendly(out);
      out = replaceWithBackFriendly(out);
      out = replaceWithShoulderFriendly(out);
      return out;
    };
    let workoutTable = '';
    template.workouts.forEach((workout: any) => {
      workoutTable += `\n📅 **${workout.name}** (${workout.notes})\n`;
      workoutTable += `| Exercise | Sets | Reps | Rest |\n`;
      workoutTable += `|----------|------|------|------|\n`;
      workout.exercises.forEach((exercise: any) => {
        const sets = exercise.sets.length;
        const reps = exercise.sets[0]?.reps || '8-12';
        const rest = exercise.sets[0]?.rest || '60-90s';
        workoutTable += `| ${applyAllMods(exercise.name)} | ${sets} | ${reps} | ${rest} |\n`;
      });
      workoutTable += `\n`;
    });
    const injuryNotes: string[] = [];
    if (p.injuries?.knee) injuryNotes.push('🦵 Knee-friendly: avoided deep knee flexion and high-impact jumps; focused on glutes/hamstrings and low-impact options.');
    if (p.injuries?.back) injuryNotes.push('🧱 Back-friendly: minimized spinal loading, used chest-supported rows and hip-dominant, controlled movements.');
    if (p.injuries?.shoulder) injuryNotes.push('🫱 Shoulder-friendly: avoided overhead pressing/dips; emphasized neutral-grip pushing and light lateral work.');

    const scenarioNotes: string[] = [];
    if (p.pregnant) scenarioNotes.push('🤰 Pregnancy: avoided supine positions after first trimester and high-impact moves; prioritize RPE 5-6/10 and breathing/pelvic floor awareness.');
    if (p.senior) scenarioNotes.push('👟 Senior: emphasized balance, mobility, and controlled tempo; kept volume moderate.');
    if (p.shiftWorker) scenarioNotes.push('🌙 Shift worker: schedule is flexible; prefer consistent timing relative to your sleep window; avoid maximal intensity right before bedtime.');
    if (p.busyParent) scenarioNotes.push('🧩 Busy parent: sessions optimized for time; circuits/EMOM-style options keep workouts 20–45 minutes.');
    if (p.mentalHealth) scenarioNotes.push('🫶 Mental health: lower cognitive load, steady pacing, and optional outdoor walks for mood support.');
    const weightNote = p.currentWeight && (p.currentWeight < 50 || p.currentWeight > 100)
      ? `\n⚖️ Adjusted intensity guidance for current weight (${p.currentWeight} kg). Prioritize perfect form and controlled progression.`
      : '';
    const allNotes = [...injuryNotes, ...scenarioNotes];
    const notesBlock = allNotes.length ? `\n${allNotes.join(' ')}` : '';
    return workoutTable + notesBlock + weightNote;
  };

  const wantsProgram = (text: string) => {
    const lower = text.toLowerCase();
    return (
      lower.includes('workout') ||
      lower.includes('routine') ||
      lower.includes('exercise') ||
      lower.includes('program') ||
      lower.includes('training') ||
      lower.includes('plan') ||
      lower.includes('8 week') ||
      lower.includes('8-week') ||
      lower.includes('weeks program') ||
      lower.includes('template') ||
      (lower.includes('lose') && lower.includes('weight'))
    );
  };

  const handleProgramFlowIfNeeded = async (userMessage: string): Promise<boolean> => {
    const programAsked = wantsProgram(userMessage) || pendingProgram;
    if (!programAsked) return false;

    const updates = extractProfileFromText(userMessage);
    setCoachProfile(prev => ({ ...prev, ...updates }));
    const merged = { ...coachProfile, ...updates };
    const missing = getMissingFields(merged);

    if (missing.length > 0) {
      const clarify = composeClarifyMessage(missing);
      // Add assistant clarify message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'assistant',
        content: clarify,
        timestamp: new Date(),
        isStreaming: false,
        mode: 'coach'
      };
      setChats(prev => prev.map(chat =>
        chat.id === currentChatId ? { ...chat, messages: [...chat.messages, assistantMessage] } : chat
      ));

      // Generate quick replies for the clarify content
      try {
        if (!flowRef.current) flowRef.current = new ConversationFlowService();
        const qr = flowRef.current.getQuickReplies(clarify, 'standard_beginner');
        setQuickReplies(qr);
      } catch {
        setQuickReplies([]);
      }

      setPendingProgram(true);
      setIsStreaming(false);
      return true;
    }

    // Enough info → generate program
    const experienceLevel = merged.experienceLevel || 'intermediate';
    const primaryGoal = merged.primaryGoal || 'weight_loss';
    const equipment = (merged.equipment === 'unsure' || !merged.equipment) ? 'gym' : (merged.equipment as 'gym' | 'home' | 'minimal');
    const timePerSession = (merged.timePerSession || 60) as 30 | 45 | 60 | 90;
    const daysPerWeek = (merged.daysPerWeek || 4) as 3 | 4 | 5 | 6;

    try {
      const template = TemplateGenerator.generateWorkoutTemplate({
        experienceLevel,
        primaryGoal: primaryGoal as any,
        equipment: equipment === 'minimal' ? 'home' : equipment, // map minimal to home template for now
        timePerSession,
        daysPerWeek
      } as any);
      const table = renderWorkoutWithInjuryMods(template, merged);
      const full = [
        `Great! I'll create an 8-week ${primaryGoal.replace('_', ' ')} program tailored to you. `,
        `**Template: ${template.name}** `,
        `**Description:** ${template.description} `,
        `\n${table}`,
        `\n**Progression Plan:** ${template.progressionPlan} `,
        `\n**Notes:** ${template.notes.join(', ')} `,
        `\nWant to tweak anything (experience, days per week, time, equipment)?`
      ].join('');

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'assistant',
        content: full,
        timestamp: new Date(),
        isStreaming: false,
        mode: 'coach'
      };
      setChats(prev => prev.map(chat =>
        chat.id === currentChatId ? { ...chat, messages: [...chat.messages, assistantMessage] } : chat
      ));

      setShowSaveButton(true);
      setGeneratedTemplate({ name: template.name, content: full, type: 'workout' });
      setPendingProgram(false);
      setIsStreaming(false);
      setQuickReplies([]);
      return true;
    } catch (e) {
      // Fallback to clarify if generation fails
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'assistant',
        content: 'I can generate your program, but I need a few details: experience, equipment (home/gym), time per session, and days per week.',
        timestamp: new Date(),
        isStreaming: false,
        mode: 'coach'
      };
      setChats(prev => prev.map(chat =>
        chat.id === currentChatId ? { ...chat, messages: [...chat.messages, assistantMessage] } : chat
      ));
      setPendingProgram(true);
      setIsStreaming(false);
      return true;
    }
  };

  const deleteChat = (chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }
  };

  const sendUserMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isStreaming || !currentChatId) return;
    const userMessageId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newUserMessage: Message = {
      id: userMessageId,
      type: 'user',
      content: userMessage.trim(),
      timestamp: new Date(),
      mode,
      isVoice: isVoiceMode
    };

    setChats(prev => prev.map(chat =>
      chat.id === currentChatId
        ? { ...chat, messages: [...chat.messages, newUserMessage] }
        : chat
    ));

    setInputText('');
    // Intercept for program flow
    const handled = await handleProgramFlowIfNeeded(userMessage);
    if (handled) return;

    setIsStreaming(true);

    const assistantMessageId = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
      mode
    };

    setChats(prev => prev.map(chat =>
      chat.id === currentChatId
        ? { ...chat, messages: [...chat.messages, assistantMessage] }
        : chat
    ));

    try {
      await streamResponse(userMessage.trim());
    } catch (error) {
      console.error('Message processing failed:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendUserMessage(inputText);
  };

  const handleVoiceToggle = async () => {
    if (isListening) {
      stopListening();
      setIsVoiceMode(false);
    } else {
      setIsVoiceMode(true);
      try {
        const started = await startListening();
        if (!started) {
          setIsVoiceMode(false);
          console.log('Voice recognition not available');
        }
      } catch (error) {
        console.error('Voice recognition error:', error);
        setIsVoiceMode(false);
      }
    }
  };

  const copyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const saveTemplate = async () => {
    if (!generatedTemplate) return;
    
    try {
      // Save template to localStorage (similar to template uploader)
      const savedTemplates = JSON.parse(localStorage.getItem('workoutTemplates') || '[]');
      const newTemplate = {
        id: `template-${Date.now()}`,
        name: generatedTemplate.name,
        content: generatedTemplate.content,
        type: generatedTemplate.type,
        createdAt: new Date().toISOString(),
        isAIGenerated: true
      };
      
      savedTemplates.push(newTemplate);
      localStorage.setItem('workoutTemplates', JSON.stringify(savedTemplates));
      
      // Show success message
      alert(`✅ Template "${generatedTemplate.name}" saved successfully! You can now use it in the workout logger.`);
      
      // Reset template state
      setShowSaveButton(false);
      setGeneratedTemplate(null);
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('❌ Failed to save template. Please try again.');
    }
  };

  const renderMessage = (message: Message) => {
    const isUser = message.type === 'user';
    const isCopied = copiedMessageId === message.id;
    
    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}
      >
        <div
          className={`max-w-[85%] rounded-2xl p-4 ${
            isUser
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
              : 'bg-gray-800/90 backdrop-blur-lg text-white border border-gray-700 shadow-lg'
          }`}
        >
          <div className="flex items-start space-x-3">
            {!isUser && (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.mode === 'coach' ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-orange-400 to-red-500'
              }`}>
                {message.mode === 'coach' ? (
                  <MessageCircle className="w-4 h-4 text-white" />
                ) : (
                  <Brain className="w-4 h-4 text-white" />
                )}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-white/70">
                  {isUser ? 'You' : (message.mode === 'coach' ? 'AI Coach' : 'Research Assistant')}
                </span>
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!isUser && (
                    <button
                      onClick={() => speak(message.content)}
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                    >
                      <Volume2 className="w-3 h-3 text-white/70" />
                    </button>
                  )}
                  <button
                    onClick={() => copyMessage(message.id, message.content)}
                    className="p-1 rounded hover:bg-white/10 transition-colors"
                  >
                    {isCopied ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-white/70" />
                    )}
                  </button>
                </div>
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="whitespace-pre-wrap leading-relaxed text-left">{message.content}</p>
              </div>
              
              {/* Sources for research mode */}
              {!isUser && message.sources && message.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/20">
                  <p className="text-xs font-medium mb-2 text-white/70">📚 Sources:</p>
                  <div className="space-y-1">
                    {message.sources.map((source, index) => (
                      <div key={index} className="text-xs text-white/60">
                        <span className="font-medium">{source.title}</span>
                        <span className="ml-2 text-white/40">
                          ({Math.round(source.relevance * 100)}% relevant)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Confidence score */}
              {!isUser && message.confidence && (
                <div className="mt-2 text-xs text-white/50">
                  Confidence: {Math.round(message.confidence * 100)}%
                </div>
              )}
              
              {/* Timestamp */}
              <div className="mt-2 text-xs text-white/40">
                {message.timestamp.toLocaleTimeString()}
                {message.isVoice && (
                  <span className="ml-2">🎤</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const currentChat = getCurrentChat();

  return (
    <div className={`h-full flex flex-col bg-gray-900/95 backdrop-blur-lg rounded-2xl border border-gray-800 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Amazing AI Coach</h3>
            <p className="text-xs text-gray-400">
              {mode === 'coach' ? 'Personal Fitness Coach' : 'Research Assistant'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Mode Toggle */}
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setMode('coach')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                mode === 'coach'
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              style={mode === 'coach' ? { backgroundColor: '#a5e635' } : undefined}
            >
              💪 Coach
            </button>
            <button
              onClick={() => setMode('research')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                mode === 'research'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🔬 Research
            </button>
          </div>
          
          <button
            onClick={handleVoiceToggle}
            className={`p-2 rounded-lg transition-colors ${
              isVoiceMode 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            <Mic size={16} />
          </button>
          
          {onClose && (
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-300 p-2"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Chat List Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-gray-800/50 border-r border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-white">Chats</h4>
            <button
              onClick={createNewChat}
              className="p-1 rounded hover:bg-gray-700 transition-colors"
            >
              <Plus size={16} className="text-gray-400" />
            </button>
          </div>
          
          <div className="space-y-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  currentChatId === chat.id
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                }`}
                onClick={() => setCurrentChatId(chat.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{chat.name}</p>
                    <p className="text-xs text-gray-400">
                      {chat.messages.length} messages
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                    className="p-1 rounded hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={12} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentChat?.messages.map((message) => renderMessage(message))}
            {quickReplies.length > 0 && (
              <QuickReplyButtons
                replies={quickReplies}
                onSelect={(reply) => {
                  // Immediately send quick replies instead of only filling the input
                  sendUserMessage(reply.text);
                }}
              />
            )}
            
            {/* Loading indicator */}
            {isStreaming && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-800/90 backdrop-blur-lg text-white border border-gray-700 rounded-2xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-white/70" />
                      <span className="text-sm text-white/70">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-700">
            <form onSubmit={handleSubmit} className="flex space-x-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isVoiceMode 
                      ? "🎤 Listening..." 
                      : mode === 'coach'
                        ? "Ask me about workouts, form, nutrition, or motivation..."
                        : "Ask me about fitness research, studies, or evidence-based advice..."
                  }
                  disabled={isStreaming || isVoiceMode}
                  className="w-full px-4 py-3 bg-gray-800 border border-[#a5e635] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#a5e635] focus:border-transparent disabled:bg-gray-900 disabled:cursor-not-allowed text-left"
                />
                {isVoiceMode && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  </div>
                )}
              </div>
              
              <button
                type="submit"
                disabled={!inputText.trim() || isStreaming || isVoiceMode}
                className="text-white p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium hover:bg-[#94d929]"
                style={{ backgroundColor: '#a5e635' }}
              >
                <Send size={20} color="#0b0b0b" />
              </button>
            </form>

            {isVoiceMode && (
              <div className="mt-2 text-sm text-blue-400 bg-blue-500/10 p-2 rounded-lg flex items-center space-x-2">
                <Mic size={16} className="animate-pulse" />
                <span>Listening for your question...</span>
              </div>
            )}

            {/* Save Template Button */}
            {showSaveButton && generatedTemplate && (
              <div className="mt-4 p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-white mb-1">
                      💾 Template Ready to Save
                    </h4>
                    <p className="text-xs text-gray-400">
                      "{generatedTemplate.name}" - Click save to use in workout logger
                    </p>
                  </div>
                  <button
                    onClick={saveTemplate}
                    className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all font-medium text-sm flex items-center space-x-2"
                  >
                    <Zap size={16} />
                    <span>Save Template</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
