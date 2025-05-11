import { FiAlertCircle } from 'react-icons/fi';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  isDarkMode?: boolean;
}

export default function ErrorMessage({ message, onRetry, isDarkMode = false }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4 text-center">
      <FiAlertCircle className="text-red-500 mb-2" size={28} />
      <p className={`text-red-500 mb-3 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className={`px-3 py-1 rounded text-sm ${
            isDarkMode ? 'bg-slate-700 text-sky-400 hover:bg-slate-600' : 'bg-gray-100 text-sky-600 hover:bg-gray-200'
          }`}>
          Try Again
        </button>
      )}
    </div>
  );
}
