import { useState, useRef, useEffect, useCallback } from 'react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onStopTask: () => void;
  disabled: boolean;
  showStopButton: boolean;
  setContent?: (setter: (text: string) => void) => void;
  isDarkMode?: boolean;
}

export default function ChatInput({
  onSendMessage,
  onStopTask,
  disabled,
  showStopButton,
  setContent,
  isDarkMode = false,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle text changes and resize textarea
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);

    // Resize textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
    }
  };

  // Expose a method to set content from outside
  useEffect(() => {
    if (setContent) {
      setContent(setText);
    }
  }, [setContent]);

  // Initial resize when component mounts
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
    }
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (text.trim()) {
        onSendMessage(text);
        setText('');
      }
    },
    [text, onSendMessage],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={`overflow-hidden rounded-lg border transition-colors focus-within:border-[hsl(224.3,76.3%,48%)] hover:border-[hsl(224.3,76.3%,48%)] ${isDarkMode ? 'border-[hsl(0,0%,14.9%)]' : 'border-[hsl(0,0%,89.8%)]'}`}
      aria-label="Chat input form">
      <div className="flex flex-col">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={4}
          className={`w-full resize-none border-none p-3 focus:outline-none ${
            disabled
              ? isDarkMode
                ? 'bg-[hsl(0,0%,14.9%)] text-[hsl(0,0%,63.9%)]'
                : 'bg-[hsl(0,0%,96.1%)] text-[hsl(0,0%,45.1%)]'
              : isDarkMode
                ? 'bg-[hsl(0,0%,14.9%)] text-[hsl(0,0%,98%)]'
                : 'bg-white text-[hsl(0,0%,3.9%)]'
          }`}
          placeholder="What can I help with?"
          aria-label="Message input"
        />

        <div
          className={`flex items-center justify-between px-3 py-1.5 ${
            disabled
              ? isDarkMode
                ? 'bg-[hsl(0,0%,14.9%)]'
                : 'bg-[hsl(0,0%,96.1%)]'
              : isDarkMode
                ? 'bg-[hsl(0,0%,14.9%)]'
                : 'bg-white'
          }`}>
          <div className="flex gap-2 text-gray-500">{/* Icons can go here */}</div>

          {showStopButton ? (
            <button
              type="button"
              onClick={onStopTask}
              className={`rounded-md ${isDarkMode ? 'bg-[hsl(0,62.8%,30.6%)]' : 'bg-[hsl(0,84.2%,60.2%)]'} px-3 py-1 text-white transition-colors hover:opacity-90`}>
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={disabled}
              className={`rounded-md ${isDarkMode ? 'bg-[hsl(0,0%,98%)] text-[hsl(0,0%,9%)]' : 'bg-[hsl(0,0%,9%)] text-[hsl(0,0%,98%)]'} px-3 py-1 transition-colors hover:opacity-90 ${disabled ? 'opacity-50' : ''}`}>
              Send
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
