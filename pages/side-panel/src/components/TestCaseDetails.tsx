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
      className={`p-4 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className={`mr-2 text-sm px-2 py-1 rounded ${
              isDarkMode ? 'bg-slate-700 text-sky-400 hover:bg-slate-600' : 'bg-gray-100 text-sky-600 hover:bg-gray-200'
            }`}>
            ← Back
          </button>
          <h3 className={`font-medium text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{testCase.name}</h3>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            testCase.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
          {testCase.status}
        </span>
      </div>

      <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{testCase.description}</p>

      <div className="mb-4">
        <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          Steps ({testCase.steps.length})
        </h4>
        <ol className={`list-decimal list-inside text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} space-y-1`}>
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
          className="px-4 py-2 rounded-md bg-[#19C2FF] text-white hover:bg-[#0073DC] transition-colors">
          Execute Test Case
        </button>
      </div>
    </div>
  );
}
