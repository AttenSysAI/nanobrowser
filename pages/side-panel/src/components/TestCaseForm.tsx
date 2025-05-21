import { useState, useEffect } from 'react';
import { TestCase } from '../types/project';
import { testCaseService } from '../services/api';
import ErrorMessage from './ErrorMessage';
import LoadingSpinner from './LoadingSpinner';

interface TestCaseFormProps {
  projectId: string;
  testCase?: TestCase; // If provided, we're editing an existing test case
  onSave: (testCase: TestCase) => void;
  onCancel: () => void;
  isDarkMode: boolean;
}

export default function TestCaseForm({ projectId, testCase, onSave, onCancel, isDarkMode }: TestCaseFormProps) {
  const [name, setName] = useState(testCase?.name || '');
  const [description, setDescription] = useState(testCase?.description || '');
  const [steps, setSteps] = useState<string[]>(testCase?.steps || ['']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when testCase prop changes
  useEffect(() => {
    if (testCase) {
      setName(testCase.name);
      setDescription(testCase.description);
      setSteps(testCase.steps);
    } else {
      setName('');
      setDescription('');
      setSteps(['']);
    }
  }, [testCase]);

  const handleAddStep = () => {
    setSteps([...steps, '']);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate form
      if (!name.trim()) {
        throw new Error('Test case name is required');
      }
      if (steps.some(step => !step.trim())) {
        throw new Error('All steps must be filled out');
      }

      const testCaseData = {
        name: name.trim(),
        description: description.trim() || '',
        steps: steps.map(step => step.trim()),
        project_id: projectId,
      };

      let savedTestCase: TestCase;
      if (testCase) {
        savedTestCase = await testCaseService.updateTestCase(testCase.id, testCaseData);
      } else {
        savedTestCase = await testCaseService.createTestCase(testCaseData);
      }

      onSave(savedTestCase);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to save test case: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] flex items-center justify-center z-10">
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[hsl(0,0%,14.9%)]' : 'bg-white'} shadow-lg`}>
            <LoadingSpinner message="Saving..." isDarkMode={isDarkMode} />
          </div>
        </div>
      )}

      <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        {testCase ? 'Edit Test Case' : 'Create New Test Case'}
      </h2>

      {error && <ErrorMessage message={error} onRetry={() => setError(null)} isDarkMode={isDarkMode} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Name *
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
            className={`w-full px-3 py-2 rounded-md border ${
              isDarkMode
                ? 'bg-[hsl(0,0%,14.9%)] border-[hsl(0,0%,20%)] text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Enter test case name"
            disabled={isLoading}
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 rounded-md border ${
              isDarkMode
                ? 'bg-[hsl(0,0%,14.9%)] border-[hsl(0,0%,20%)] text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Enter test case description (optional)"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Steps *
          </label>
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={step}
                  onChange={e => handleStepChange(index, e.target.value)}
                  className={`flex-1 px-3 py-2 rounded-md border ${
                    isDarkMode
                      ? 'bg-[hsl(0,0%,14.9%)] border-[hsl(0,0%,20%)] text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder={`Step ${index + 1}`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveStep(index)}
                  disabled={steps.length <= 1 || isLoading}
                  className={`px-3 py-2 rounded-md ${
                    isDarkMode
                      ? 'bg-red-900 text-white hover:bg-red-800 disabled:bg-red-900/50'
                      : 'bg-red-100 text-red-800 hover:bg-red-200 disabled:bg-red-100/50'
                  } disabled:cursor-not-allowed`}>
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddStep}
              disabled={isLoading}
              className={`mt-2 px-4 py-2 rounded-md ${
                isDarkMode
                  ? 'bg-[hsl(0,0%,20%)] text-white hover:bg-[hsl(0,0%,25%)]'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}>
              Add Step
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className={`h-[40px] px-4 py-2 rounded-md min-w-[100px] inline-flex items-center justify-center ${
              isDarkMode
                ? 'bg-[hsl(0,0%,20%)] text-white hover:bg-[hsl(0,0%,25%)]'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`h-[40px] px-4 py-2 rounded-md min-w-[140px] inline-flex items-center justify-center ${
              isDarkMode
                ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-600/50'
                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-600/50'
            } disabled:cursor-not-allowed`}>
            {testCase ? 'Update Test Case' : 'Create Test Case'}
          </button>
        </div>
      </form>
    </div>
  );
}
