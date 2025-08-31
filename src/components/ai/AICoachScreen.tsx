import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ChatInterface } from './ChatInterface';
import { useChatHistory } from '../../hooks/useChatHistory';
import { getAIService } from '../../services/aiService';
import { VoiceInterface } from '../voice/VoiceInterface';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { WorkoutContext } from '../../types';

export default function AICoachScreen({ workoutContext }: { workoutContext: WorkoutContext }) {
  const history = useChatHistory();
  const aiService = useMemo(() => getAIService(), []);
  const voice = useVoiceRecognition(workoutContext);

  const aiCoach = {
    isLoading: false,
    lastConfidence: 0,
    askCoach: async (message: string, context: WorkoutContext, requestType: any) => {
      const res = await aiService.getCoachingResponse(message, context, requestType);
      history.appendMessage(history.activeId || history.createConversation(), { content: message, isUser: true });
      history.appendMessage(history.activeId || '', { content: res.content, isUser: false });
      return res;
    }
  };

  const onSpeak = useCallback(async (text: string) => {
    try { await voice.speak(text); return true; } catch { return false; }
  }, [voice]);

  return (
    <div
      className="min-h-screen grid grid-cols-12 bg-gradient-to-b from-gray-900 via-gray-900/95 to-gray-950 px-3 md:px-6 pt-4 pb-[calc(env(safe-area-inset-bottom,0)+56px)] md:pb-6"
    >
      {/* Sidebar */}
      <aside className="hidden md:flex col-span-3 flex-col border-r border-white/10">
        <div className="p-4 flex items-center justify-between sticky top-0 bg-gradient-to-b from-gray-900 to-gray-900/90 z-10">
          <h2 className="text-white font-semibold">Conversations</h2>
          <button onClick={() => history.createConversation()} className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 text-white">New</button>
        </div>
        <div className="overflow-y-auto p-2 space-y-2">
          {history.conversations.map(c => (
            <button key={c.id} onClick={() => history.setActiveId(c.id)} className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${history.activeId === c.id ? 'bg-white/15 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}>
              <div className="text-sm truncate">{c.title}</div>
              <div className="text-[10px] text-gray-400">{new Date(c.updatedAt).toLocaleString()}</div>
            </button>
          ))}
        </div>
      </aside>
      {/* Main */}
      <main className="col-span-12 md:col-span-9">
        <div className="h-full">
          <div className="mx-auto h-full max-w-5xl">
            <div className="mt-0">
              <ChatInterface aiCoach={aiCoach} workoutContext={workoutContext} voiceEnabled={true} onSpeak={onSpeak} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


