/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from 'react';
import { RxDiscordLogo } from 'react-icons/rx';
import { FiSettings } from 'react-icons/fi';
import { PiPlusBold } from 'react-icons/pi';
import { GrHistory } from 'react-icons/gr';
import { VscProject } from 'react-icons/vsc';
import { type Message, Actors, chatHistoryStore } from '@extension/storage';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import ChatHistoryList from './components/ChatHistoryList';
import TemplateList from './components/TemplateList';
import ProjectList from './components/ProjectList';
import TestCaseList from './components/TestCaseList';
import { EventType, type AgentEvent, ExecutionState } from './types/event';
import { defaultTemplates } from './templates';
import { TestCase } from './types/project';
import TestCaseDetails from './components/TestCaseDetails';
import './SidePanel.css';

const SidePanel = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputEnabled, setInputEnabled] = useState(true);
  const [showStopButton, setShowStopButton] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showTestCases, setShowTestCases] = useState(false);
  const [chatSessions, setChatSessions] = useState<Array<{ id: string; title: string; createdAt: number }>>([]);
  const [isFollowUpMode, setIsFollowUpMode] = useState(false);
  const [isHistoricalSession, setIsHistoricalSession] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentTestCase, setCurrentTestCase] = useState<TestCase | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const portRef = useRef<chrome.runtime.Port | null>(null);
  const heartbeatIntervalRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const setInputTextRef = useRef<((text: string) => void) | null>(null);

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

  useEffect(() => {
    sessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  const appendMessage = useCallback((newMessage: Message, sessionId?: string | null) => {
    // Don't save progress messages
    const isProgressMessage = newMessage.content === 'Showing progress...';

    setMessages(prev => {
      const filteredMessages = prev.filter(
        (msg, idx) => !(msg.content === 'Showing progress...' && idx === prev.length - 1),
      );
      return [...filteredMessages, newMessage];
    });

    // Use provided sessionId if available, otherwise fall back to sessionIdRef.current
    const effectiveSessionId = sessionId !== undefined ? sessionId : sessionIdRef.current;

    console.log('sessionId', effectiveSessionId);

    // Save message to storage if we have a session and it's not a progress message
    if (effectiveSessionId && !isProgressMessage) {
      chatHistoryStore
        .addMessage(effectiveSessionId, newMessage)
        .catch(err => console.error('Failed to save message to history:', err));
    }
  }, []);

  const handleTaskState = useCallback(
    (event: AgentEvent) => {
      const { actor, state, timestamp, data } = event;
      const content = data?.details;
      let skip = true;
      let displayProgress = false;

      switch (actor) {
        case Actors.SYSTEM:
          switch (state) {
            case ExecutionState.TASK_START:
              // Reset historical session flag when a new task starts
              setIsHistoricalSession(false);
              break;
            case ExecutionState.TASK_OK:
              setIsFollowUpMode(true);
              setInputEnabled(true);
              setShowStopButton(false);
              break;
            case ExecutionState.TASK_FAIL:
              setIsFollowUpMode(true);
              setInputEnabled(true);
              setShowStopButton(false);
              skip = false;
              break;
            case ExecutionState.TASK_CANCEL:
              setIsFollowUpMode(false);
              setInputEnabled(true);
              setShowStopButton(false);
              skip = false;
              break;
            case ExecutionState.TASK_PAUSE:
              break;
            case ExecutionState.TASK_RESUME:
              break;
            default:
              console.error('Invalid task state', state);
              return;
          }
          break;
        case Actors.USER:
          break;
        case Actors.PLANNER:
          switch (state) {
            case ExecutionState.STEP_START:
              displayProgress = true;
              break;
            case ExecutionState.STEP_OK:
              skip = false;
              break;
            case ExecutionState.STEP_FAIL:
              skip = false;
              break;
            case ExecutionState.STEP_CANCEL:
              break;
            default:
              console.error('Invalid step state', state);
              return;
          }
          break;
        case Actors.NAVIGATOR:
          switch (state) {
            case ExecutionState.STEP_START:
              displayProgress = true;
              break;
            case ExecutionState.STEP_OK:
              displayProgress = false;
              break;
            case ExecutionState.STEP_FAIL:
              skip = false;
              displayProgress = false;
              break;
            case ExecutionState.STEP_CANCEL:
              displayProgress = false;
              break;
            case ExecutionState.ACT_START:
              if (content !== 'cache_content') {
                // skip to display caching content
                skip = false;
              }
              break;
            case ExecutionState.ACT_OK:
              skip = true;
              break;
            case ExecutionState.ACT_FAIL:
              skip = false;
              break;
            default:
              console.error('Invalid action', state);
              return;
          }
          break;
        case Actors.VALIDATOR:
          switch (state) {
            case ExecutionState.STEP_START:
              displayProgress = true;
              break;
            case ExecutionState.STEP_OK:
              skip = false;
              break;
            case ExecutionState.STEP_FAIL:
              skip = false;
              break;
            default:
              console.error('Invalid validation', state);
              return;
          }
          break;
        default:
          console.error('Unknown actor', actor);
          return;
      }

      if (!skip) {
        appendMessage({
          actor,
          content: content || '',
          timestamp: timestamp,
        });
      }

      if (displayProgress) {
        appendMessage({
          actor,
          content: 'Showing progress...',
          timestamp: timestamp,
        });
      }
    },
    [appendMessage],
  );

  // Stop heartbeat and close connection
  const stopConnection = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (portRef.current) {
      portRef.current.disconnect();
      portRef.current = null;
    }
  }, []);

  // Setup connection management
  const setupConnection = useCallback(() => {
    // Only setup if no existing connection
    if (portRef.current) {
      return;
    }

    try {
      portRef.current = chrome.runtime.connect({ name: 'side-panel-connection' });

      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      portRef.current.onMessage.addListener((message: any) => {
        // Add type checking for message
        if (message && message.type === EventType.EXECUTION) {
          handleTaskState(message);
        } else if (message && message.type === 'error') {
          // Handle error messages from service worker
          appendMessage({
            actor: Actors.SYSTEM,
            content: message.error || 'Unknown error occurred',
            timestamp: Date.now(),
          });
          setInputEnabled(true);
          setShowStopButton(false);
        } else if (message && message.type === 'heartbeat_ack') {
          console.log('Heartbeat acknowledged');
        }
      });

      portRef.current.onDisconnect.addListener(() => {
        const error = chrome.runtime.lastError;
        console.log('Connection disconnected', error ? `Error: ${error.message}` : '');
        portRef.current = null;
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
        setInputEnabled(true);
        setShowStopButton(false);
      });

      // Setup heartbeat interval
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      heartbeatIntervalRef.current = window.setInterval(() => {
        if (portRef.current?.name === 'side-panel-connection') {
          try {
            portRef.current.postMessage({ type: 'heartbeat' });
          } catch (error) {
            console.error('Heartbeat failed:', error);
            stopConnection(); // Stop connection if heartbeat fails
          }
        } else {
          stopConnection(); // Stop if port is invalid
        }
      }, 25000);
    } catch (error) {
      console.error('Failed to establish connection:', error);
      appendMessage({
        actor: Actors.SYSTEM,
        content: 'Failed to connect to service worker',
        timestamp: Date.now(),
      });
      // Clear any references since connection failed
      portRef.current = null;
    }
  }, [handleTaskState, appendMessage, stopConnection]);

  // Add safety check for message sending
  const sendMessage = useCallback(
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    (message: any) => {
      if (portRef.current?.name !== 'side-panel-connection') {
        throw new Error('No valid connection available');
      }
      try {
        portRef.current.postMessage(message);
      } catch (error) {
        console.error('Failed to send message:', error);
        stopConnection(); // Stop connection when message sending fails
        throw error;
      }
    },
    [stopConnection],
  );

  const handleSendMessage = async (text: string) => {
    console.log('handleSendMessage', text);

    if (!text.trim()) return;

    // Block sending messages in historical sessions
    if (isHistoricalSession) {
      console.log('Cannot send messages in historical sessions');
      return;
    }

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tabId = tabs[0]?.id;
      if (!tabId) {
        throw new Error('No active tab found');
      }

      setInputEnabled(false);
      setShowStopButton(true);

      // Create a new chat session for this task if not in follow-up mode
      if (!isFollowUpMode) {
        const newSession = await chatHistoryStore.createSession(
          text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        );
        console.log('newSession', newSession);

        // Store the session ID in both state and ref
        const sessionId = newSession.id;
        setCurrentSessionId(sessionId);
        sessionIdRef.current = sessionId;
      }

      const userMessage = {
        actor: Actors.USER,
        content: text,
        timestamp: Date.now(),
      };

      // Pass the sessionId directly to appendMessage
      appendMessage(userMessage, sessionIdRef.current);

      // Setup connection if not exists
      if (!portRef.current) {
        setupConnection();
      }

      // Send message using the utility function
      if (isFollowUpMode) {
        // Send as follow-up task
        await sendMessage({
          type: 'follow_up_task',
          task: text,
          taskId: sessionIdRef.current,
          tabId,
        });
        console.log('follow_up_task sent', text, tabId, sessionIdRef.current);
      } else {
        // Send as new task
        await sendMessage({
          type: 'new_task',
          task: text,
          taskId: sessionIdRef.current,
          tabId,
        });
        console.log('new_task sent', text, tabId, sessionIdRef.current);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Task error', errorMessage);
      appendMessage({
        actor: Actors.SYSTEM,
        content: errorMessage,
        timestamp: Date.now(),
      });
      setInputEnabled(true);
      setShowStopButton(false);
      stopConnection();
    }
  };

  const handleStopTask = async () => {
    try {
      portRef.current?.postMessage({
        type: 'cancel_task',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('cancel_task error', errorMessage);
      appendMessage({
        actor: Actors.SYSTEM,
        content: errorMessage,
        timestamp: Date.now(),
      });
    }
    setInputEnabled(true);
    setShowStopButton(false);
  };

  const handleNewChat = () => {
    // Clear messages and start a new chat
    setMessages([]);
    setCurrentSessionId(null);
    sessionIdRef.current = null;
    setInputEnabled(true);
    setShowStopButton(false);
    setIsFollowUpMode(false);
    setIsHistoricalSession(false);

    // Disconnect any existing connection
    stopConnection();
  };

  const loadChatSessions = useCallback(async () => {
    try {
      const sessions = await chatHistoryStore.getSessionsMetadata();
      setChatSessions(sessions.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    }
  }, []);

  const handleLoadHistory = async () => {
    await loadChatSessions();
    setShowHistory(true);
  };

  const handleBackToChat = () => {
    setShowHistory(false);
  };

  const handleSessionSelect = async (sessionId: string) => {
    try {
      const fullSession = await chatHistoryStore.getSession(sessionId);
      if (fullSession && fullSession.messages.length > 0) {
        setCurrentSessionId(fullSession.id);
        setMessages(fullSession.messages);
        setIsFollowUpMode(false);
        setIsHistoricalSession(true); // Mark this as a historical session
      }
      setShowHistory(false);
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  const handleSessionDelete = async (sessionId: string) => {
    try {
      await chatHistoryStore.deleteSession(sessionId);
      await loadChatSessions();
      if (sessionId === currentSessionId) {
        setMessages([]);
        setCurrentSessionId(null);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleTemplateSelect = (content: string) => {
    console.log('handleTemplateSelect', content);
    if (setInputTextRef.current) {
      setInputTextRef.current(content);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopConnection();
    };
  }, [stopConnection]);

  // Scroll to bottom when new messages arrive
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add project-related handlers
  const handleShowProjects = () => {
    setShowProjects(true);
    setShowHistory(false);
    setShowTestCases(false);
  };

  const handleProjectSelect = (projectId: string) => {
    setCurrentProjectId(projectId);
    setShowProjects(false);
    setShowTestCases(true);
  };

  const handleBackFromProjects = () => {
    setShowProjects(false);
  };

  const handleBackFromTestCases = () => {
    setShowTestCases(false);
    setShowProjects(true);
  };

  const handleTestCaseSelect = (testCase: TestCase) => {
    setCurrentTestCase(testCase);
    setShowTestCases(false);

    // Show test case details with an option to execute
    const userMessage = {
      actor: Actors.SYSTEM,
      content: `Selected test case: ${testCase.name}\n\nDescription: ${testCase.description}\n\nSteps: ${testCase.steps.length}`,
      timestamp: Date.now(),
    };

    appendMessage(userMessage);

    // No longer adding steps to the input field
  };

  // Update handleExecuteTestCase function
  const handleExecuteTestCase = async (testCase: TestCase) => {
    if (!testCase || !testCase.steps || testCase.steps.length === 0) {
      appendMessage({
        actor: Actors.SYSTEM,
        content: 'Cannot execute test case: No steps found',
        timestamp: Date.now(),
      });
      return;
    }

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tabId = tabs[0]?.id;
      if (!tabId) {
        throw new Error('No active tab found');
      }

      setInputEnabled(false);
      setShowStopButton(true);

      // Create a new chat session for this test case
      const newSession = await chatHistoryStore.createSession(`Test Case: ${testCase.name}`);

      // Store the session ID in both state and ref
      const sessionId = newSession.id;
      setCurrentSessionId(sessionId);
      sessionIdRef.current = sessionId;

      const userMessage = {
        actor: Actors.USER,
        content: `Executing test case: ${testCase.name}\n\n${testCase.steps.join('\n')}`,
        timestamp: Date.now(),
      };

      // Add message to the chat
      appendMessage(userMessage, sessionIdRef.current);

      // Clear the current test case to show the chat view
      setCurrentTestCase(null);

      // Setup connection if not exists
      if (!portRef.current) {
        setupConnection();
      }

      // Send as new task
      await sendMessage({
        type: 'new_task',
        task: testCase.steps.join('\n'),
        taskId: sessionIdRef.current,
        tabId,
      });

      console.log('test_case_execution sent', testCase.name, tabId, sessionIdRef.current);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Test case execution error', errorMessage);
      appendMessage({
        actor: Actors.SYSTEM,
        content: `Failed to execute test case: ${errorMessage}`,
        timestamp: Date.now(),
      });
      setInputEnabled(true);
      setShowStopButton(false);
      stopConnection();
    }
  };

  // Add this function after handleTestCaseSelect
  const handleClearTestCase = () => {
    setCurrentTestCase(null);
  };

  return (
    <div>
      <div
        className={`flex flex-col h-[100vh] ${isDarkMode ? 'bg-slate-900' : "bg-[url('/bg.jpg')] bg-cover bg-no-repeat"} overflow-hidden border ${isDarkMode ? 'border-sky-800' : 'border-[rgb(186,230,253)]'} rounded-2xl`}>
        <header className="header relative">
          <div className="header-logo">
            {showHistory || showProjects || showTestCases ? (
              <button
                type="button"
                onClick={() => {
                  if (showHistory) handleBackToChat();
                  if (showProjects) handleBackFromProjects();
                  if (showTestCases) handleBackFromTestCases();
                }}
                className={`${isDarkMode ? 'text-sky-400 hover:text-sky-300' : 'text-sky-400 hover:text-sky-500'} cursor-pointer text-lg`}
                aria-label="Back">
                ← Back
              </button>
            ) : (
              <img src="/icon-128.png" alt="Extension Logo" className="h-8 w-8" />
            )}
          </div>
          <div className="header-icons">
            {!showHistory && !showProjects && !showTestCases && (
              <>
                <button
                  type="button"
                  className={`${
                    isDarkMode ? 'text-sky-400 hover:text-sky-300' : 'text-sky-400 hover:text-sky-500'
                  } cursor-pointer`}
                  onClick={handleNewChat}
                  aria-label="New chat">
                  <PiPlusBold size={24} />
                </button>
                <button
                  type="button"
                  className={`${
                    isDarkMode ? 'text-sky-400 hover:text-sky-300' : 'text-sky-400 hover:text-sky-500'
                  } cursor-pointer`}
                  onClick={handleLoadHistory}
                  aria-label="Chat history">
                  <GrHistory size={24} />
                </button>
                <button
                  type="button"
                  className={`${
                    isDarkMode ? 'text-sky-400 hover:text-sky-300' : 'text-sky-400 hover:text-sky-500'
                  } cursor-pointer`}
                  onClick={handleShowProjects}
                  aria-label="Projects">
                  <VscProject size={24} />
                </button>
                <a
                  href="https://discord.gg/3MFRbcgAtx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${
                    isDarkMode ? 'text-sky-400 hover:text-sky-300' : 'text-sky-400 hover:text-sky-500'
                  } cursor-pointer`}
                  aria-label="Discord">
                  <RxDiscordLogo size={24} />
                </a>
                <a
                  href="/options/index.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${
                    isDarkMode ? 'text-sky-400 hover:text-sky-300' : 'text-sky-400 hover:text-sky-500'
                  } cursor-pointer`}
                  aria-label="Settings">
                  <FiSettings size={24} />
                </a>
              </>
            )}
          </div>
        </header>

        <main className="main">
          {showHistory && (
            <ChatHistoryList
              sessions={chatSessions}
              onSessionSelect={handleSessionSelect}
              onSessionDelete={handleSessionDelete}
              visible={true}
              isDarkMode={isDarkMode}
            />
          )}
          {showProjects && (
            <ProjectList
              onProjectSelect={handleProjectSelect}
              onBackToChat={handleBackFromProjects}
              isDarkMode={isDarkMode}
            />
          )}
          {showTestCases && currentProjectId && (
            <TestCaseList
              projectId={currentProjectId}
              onTestCaseSelect={handleTestCaseSelect}
              onBackToProjects={handleBackFromTestCases}
              isDarkMode={isDarkMode}
            />
          )}
          {!showHistory && !showProjects && !showTestCases && !currentTestCase && (
            <>
              <MessageList messages={messages} isDarkMode={isDarkMode} />
              <div className="flex-none p-2">
                {messages.length === 0 && (
                  <TemplateList
                    templates={defaultTemplates}
                    onTemplateSelect={handleTemplateSelect}
                    isDarkMode={isDarkMode}
                  />
                )}
                <ChatInput
                  onSendMessage={handleSendMessage}
                  onStopTask={handleStopTask}
                  disabled={!inputEnabled}
                  showStopButton={showStopButton}
                  setContent={setter => {
                    setInputTextRef.current = setter;
                  }}
                  isDarkMode={isDarkMode}
                />
              </div>
            </>
          )}

          {!showHistory && !showProjects && !showTestCases && currentTestCase && (
            <>
              <MessageList messages={messages} isDarkMode={isDarkMode} />
              <div className="flex-none p-2">
                <TestCaseDetails
                  testCase={currentTestCase}
                  onExecute={handleExecuteTestCase}
                  onBack={handleClearTestCase}
                  isDarkMode={isDarkMode}
                />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default SidePanel;
