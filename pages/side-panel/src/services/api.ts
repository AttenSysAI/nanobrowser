import { Project, ProjectsResponse, TestCase, TestCasesResponse } from '../types/project';

export class ApiClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const token = import.meta.env.VITE_BEARER_TOKEN || '';

    this.headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  async get<T>(path: string, queryParams?: Record<string, string | number>): Promise<T> {
    try {
      let url = `${this.baseUrl}${path}`;
      if (queryParams) {
        const params = new URLSearchParams();
        Object.entries(queryParams).forEach(([key, value]) => {
          params.append(key, String(value));
        });
        url += `?${params.toString()}`;
      }

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
      console.error('API GET request failed:', error);
      throw error;
    }
  }

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
      console.error('API POST request failed:', error);
      throw error;
    }
  }
}

const apiClient = new ApiClient();

export const projectService = {
  getProjects: async (page = 1, size = 10): Promise<ProjectsResponse> => {
    return apiClient.get<ProjectsResponse>('/api/projects/', { page, size });
  },

  getProjectById: async (projectId: string): Promise<Project> => {
    return apiClient.get<Project>(`/api/projects/${projectId}`);
  },
};

export const testCaseService = {
  getTestCases: async (page = 1, size = 10, projectId?: string, status?: string): Promise<TestCasesResponse> => {
    const params: Record<string, string | number> = { page, size };
    if (projectId) params.project_id = projectId;
    if (status) params.status = status;

    return apiClient.get<TestCasesResponse>('/api/testcases/', params);
  },

  getTestCaseById: async (testCaseId: string): Promise<TestCase> => {
    return apiClient.get<TestCase>(`/api/testcases/${testCaseId}`);
  },
};

export const testExecutionService = {
  submitResult: async (testCaseId: string, status: 'passed' | 'failed'): Promise<any> => {
    return apiClient.post<any>('/api/test-executions/', {
      test_case_id: testCaseId,
      status,
    });
  },
};

export default {
  projectService,
  testCaseService,
  testExecutionService,
};
