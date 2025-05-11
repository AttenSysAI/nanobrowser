import { createLogger } from '../src/background/log';

const logger = createLogger('api');

/**
 * Base API client for communicating with the backend
 */
export class ApiClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    // Get the base URL from environment variables
    this.baseUrl = process.env.VITE_API_URL || '';

    // Set up default headers with Bearer token authentication
    const token = process.env.VITE_BEARER_TOKEN || '';

    this.headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Makes a GET request to the API
   */
  async get<T>(path: string, queryParams?: Record<string, string | number>): Promise<T> {
    try {
      // Build URL with query parameters
      let url = `${this.baseUrl}${path}`;
      if (queryParams) {
        const params = new URLSearchParams();
        Object.entries(queryParams).forEach(([key, value]) => {
          params.append(key, String(value));
        });
        url += `?${params.toString()}`;
      }

      // Make the request
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed: Invalid or expired token');
        }
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      logger.error('API GET request failed:', error);
      throw error;
    }
  }

  /**
   * Makes a POST request to the API
   */
  async post<T>(path: string, data: unknown): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed: Invalid or expired token');
        }
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      logger.error('API POST request failed:', error);
      throw error;
    }
  }
}

// Project types
export interface Project {
  name: string;
  description: string;
  id: string;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectsResponse {
  data: Project[];
  total: number;
  page: number;
  size: number;
}

// TestCase types
export interface TestCase {
  name: string;
  description: string;
  steps: string[];
  status: string;
  source: string;
  id: string;
  project_id: string;
  org_id: string;
  created_by: string;
  updated_by: string;
  deleted_by: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TestCasesResponse {
  data: TestCase[];
  total: number;
  page: number;
  size: number;
}

// API service instance
const apiClient = new ApiClient();

// Project service functions
export const projectService = {
  /**
   * Get all projects with pagination
   */
  getProjects: async (page = 1, size = 10): Promise<ProjectsResponse> => {
    return apiClient.get<ProjectsResponse>('/api/projects/', { page, size });
  },

  /**
   * Get a project by ID
   */
  getProjectById: async (projectId: string): Promise<Project> => {
    return apiClient.get<Project>(`/api/projects/${projectId}`);
  },
};

// TestCase service functions
export const testCaseService = {
  /**
   * Get all test cases with pagination and optional filtering
   */
  getTestCases: async (page = 1, size = 10, projectId?: string, status?: string): Promise<TestCasesResponse> => {
    const params: Record<string, string | number> = { page, size };
    if (projectId) params.project_id = projectId;
    if (status) params.status = status;

    return apiClient.get<TestCasesResponse>('/api/testcases/', params);
  },

  /**
   * Get a test case by ID
   */
  getTestCaseById: async (testCaseId: string): Promise<TestCase> => {
    return apiClient.get<TestCase>(`/api/testcases/${testCaseId}`);
  },
};

export default {
  projectService,
  testCaseService,
};
