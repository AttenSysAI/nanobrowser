import type { Message } from '@extension/storage';
import { ACTOR_PROFILES } from '../types/message';
import { memo, RefObject } from 'react';

interface MessageListProps {
  messages: Message[];
  messagesEndRef?: RefObject<HTMLDivElement>;
  isDarkMode?: boolean;
}

export default memo(function MessageList({ messages, messagesEndRef, isDarkMode = false }: MessageListProps) {
  return (
    <div className="max-w-full space-y-4 overflow-y-auto flex-1">
      {messages.map((message, index) => (
        <MessageBlock
          key={`${message.actor}-${message.timestamp}-${index}`}
          message={message}
          isSameActor={index > 0 ? messages[index - 1].actor === message.actor : false}
          isDarkMode={isDarkMode}
        />
      ))}
      {messagesEndRef && <div ref={messagesEndRef} />}
    </div>
  );
});

interface MessageBlockProps {
  message: Message;
  isSameActor: boolean;
  isDarkMode?: boolean;
}

function MessageBlock({ message, isSameActor, isDarkMode = false }: MessageBlockProps) {
  if (!message.actor) {
    console.error('No actor found');
    return <div />;
  }
  const actor = ACTOR_PROFILES[message.actor as keyof typeof ACTOR_PROFILES];
  const isProgress = message.content === 'Showing progress...';

  return (
    <div
      className={`flex max-w-full gap-3 px-4 ${
        !isSameActor
          ? `mt-4 border-t ${isDarkMode ? 'border-[hsl(0,0%,14.9%)]/50' : 'border-[hsl(0,0%,89.8%)]/50'} pt-4 first:mt-0 first:border-t-0 first:pt-0`
          : ''
      }`}>
      {!isSameActor && (
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: actor.iconBackground }}>
          <img src={actor.icon} alt={actor.name} className="size-6" />
        </div>
      )}
      {isSameActor && <div className="w-8" />}

      <div className="min-w-0 flex-1">
        {!isSameActor && (
          <div
            className={`mb-1 text-sm font-semibold ${isDarkMode ? 'text-[hsl(0,0%,98%)]' : 'text-[hsl(0,0%,3.9%)]'}`}>
            {actor.name}
          </div>
        )}

        <div className="space-y-0.5">
          <div
            className={`whitespace-pre-wrap break-words text-sm ${isDarkMode ? 'text-[hsl(0,0%,98%)]' : 'text-[hsl(0,0%,9%)]'}`}>
            {isProgress ? (
              <div
                className={`h-1 overflow-hidden rounded ${isDarkMode ? 'bg-[hsl(0,0%,14.9%)]' : 'bg-[hsl(0,0%,96.1%)]'}`}>
                <div className="animate-progress h-full bg-[hsl(224.3,76.3%,48%)]" />
              </div>
            ) : (
              message.content
            )}
          </div>
          {!isProgress && (
            <div className={`text-right text-xs ${isDarkMode ? 'text-[hsl(0,0%,63.9%)]' : 'text-[hsl(0,0%,45.1%)]'}`}>
              {formatTimestamp(message.timestamp)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Formats a timestamp (in milliseconds) to a readable time string
 * @param timestamp Unix timestamp in milliseconds
 * @returns Formatted time string
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();

  // Check if the message is from today
  const isToday = date.toDateString() === now.toDateString();

  // Check if the message is from yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  // Check if the message is from this year
  const isThisYear = date.getFullYear() === now.getFullYear();

  // Format the time (HH:MM)
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return timeStr; // Just show the time for today's messages
  }

  if (isYesterday) {
    return `Yesterday, ${timeStr}`;
  }

  if (isThisYear) {
    // Show month and day for this year
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
  }

  // Show full date for older messages
  return `${date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}, ${timeStr}`;
}
