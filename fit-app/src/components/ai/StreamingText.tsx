import React, { useEffect, useState, useRef } from 'react';

interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
  onComplete?: () => void;
  speed?: number; // Words per minute
}

export const StreamingText: React.FC<StreamingTextProps> = ({
  text,
  isStreaming,
  onComplete,
  speed = 180
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cursorIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTextRef = useRef('');

  useEffect(() => {
    // Start cursor blinking
    cursorIntervalRef.current = setInterval(() => {
      setCursorVisible(v => !v);
    }, 500);

    return () => {
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (text !== lastTextRef.current) {
      setDisplayedText(text);
      lastTextRef.current = text;
      
      if (!isStreaming && onComplete) {
        onComplete();
      }
    }
  }, [text, isStreaming, onComplete]);

  // Format text with markdown-like styling
  const formatText = (content: string) => {
    // Split by code blocks first
    const parts = content.split(/```([\s\S]*?)```/);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // Code block
        return (
          <pre key={index} className="my-2 p-3 bg-gray-800 rounded-lg overflow-x-auto">
            <code className="text-sm text-gray-200">{part.trim()}</code>
          </pre>
        );
      }

      // Regular text - process inline formatting
      let processed = part;
      
      // Bold
      processed = processed.split(/\*\*(.*?)\*\*/g).map((text, i) => 
        i % 2 === 1 ? <strong key={`bold-${i}`}>{text}</strong> : text
      );
      
      // Lists
      const lines = part.split('\n');
      const formattedLines: React.ReactNode[] = [];
      let inList = false;
      let listItems: string[] = [];

      lines.forEach((line, lineIndex) => {
        const bulletMatch = line.match(/^[-*•]\s+(.+)/);
        const numberedMatch = line.match(/^\d+\.\s+(.+)/);
        
        if (bulletMatch || numberedMatch) {
          if (!inList) {
            inList = true;
            listItems = [];
          }
          listItems.push(bulletMatch ? bulletMatch[1] : numberedMatch![1]);
        } else {
          if (inList) {
            formattedLines.push(
              <ul key={`list-${lineIndex}`} className="list-disc list-inside my-2 space-y-1">
                {listItems.map((item, i) => (
                  <li key={i} className="ml-4">{item}</li>
                ))}
              </ul>
            );
            inList = false;
            listItems = [];
          }
          
          if (line.trim()) {
            formattedLines.push(
              <p key={`line-${lineIndex}`} className="mb-2">{line}</p>
            );
          }
        }
      });

      // Handle any remaining list items
      if (inList && listItems.length > 0) {
        formattedLines.push(
          <ul key="final-list" className="list-disc list-inside my-2 space-y-1">
            {listItems.map((item, i) => (
              <li key={i} className="ml-4">{item}</li>
            ))}
          </ul>
        );
      }

      return <div key={index}>{formattedLines}</div>;
    });
  };

  return (
    <div className="relative">
      <div className="text-gray-800 dark:text-gray-200 leading-relaxed">
        {formatText(displayedText)}
        {isStreaming && (
          <span
            className={`inline-block w-0.5 h-5 bg-blue-500 ml-0.5 ${
              cursorVisible ? 'opacity-100' : 'opacity-0'
            } transition-opacity duration-100`}
            style={{ verticalAlign: 'text-bottom' }}
          />
        )}
      </div>
    </div>
  );
};

export default StreamingText;