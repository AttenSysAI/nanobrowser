import { useState, useEffect } from 'react';
import { Project } from '../types/project';
import { projectService } from '../services/api';
import ErrorMessage from './ErrorMessage';
import LoadingSpinner from './LoadingSpinner';

interface ProjectListProps {
  onProjectSelect: (projectId: string) => void;
  onBackToChat: () => void;
  isDarkMode: boolean;
}

export default function ProjectList({ onProjectSelect, onBackToChat, isDarkMode }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);

  const fetchProjects = async (page: number) => {
    try {
      setIsLoading(true);
      const response = await projectService.getProjects(page, pageSize);
      setProjects(response.data);
      setTotalPages(Math.ceil(response.total / pageSize));
      setCurrentPage(response.page);
      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load projects: ${errorMessage}`);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(currentPage);
  }, [currentPage, pageSize]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Add retry functionality
  const handleRetry = () => {
    fetchProjects(currentPage);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Projects</h2>
        <button
          onClick={onBackToChat}
          className={`px-2 py-1 rounded text-sm ${
            isDarkMode ? 'bg-slate-700 text-sky-400 hover:bg-slate-600' : 'bg-gray-100 text-sky-600 hover:bg-gray-200'
          }`}>
          Back to Chat
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center flex-grow">
          <LoadingSpinner message="Loading projects..." isDarkMode={isDarkMode} />
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center flex-grow">
          <ErrorMessage message={error} onRetry={handleRetry} isDarkMode={isDarkMode} />
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="overflow-y-auto flex-grow">
            {projects.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No projects found</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {projects.map(project => (
                  <li
                    key={project.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      isDarkMode ? 'hover:bg-slate-800 border-slate-700' : 'hover:bg-gray-50 border-gray-200'
                    }`}
                    onClick={() => onProjectSelect(project.id)}>
                    <div className="flex flex-col gap-1">
                      <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{project.name}</h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {project.description}
                      </p>
                      <div className="mt-1 text-xs text-gray-500">
                        Updated: {new Date(project.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pagination controls */}
          {projects.length > 0 && (
            <div
              className={`flex justify-between items-center p-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className={`px-3 py-1 rounded text-sm ${
                  isDarkMode
                    ? currentPage <= 1
                      ? 'bg-slate-800 text-gray-500 cursor-not-allowed'
                      : 'bg-slate-700 text-sky-400 hover:bg-slate-600'
                    : currentPage <= 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-sky-600 hover:bg-gray-200'
                }`}>
                ← Previous
              </button>
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className={`px-3 py-1 rounded text-sm ${
                  isDarkMode
                    ? currentPage >= totalPages
                      ? 'bg-slate-800 text-gray-500 cursor-not-allowed'
                      : 'bg-slate-700 text-sky-400 hover:bg-slate-600'
                    : currentPage >= totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-sky-600 hover:bg-gray-200'
                }`}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
