import React from 'react';
import { QuickReply } from '../types/conversationTypes';
import { ExperienceIcons, GoalIcons, MiscIcons } from './icons/ConversationIcons';

interface QuickReplyButtonsProps {
  replies: QuickReply[];
  onSelect: (reply: QuickReply) => void;
  maxVisible?: number;
  brandColor?: string;
}

export const QuickReplyButtons: React.FC<QuickReplyButtonsProps> = ({
  replies,
  onSelect,
  maxVisible = 4,
  brandColor = '#a5e635'
}) => {
  const getIcon = (iconName: string) => {
    const iconMap: Record<string, React.FC<{ size?: number; color?: string; className?: string }>> = {
      ...ExperienceIcons,
      ...GoalIcons,
      ...MiscIcons
    };
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent color={brandColor} size={20} /> : null;
  };

  if (!replies || replies.length === 0) return null;

  return (
    <div className="mt-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {replies.slice(0, maxVisible).map((reply) => (
          <button
            key={reply.id}
            className="flex flex-col items-center justify-center px-3 py-2 bg-gray-800/60 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
            onClick={() => onSelect(reply)}
          >
            <div className="mb-1">
              {getIcon(reply.icon)}
            </div>
            <span className="text-xs text-gray-200 text-center">{reply.text}</span>
          </button>
        ))}
      </div>
      {replies.length > maxVisible && (
        <button className="mt-2 text-xs text-lime-300 hover:text-lime-200">Show {replies.length - maxVisible} more options</button>
      )}
    </div>
  );
};

export default QuickReplyButtons;




