import { useState, useEffect } from 'react';
import { TestCase } from '../types/project';
import { projectService, testCaseService } from '../services/api';
import ErrorMessage from './ErrorMessage';
import LoadingSpinner from './LoadingSpinner';
import TestCaseForm from './TestCaseForm';
import AlertDialog from './AlertDialog';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

interface TestCaseListProps {
  projectId: string;
  onTestCaseSelect: (testCase: TestCase) => void;
  onBackToProjects: () => void;
  isDarkMode: boolean;
}

type ViewMode = 'list' | 'create' | 'edit';

export default function TestCaseList({ projectId, onTestCaseSelect, onBackToProjects, isDarkMode }: TestCaseListProps) {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testCaseToDelete, setTestCaseToDelete] = useState<TestCase | null>(null);

  // Fetch test cases for the current project
  const fetchTestCases = async (page: number) => {
    try {
      setIsLoading(true);
      setError(null);

      // Get project details for the name
      const project = await projectService.getProjectById(projectId);
      setProjectName(project.name);

      // Get test cases with pagination
      const response = await testCaseService.getTestCases(page, pageSize, projectId);
      setTestCases(response.data);
      setTotalPages(Math.ceil(response.total / pageSize));
      setCurrentPage(response.page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load test cases: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'list') {
      fetchTestCases(currentPage);
    }
  }, [projectId, currentPage, pageSize, viewMode]);

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

  const handleRetry = () => {
    fetchTestCases(currentPage);
  };

  const handleCreateClick = () => {
    setSelectedTestCase(null);
    setViewMode('create');
  };

  const handleEditClick = (testCase: TestCase, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the test case selection
    setSelectedTestCase(testCase);
    setViewMode('edit');
  };

  const handleDeleteClick = (testCase: TestCase, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the test case selection
    setTestCaseToDelete(testCase);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!testCaseToDelete) return;

    try {
      await testCaseService.deleteTestCase(testCaseToDelete.id);
      // Refresh the list
      fetchTestCases(currentPage);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setDeleteError(`Failed to delete test case: ${errorMessage}`);
      // Clear error after 5 seconds
      setTimeout(() => setDeleteError(null), 5000);
    } finally {
      setDeleteDialogOpen(false);
      setTestCaseToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setTestCaseToDelete(null);
  };

  const handleSaveTestCase = (savedTestCase: TestCase) => {
    // Refresh the list and return to list view
    fetchTestCases(currentPage);
    setViewMode('list');
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedTestCase(null);
  };

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <div className="flex flex-col">
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {viewMode === 'create' ? 'Create Test Case' : 'Edit Test Case'}
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{projectName}</p>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto">
          <TestCaseForm
            projectId={projectId}
            testCase={selectedTestCase || undefined}
            onSave={handleSaveTestCase}
            onCancel={handleCancel}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <div className="flex flex-col">
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Test Cases</h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{projectName}</p>
        </div>
        <button
          onClick={handleCreateClick}
          className={`flex items-center px-4 py-2 rounded-md ${
            isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}>
          <FaPlus className="mr-2" /> Create Test Case
        </button>
      </div>

      <AlertDialog
        isOpen={deleteDialogOpen}
        title="Delete Test Case"
        message={`Are you sure you want to delete "${testCaseToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDarkMode={isDarkMode}
      />

      {deleteError && (
        <div className="p-4">
          <ErrorMessage message={deleteError} onRetry={() => setDeleteError(null)} isDarkMode={isDarkMode} />
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center flex-grow">
          <LoadingSpinner message="Loading test cases..." isDarkMode={isDarkMode} />
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
            {testCases.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No test cases found for this project
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {testCases.map(testCase => (
                  <li
                    key={testCase.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      isDarkMode ? 'hover:bg-slate-800 border-slate-700' : 'hover:bg-gray-50 border-gray-200'
                    }`}
                    onClick={() => onTestCaseSelect(testCase)}>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-start">
                        <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {testCase.name}
                        </h3>
                        <div className="flex gap-2">
                          <button
                            onClick={e => handleEditClick(testCase, e)}
                            className={`p-1 rounded-md ${
                              isDarkMode
                                ? 'text-gray-400 hover:text-white hover:bg-slate-700'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                            title="Edit test case">
                            <FaEdit size={16} />
                          </button>
                          <button
                            onClick={e => handleDeleteClick(testCase, e)}
                            className={`p-1 rounded-md ${
                              isDarkMode
                                ? 'text-red-400 hover:text-red-300 hover:bg-slate-700'
                                : 'text-red-500 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title="Delete test case">
                            <FaTrash size={16} />
                          </button>
                        </div>
                      </div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {testCase.description}
                      </p>
                      <div className="mt-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            testCase.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                          {testCase.status}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">{testCase.steps.length} steps</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pagination controls */}
          {testCases.length > 0 && (
            <div
              className={`flex justify-between items-center p-4 border-t ${
                isDarkMode ? 'border-[hsl(0,0%,14.9%)]' : 'border-[hsl(0,0%,89.8%)]'
              }`}>
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className={`px-3 py-1 rounded text-sm ${
                  isDarkMode
                    ? currentPage <= 1
                      ? 'bg-[hsl(0,0%,14.9%)] text-[hsl(0,0%,63.9%)] cursor-not-allowed'
                      : 'bg-[hsl(0,0%,14.9%)] text-[hsl(0,0%,98%)] hover:bg-[hsl(0,0%,20%)]'
                    : currentPage <= 1
                      ? 'bg-[hsl(0,0%,96.1%)] text-[hsl(0,0%,45.1%)] cursor-not-allowed'
                      : 'bg-[hsl(0,0%,96.1%)] text-[hsl(0,0%,9%)] hover:bg-[hsl(0,0%,90%)]'
                }`}>
                ← Previous
              </button>
              <span className={`text-sm ${isDarkMode ? 'text-[hsl(0,0%,98%)]' : 'text-[hsl(0,0%,9%)]'}`}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className={`px-3 py-1 rounded text-sm ${
                  isDarkMode
                    ? currentPage >= totalPages
                      ? 'bg-[hsl(0,0%,14.9%)] text-[hsl(0,0%,63.9%)] cursor-not-allowed'
                      : 'bg-[hsl(0,0%,14.9%)] text-[hsl(0,0%,98%)] hover:bg-[hsl(0,0%,20%)]'
                    : currentPage >= totalPages
                      ? 'bg-[hsl(0,0%,96.1%)] text-[hsl(0,0%,45.1%)] cursor-not-allowed'
                      : 'bg-[hsl(0,0%,96.1%)] text-[hsl(0,0%,9%)] hover:bg-[hsl(0,0%,90%)]'
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
