interface LoadingSpinnerProps {
  message?: string;
  isDarkMode?: boolean;
}

export default function LoadingSpinner({ message = 'Loading...', isDarkMode = false }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-12 h-12 mb-3">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-sky-500 rounded-full animate-spin"></div>
      </div>
      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{message}</p>
    </div>
  );
}
