import React from 'react';
import '../styles/quickReplies.css';
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
    <div className="quick-replies-container">
      <div className="quick-replies-grid">
        {replies.slice(0, maxVisible).map((reply) => (
          <button
            key={reply.id}
            className="quick-reply-button"
            onClick={() => onSelect(reply)}
            style={{ ['--brand-primary' as any]: brandColor } as React.CSSProperties}
          >
            <div className="reply-icon">
              {getIcon(reply.icon)}
            </div>
            <span className="reply-text">{reply.text}</span>
          </button>
        ))}
      </div>

      {replies.length > maxVisible && (
        <button className="show-more-button">
          Show {replies.length - maxVisible} more options
        </button>
      )}
    </div>
  );
};




