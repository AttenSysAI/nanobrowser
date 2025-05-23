/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef, createRef } from 'react';
import { FiSettings, FiLogOut } from 'react-icons/fi';
import { PiPlusBold } from 'react-icons/pi';
import { GrHistory } from 'react-icons/gr';
import { VscProject } from 'react-icons/vsc';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { type Message, Actors, chatHistoryStore } from '@extension/storage';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import ChatHistoryList from './components/ChatHistoryList';
import TemplateList from './components/TemplateList';
import ProjectList from './components/ProjectList';
import TestCaseList from './components/TestCaseList';
import LoginPage from './components/LoginPage';
import { EventType, type AgentEvent, ExecutionState } from './types/event';
import { defaultTemplates } from './templates';
import { TestCase } from './types/project';
import TestCaseDetails from './components/TestCaseDetails';
import { testExecutionService } from './services/api';
import { authService, UserInfo } from './services/auth';
import './SidePanel.css';

const DEBUG_MODE = true;

const SidePanel = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputEnabled, setInputEnabled] = useState(true);
  const [showStopButton, setShowStopButton] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showTestCases, setShowTestCases] = useState(false);
  const [isInTestCaseForm, setIsInTestCaseForm] = useState(false);
  const testCaseListRef = createRef<any>();
  const [chatSessions, setChatSessions] = useState<Array<{ id: string; title: string; createdAt: number }>>([]);
  const [isFollowUpMode, setIsFollowUpMode] = useState(false);
  const [isHistoricalSession, setIsHistoricalSession] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentTestCase, setCurrentTestCase] = useState<TestCase | null>(null);
  const [testExecutionCompleted, setTestExecutionCompleted] = useState(false);
  const [executedTestCaseId, setExecutedTestCaseId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const sessionIdRef = useRef<string | null>(null);
  const portRef = useRef<chrome.runtime.Port | null>(null);
  const heartbeatIntervalRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const setInputTextRef = useRef<((text: string) => void) | null>(null);
  const executedTestCaseIdRef = useRef<string | null>(null);

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

  useEffect(() => {
    executedTestCaseIdRef.current = executedTestCaseId;
  }, [executedTestCaseId]);

  useEffect(() => {
    if (DEBUG_MODE) {
      console.log('testExecutionCompleted changed:', testExecutionCompleted);
    }
  }, [testExecutionCompleted]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await authService.isAuthenticated();
        if (isAuth) {
          setIsAuthenticated(true);
          const token = await authService.getToken();
          setAuthToken(token);
          const user = await authService.getCurrentUser();
          setUserInfo(user);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };

    checkAuth();
  }, []);

  const appendMessage = useCallback((newMessage: Message, sessionId?: string | null) => {
    const isProgressMessage = newMessage.content === 'Showing progress...';

    setMessages(prev => {
      const filteredMessages = prev.filter(
        (msg, idx) => !(msg.content === 'Showing progress...' && idx === prev.length - 1),
      );
      return [...filteredMessages, newMessage];
    });

    const effectiveSessionId = sessionId !== undefined ? sessionId : sessionIdRef.current;

    console.log('sessionId', effectiveSessionId);

    if (effectiveSessionId && !isProgressMessage) {
      chatHistoryStore
        .addMessage(effectiveSessionId, newMessage)
        .catch(err => console.error('Failed to save message to history:', err));
    }
  }, []);

  const handleTestCompletion = useCallback((testCaseId: string) => {
    console.log('Test execution completed explicitly for ID:', testCaseId);
    setTimeout(() => {
      setTestExecutionCompleted(true);
      setExecutedTestCaseId(testCaseId);
    }, 100);
  }, []);

  const handleTaskState = useCallback(
    (event: AgentEvent) => {
      const { actor, state, timestamp, data } = event;
      const content = data?.details;
      let skip = true;
      let displayProgress = false;

      if (DEBUG_MODE) {
        console.log(`Event: ${actor} -> ${state}`, executedTestCaseIdRef.current);
      }

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

              // If this was a test case execution, mark it as completed
              if (DEBUG_MODE) {
                console.log('Task OK completed, executedTestCaseIdRef.current:', executedTestCaseIdRef.current);
              }

              if (executedTestCaseIdRef.current) {
                if (DEBUG_MODE) {
                  console.log('Task was a test execution, showing pass/fail options');
                }

                // Use the explicit handler to ensure UI updates
                handleTestCompletion(executedTestCaseIdRef.current);

                // Add a message to indicate completion
                appendMessage({
                  actor: Actors.SYSTEM,
                  content: 'Test execution completed. Please rate the result as Passed or Failed.',
                  timestamp: Date.now(),
                });
              }
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
    [appendMessage, handleTestCompletion],
  );

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

  const setupConnection = useCallback(() => {
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

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      heartbeatIntervalRef.current = window.setInterval(() => {
        if (portRef.current?.name === 'side-panel-connection') {
          try {
            portRef.current.postMessage({ type: 'heartbeat' });
          } catch (error) {
            console.error('Heartbeat failed:', error);
            stopConnection();
          }
        } else {
          stopConnection();
        }
      }, 25000);
    } catch (error) {
      console.error('Failed to establish connection:', error);
      appendMessage({
        actor: Actors.SYSTEM,
        content: 'Failed to connect to service worker',
        timestamp: Date.now(),
      });
      portRef.current = null;
    }
  }, [handleTaskState, appendMessage, stopConnection]);

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
        stopConnection();
        throw error;
      }
    },
    [stopConnection],
  );

  const handleSendMessage = async (text: string) => {
    console.log('handleSendMessage', text);

    if (!text.trim()) return;

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

      if (!isFollowUpMode) {
        const newSession = await chatHistoryStore.createSession(
          text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        );
        console.log('newSession', newSession);

        const sessionId = newSession.id;
        setCurrentSessionId(sessionId);
        sessionIdRef.current = sessionId;
      }

      const userMessage = {
        actor: Actors.USER,
        content: text,
        timestamp: Date.now(),
      };

      appendMessage(userMessage, sessionIdRef.current);

      if (!portRef.current) {
        setupConnection();
      }

      if (isFollowUpMode) {
        await sendMessage({
          type: 'follow_up_task',
          task: text,
          taskId: sessionIdRef.current,
          tabId,
        });
        console.log('follow_up_task sent', text, tabId, sessionIdRef.current);
      } else {
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
    setMessages([]);
    setCurrentSessionId(null);
    sessionIdRef.current = null;
    setInputEnabled(true);
    setShowStopButton(false);
    setIsFollowUpMode(false);
    setIsHistoricalSession(false);
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
        setIsHistoricalSession(true);
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

  // Update handleExecuteTestCase function to be more explicit
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
      // Reset the test execution state
      setTestExecutionCompleted(false);

      // Store test case ID in both state and ref
      if (DEBUG_MODE) {
        console.log('Starting test execution for test case:', testCase.id);
      }

      setExecutedTestCaseId(testCase.id);
      executedTestCaseIdRef.current = testCase.id;

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

      if (DEBUG_MODE) {
        console.log('test_case_execution sent', testCase.name, tabId, sessionIdRef.current);
      }
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
      setExecutedTestCaseId(null);
      executedTestCaseIdRef.current = null;
    }
  };

  // Add this function after handleTestCaseSelect
  const handleClearTestCase = () => {
    setCurrentTestCase(null);
    setShowTestCases(true);
  };

  // Additional cleanup when resetting test execution
  const resetTestExecution = useCallback(() => {
    if (DEBUG_MODE) {
      console.log('Resetting test execution state');
    }

    setTestExecutionCompleted(false);
    setExecutedTestCaseId(null);
    executedTestCaseIdRef.current = null;
  }, []);

  // Update handleTestResult to use consistent status naming
  const handleTestResult = async (status: 'passed' | 'failed') => {
    try {
      const testCaseId = executedTestCaseId || executedTestCaseIdRef.current;

      if (!testCaseId) {
        throw new Error('No test case ID found');
      }

      console.log('Submitting test result:', status, 'for test case:', testCaseId);

      try {
        // Use the testExecutionService
        await testExecutionService.submitResult(testCaseId, status);

        // Show success message
        appendMessage({
          actor: Actors.SYSTEM,
          content: `Test execution saved successfully as: ${status}`,
          timestamp: Date.now(),
        });
      } catch (apiError) {
        // Handle API errors
        console.error('API error:', apiError);
        throw apiError;
      }
    } catch (error) {
      console.error('Failed to save test execution:', error);

      // Show error message
      appendMessage({
        actor: Actors.SYSTEM,
        content: `Failed to save test execution: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
      });
    } finally {
      // Reset the state after handling
      resetTestExecution();
    }
  };

  // Update the cleanup effect
  useEffect(() => {
    // Reset test execution tracking when changing views
    if (showHistory || showProjects || showTestCases || currentTestCase) {
      resetTestExecution();
    }
  }, [showHistory, showProjects, showTestCases, currentTestCase, resetTestExecution]);

  const handleDismiss = () => {
    // Just reset the state without updating backend
    resetTestExecution();
  };

  // Move the pass/fail UI to a separate component for clarity
  const TestResultButtons = () => {
    // Check both state and ref to be safe
    const isTestCompleted = testExecutionCompleted;
    const testId = executedTestCaseId || executedTestCaseIdRef.current;

    if (!isTestCompleted || !testId) {
      if (DEBUG_MODE) {
        console.log('Not showing test result buttons:', { isTestCompleted, testId });
      }
      return null;
    }

    if (DEBUG_MODE) {
      console.log('Rendering test result buttons', { isTestCompleted, testId });
    }

    return (
      <div
        className={`mb-2 p-3 rounded-lg relative ${isDarkMode ? 'bg-[hsl(0,0%,14.9%)] text-[hsl(0,0%,98%)]' : 'bg-white text-[hsl(0,0%,3.9%)]'} shadow-lg`}>
        <button
          onClick={handleDismiss}
          className={`absolute top-2 right-2 p-1 rounded-full hover:bg-opacity-10 ${
            isDarkMode ? 'hover:bg-white text-white' : 'hover:bg-black text-black'
          } transition-colors`}
          aria-label="Dismiss">
          <FaTimes size={16} />
        </button>
        <div className="text-center font-medium mb-2">How did this test case perform?</div>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => handleTestResult('passed')}
            className={`flex items-center px-4 py-2 ${isDarkMode ? 'bg-[hsl(0,0%,98%)] text-[hsl(0,0%,9%)]' : 'bg-[hsl(0,0%,9%)] text-[hsl(0,0%,98%)]'} rounded-md hover:opacity-90 transition-colors`}>
            <FaCheck className="mr-2" /> Passed
          </button>
          <button
            onClick={() => handleTestResult('failed')}
            className={`flex items-center px-4 py-2 ${isDarkMode ? 'bg-[hsl(0,62.8%,30.6%)] text-[hsl(0,0%,98%)]' : 'bg-[hsl(0,84.2%,60.2%)] text-white'} rounded-md hover:opacity-90 transition-colors`}>
            <FaTimes className="mr-2" /> Failed
          </button>
        </div>
      </div>
    );
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    console.log('handleLoginSuccess');

    handleNewChat();
  };

  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
      setUserInfo(null);
      setAuthToken(null);
      // Reset UI state
      handleNewChat();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div>
      <div
        className={`flex flex-col h-[100vh] ${isDarkMode ? 'bg-[hsl(0,0%,3.9%)] text-[hsl(0,0%,98%)]' : 'bg-white text-[hsl(0,0%,3.9%)]'} overflow-hidden border ${isDarkMode ? 'border-[hsl(0,0%,14.9%)]' : 'border-[hsl(0,0%,89.8%)]'} rounded-lg`}>
        <header className="header relative">
          <div className="header-logo">
            {showHistory || showProjects || showTestCases || currentTestCase || isInTestCaseForm ? (
              <button
                type="button"
                onClick={() => {
                  if (showHistory) handleBackToChat();
                  if (showProjects) handleBackFromProjects();
                  if (showTestCases && !isInTestCaseForm) handleBackFromTestCases();
                  if (showTestCases && isInTestCaseForm && testCaseListRef.current) {
                    testCaseListRef.current.handleCancel();
                  }
                  if (currentTestCase) handleClearTestCase();
                }}
                className={`${isDarkMode ? 'text-[hsl(0,0%,98%)] hover:text-[hsl(0,0%,63.9%)]' : 'text-[hsl(0,0%,9%)] hover:text-[hsl(0,0%,45.1%)]'} cursor-pointer text-lg`}
                aria-label="Back">
                ← Back
              </button>
            ) : (
              <a href="https://scriptless.attensys.ai" target="_blank" rel="noopener noreferrer">
                <img src="/icon-128.png" alt="Extension Logo" className="h-8 w-8 cursor-pointer" />
              </a>
            )}
          </div>
          <div className="header-icons">
            {!showHistory && !showProjects && !showTestCases && (
              <>
                <button
                  type="button"
                  className={`${isDarkMode ? 'text-[hsl(0,0%,98%)] hover:text-[hsl(0,0%,63.9%)]' : 'text-[hsl(0,0%,9%)] hover:text-[hsl(0,0%,45.1%)]'} cursor-pointer`}
                  onClick={handleNewChat}
                  aria-label="New chat">
                  <PiPlusBold size={24} />
                </button>
                <button
                  type="button"
                  className={`${isDarkMode ? 'text-[hsl(0,0%,98%)] hover:text-[hsl(0,0%,63.9%)]' : 'text-[hsl(0,0%,9%)] hover:text-[hsl(0,0%,45.1%)]'} cursor-pointer`}
                  onClick={handleLoadHistory}
                  aria-label="Chat history">
                  <GrHistory size={24} />
                </button>
                <button
                  type="button"
                  className={`${isDarkMode ? 'text-[hsl(0,0%,98%)] hover:text-[hsl(0,0%,63.9%)]' : 'text-[hsl(0,0%,9%)] hover:text-[hsl(0,0%,45.1%)]'} cursor-pointer`}
                  onClick={handleShowProjects}
                  aria-label="Projects">
                  <VscProject size={24} />
                </button>
                <a
                  href="/options/index.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${isDarkMode ? 'text-[hsl(0,0%,98%)] hover:text-[hsl(0,0%,63.9%)]' : 'text-[hsl(0,0%,9%)] hover:text-[hsl(0,0%,45.1%)]'} cursor-pointer`}
                  aria-label="Settings">
                  <FiSettings size={24} />
                </a>
                {isAuthenticated && (
                  <button
                    type="button"
                    className={`${
                      isDarkMode ? 'text-sky-400 hover:text-sky-300' : 'text-sky-400 hover:text-sky-500'
                    } cursor-pointer`}
                    onClick={handleLogout}
                    aria-label="Logout">
                    <FiLogOut size={24} />
                  </button>
                )}
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
              ref={testCaseListRef}
              projectId={currentProjectId}
              onTestCaseSelect={handleTestCaseSelect}
              onBackToProjects={handleBackFromTestCases}
              isDarkMode={isDarkMode}
              onFormViewChange={setIsInTestCaseForm}
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
                <TestResultButtons />
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
