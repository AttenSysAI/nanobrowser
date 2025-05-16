/* eslint-disable react/prop-types */
import { FaTrash } from 'react-icons/fa';

interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
}

interface ChatHistoryListProps {
  sessions: ChatSession[];
  onSessionSelect: (sessionId: string) => void;
  onSessionDelete: (sessionId: string) => void;
  visible: boolean;
  isDarkMode?: boolean;
}

const ChatHistoryList: React.FC<ChatHistoryListProps> = ({
  sessions,
  onSessionSelect,
  onSessionDelete,
  visible,
  isDarkMode = false,
}) => {
  if (!visible) return null;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <h2 className={`mb-4 text-lg font-semibold ${isDarkMode ? 'text-[hsl(0,0%,98%)]' : 'text-[hsl(0,0%,3.9%)]'}`}>
        Chat History
      </h2>
      {sessions.length === 0 ? (
        <div
          className={`rounded-lg ${isDarkMode ? 'bg-[hsl(0,0%,14.9%)] text-[hsl(0,0%,63.9%)]' : 'bg-[hsl(0,0%,96.1%)] text-[hsl(0,0%,45.1%)]'} p-4 text-center`}>
          No chat history available
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map(session => (
            <div
              key={session.id}
              className={`group relative rounded-lg ${
                isDarkMode
                  ? 'bg-[hsl(0,0%,14.9%)] hover:bg-[hsl(0,0%,20%)]'
                  : 'bg-[hsl(0,0%,96.1%)] hover:bg-[hsl(0,0%,90%)]'
              } p-3 transition-all`}>
              <button onClick={() => onSessionSelect(session.id)} className="w-full text-left" type="button">
                <h3 className={`text-sm font-medium ${isDarkMode ? 'text-[hsl(0,0%,98%)]' : 'text-[hsl(0,0%,3.9%)]'}`}>
                  {session.title}
                </h3>
                <p className={`mt-1 text-xs ${isDarkMode ? 'text-[hsl(0,0%,63.9%)]' : 'text-[hsl(0,0%,45.1%)]'}`}>
                  {formatDate(session.createdAt)}
                </p>
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onSessionDelete(session.id);
                }}
                className={`absolute right-2 top-2 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 ${
                  isDarkMode
                    ? 'bg-[hsl(0,0%,14.9%)] text-[hsl(0,62.8%,30.6%)] hover:bg-[hsl(0,0%,20%)]'
                    : 'bg-white text-[hsl(0,84.2%,60.2%)] hover:bg-[hsl(0,0%,96.1%)]'
                }`}
                aria-label="Delete session"
                type="button">
                <FaTrash size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatHistoryList;
