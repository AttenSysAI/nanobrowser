import { TestCase } from '../types/project';

interface TestCaseDetailsProps {
  testCase: TestCase;
  onExecute: (testCase: TestCase) => void;
  onBack: () => void;
  isDarkMode: boolean;
}

export default function TestCaseDetails({ testCase, onExecute, onBack, isDarkMode }: TestCaseDetailsProps) {
  return (
    <div
      className={`p-4 rounded-lg border ${isDarkMode ? 'bg-[hsl(0,0%,14.9%)] border-[hsl(0,0%,14.9%)]' : 'bg-white border-[hsl(0,0%,89.8%)]'}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className={`mr-2 text-sm px-2 py-1 rounded ${
              isDarkMode
                ? 'text-[hsl(0,0%,98%)] hover:text-[hsl(0,0%,63.9%)]'
                : 'text-[hsl(0,0%,9%)] hover:text-[hsl(0,0%,45.1%)]'
            }`}>
            ← Back
          </button>
          <h3 className={`font-medium text-lg ${isDarkMode ? 'text-[hsl(0,0%,98%)]' : 'text-[hsl(0,0%,3.9%)]'}`}>
            {testCase.name}
          </h3>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            testCase.status === 'active'
              ? isDarkMode
                ? 'bg-[hsl(0,0%,14.9%)] text-[hsl(0,0%,98%)]'
                : 'bg-[hsl(0,0%,96.1%)] text-[hsl(0,0%,9%)]'
              : isDarkMode
                ? 'bg-[hsl(0,0%,14.9%)] text-[hsl(0,0%,63.9%)]'
                : 'bg-[hsl(0,0%,96.1%)] text-[hsl(0,0%,45.1%)]'
          }`}>
          {testCase.status}
        </span>
      </div>

      <p className={`text-sm mb-4 ${isDarkMode ? 'text-[hsl(0,0%,98%)]' : 'text-[hsl(0,0%,9%)]'}`}>
        {testCase.description}
      </p>

      <div className="mb-4">
        <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-[hsl(0,0%,98%)]' : 'text-[hsl(0,0%,9%)]'}`}>
          Steps ({testCase.steps.length})
        </h4>
        <ol
          className={`list-decimal list-inside text-sm ${isDarkMode ? 'text-[hsl(0,0%,98%)]' : 'text-[hsl(0,0%,9%)]'} space-y-1`}>
          {testCase.steps.map((step, index) => (
            <li key={index} className="break-words">
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={() => onExecute(testCase)}
          className={`px-4 py-2 rounded-md ${isDarkMode ? 'bg-[hsl(0,0%,98%)] text-[hsl(0,0%,9%)]' : 'bg-[hsl(0,0%,9%)] text-[hsl(0,0%,98%)]'} hover:opacity-90 transition-colors`}>
          Execute Test Case
        </button>
      </div>
    </div>
  );
}
