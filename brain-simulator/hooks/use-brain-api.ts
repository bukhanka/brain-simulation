import { useState, useRef, useEffect } from "react";
import { AgentRole } from "@/lib/api/openai";
import { STORAGE_KEYS } from "@/lib/storage-utils";

// Maximum number of items to keep in context window
const MAX_CONTEXT_LENGTH = 20;
export const MAX_MESSAGE_LENGTH = 1000; // Characters

// Types for code review
export type CodeReviewResult = {
  passes: boolean;
  issues: string[];
  suggestions: string[];
};

// Types for test results
export type TestResult = {
  success: boolean;
  results: {
    case: string;
    passed: boolean;
    output: string;
  }[];
};

// Type for multi-module file structure
export type FileModule = {
  path: string;
  content: string;
};

type BrainApiState = {
  loading: boolean;
  error: string | null;
};

export function useBrainApi() {
  const [state, setState] = useState<BrainApiState>({
    loading: false,
    error: null,
  });

  // Enhanced memory management with context window
  const [contextWindow, setContextWindow] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const savedContext = localStorage.getItem(STORAGE_KEYS.CONTEXT);
      if (savedContext) {
        try {
          return JSON.parse(savedContext);
        } catch (e) {
          console.error('Error loading context from localStorage:', e);
        }
      }
    }
    return [];
  });

  // Save context to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && contextWindow.length > 0) {
      try {
        // Stringify once to check size
        const contextString = JSON.stringify(contextWindow);
        
        // Check size before trying to store (approx 5MB limit)
        if (contextString.length > 4 * 1024 * 1024) {
          // If too large, trim the array to half size
          console.warn("Context size exceeds safe limit, trimming to reduce size");
          const trimmedContext = contextWindow.slice(-Math.floor(MAX_CONTEXT_LENGTH / 2));
          setContextWindow(trimmedContext);
          return; // Exit and wait for next update with trimmed array
        }
        
        localStorage.setItem(STORAGE_KEYS.CONTEXT, contextString);
      } catch (e) {
        console.error('Error saving context to localStorage:', e);
        // If quota exceeded, reduce the context size
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          const trimmedContext = contextWindow.slice(-Math.floor(MAX_CONTEXT_LENGTH / 2));
          setContextWindow(trimmedContext);
        }
      }
    }
  }, [contextWindow]);

  // Add item to context window and maintain max size
  const addToContext = (message: string) => {
    // Limit individual message size to prevent excessive growth
    const trimmedMessage = message.length > MAX_MESSAGE_LENGTH 
      ? message.substring(0, MAX_MESSAGE_LENGTH) + "..." 
      : message;
      
    setContextWindow(prev => {
      const updated = [...prev, trimmedMessage];
      return updated.length > MAX_CONTEXT_LENGTH ? updated.slice(-MAX_CONTEXT_LENGTH) : updated;
    });
  };

  const callBrainApi = async <T>(action: string, params: Record<string, any> = {}): Promise<T | null> => {
    setState({ loading: true, error: null });
    
    // Add API call to context if relevant
    if (action !== 'generateEvent') {
      try {
        addToContext(`API Call: ${action} - ${JSON.stringify(params)}`);
      } catch (e) {
        console.error('Error adding to context, clearing context window', e);
        // If we have any issues adding to context, clear it
        clearContext();
      }
    }
    
    try {
      const response = await fetch('/api/brain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          ...params,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Something went wrong');
      }
      
      const data = await response.json();
      setState({ loading: false, error: null });
      
      // Add result to context if relevant
      if (action !== 'generateEvent') {
        try {
          const resultSummary = JSON.stringify(data).substring(0, 100) + 
            (JSON.stringify(data).length > 100 ? '...' : '');
          addToContext(`API Result: ${resultSummary}`);
        } catch (e) {
          console.error('Error adding result to context, clearing context window', e);
          clearContext();
        }
      }
      
      return data;
    } catch (error) {
      console.error(`Error in ${action}:`, error);
      setState({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return null;
    }
  };

  // Get thoughts from an agent
  const getAgentThoughts = async (agent: AgentRole, task: string) => {
    const result = await callBrainApi<{ thought: string }>('getThoughts', { agent, task });
    return result?.thought;
  };

  // Improved code generation with context
  const generateCode = async (task: string) => {
    const result = await callBrainApi<{ code: string }>('generateCode', { 
      task, 
      context: contextWindow 
    });
    return result?.code;
  };

  // Advanced code generation with project structure awareness
  const generateComplexCode = async (task: string, projectStructure: string) => {
    const result = await callBrainApi<{ 
      code: string, 
      explanation: string 
    }>('generateComplexCode', { 
      task, 
      context: contextWindow,
      projectStructure 
    });
    return result;
  };
  
  // Generate multiple code modules
  const generateProject = async (specification: string) => {
    // First plan the file structure
    const structure = await callBrainApi<{files: string[]}>('planProject', {
      specification
    });
    
    if (!structure) return null;
    
    // Then generate all modules
    const modules = await callBrainApi<{modules: FileModule[]}>('generateModules', {
      specification,
      fileStructure: structure.files,
      context: contextWindow
    });
    
    return modules?.modules;
  };

  // Code review system
  const reviewCode = async (code: string, requirements: string): Promise<CodeReviewResult | null> => {
    const result = await callBrainApi<CodeReviewResult>('reviewCode', { 
      code, 
      requirements,
      context: contextWindow 
    });
    return result;
  };

  // Code testing capability
  const testCode = async (code: string, testCases: string[]): Promise<TestResult | null> => {
    const result = await callBrainApi<TestResult>('testCode', { 
      code, 
      testCases 
    });
    return result;
  };

  // Generate a random event
  const generateEvent = async () => {
    const result = await callBrainApi<{ event: string }>('generateEvent');
    return result?.event;
  };

  // Clear context window
  const clearContext = () => {
    setContextWindow([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.CONTEXT);
    }
  };

  return {
    loading: state.loading,
    error: state.error,
    context: contextWindow,
    addToContext,
    clearContext,
    getAgentThoughts,
    generateCode,
    generateComplexCode,
    generateProject,
    reviewCode,
    testCode,
    generateEvent,
  };
} 