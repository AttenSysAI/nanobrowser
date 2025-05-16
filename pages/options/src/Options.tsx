import { useState, useEffect } from 'react';
import '@src/Options.css';
import { Button } from '@extension/ui';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { GeneralSettings } from './components/GeneralSettings';
import { ModelSettings } from './components/ModelSettings';

const Options = () => {
  const [activeTab, setActiveTab] = useState('models');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for dark mode preference
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    darkModeMediaQuery.addEventListener('change', handleChange);
    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings isDarkMode={isDarkMode} />;
      case 'models':
        return <ModelSettings isDarkMode={isDarkMode} />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex min-h-screen min-w-[768px] ${isDarkMode ? 'bg-[hsl(0,0%,3.9%)]' : 'bg-white'} ${isDarkMode ? 'text-[hsl(0,0%,98%)]' : 'text-[hsl(0,0%,3.9%)]'}`}>
      {/* Vertical Navigation Bar */}
      <nav
        className={`w-48 border-r ${isDarkMode ? 'border-[hsl(0,0%,14.9%)] bg-[hsl(0,0%,14.9%)]' : 'border-[hsl(0,0%,89.8%)] bg-[hsl(0,0%,96.1%)]'}`}>
        <div className="p-4">
          <h1 className={`mb-6 text-xl font-bold ${isDarkMode ? 'text-[hsl(0,0%,98%)]' : 'text-[hsl(0,0%,3.9%)]'}`}>
            Settings
          </h1>
          <ul className="space-y-2">
            {[
              { id: 'general', icon: '⚙️', label: 'General' },
              { id: 'models', icon: '📊', label: 'Models' },
            ].map(item => (
              <li key={item.id}>
                <Button
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center space-x-2 rounded-lg px-4 py-2 text-left 
                    ${
                      activeTab !== item.id
                        ? `${isDarkMode ? 'bg-[hsl(0,0%,14.9%)] text-[hsl(0,0%,63.9%)] hover:text-[hsl(0,0%,98%)]' : 'bg-[hsl(0,0%,96.1%)] font-medium text-[hsl(0,0%,45.1%)] hover:text-[hsl(0,0%,9%)]'}`
                        : `${isDarkMode ? 'bg-[hsl(0,0%,20%)]' : 'bg-[hsl(0,0%,90%)]'} ${isDarkMode ? 'text-[hsl(0,0%,98%)]' : 'text-[hsl(0,0%,9%)]'}`
                    }`}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className={`flex-1 ${isDarkMode ? 'bg-[hsl(0,0%,3.9%)]' : 'bg-white'} p-8`}>
        <div className="mx-auto min-w-[512px] max-w-screen-lg">{renderTabContent()}</div>
      </main>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Options, <div>Loading...</div>), <div>Error Occurred</div>);
