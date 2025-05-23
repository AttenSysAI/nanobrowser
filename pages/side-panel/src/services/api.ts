import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Project, ProjectsResponse, TestCase, TestCasesResponse } from '../types/project';

export class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(baseUrl: string | undefined) {
    this.axiosInstance = axios.create({
      baseURL: baseUrl || 'http://localhost:8000',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.axiosInstance.interceptors.request.use(
      async config => {
        const token = await this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      },
    );

    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      error => {
        if (error.response?.status === 401) {
          throw new Error('Authentication failed: Invalid or expired token');
        }

        const message = error.response?.data?.message || error.message || 'Unknown error occurred';
        throw new Error(`API error: ${error.response?.status || 'Network'} - ${message}`);
      },
    );
  }

  private async getToken(): Promise<string | null> {
    return new Promise(resolve => {
      chrome.storage.local.get('appToken', result => {
        resolve(result.appToken || null);
      });
    });
  }

  async get<T>(path: string, queryParams?: Record<string, string | number>): Promise<T> {
    try {
      const response = await this.axiosInstance.get<T>(path, {
        params: queryParams,
      });
      return response.data;
    } catch (error) {
      console.error('API GET request failed:', error);
      throw error;
    }
  }

  async post<T>(path: string, data: unknown): Promise<T> {
    try {
      const response = await this.axiosInstance.post<T>(path, data);
      return response.data;
    } catch (error) {
      console.error('API POST request failed:', error);
      throw error;
    }
  }

  async put<T>(path: string, data: unknown): Promise<T> {
    try {
      const response = await this.axiosInstance.put<T>(path, data);
      return response.data;
    } catch (error) {
      console.error('API PUT request failed:', error);
      throw error;
    }
  }

  async delete(path: string): Promise<void> {
    try {
      await this.axiosInstance.delete(path);
    } catch (error) {
      console.error('API DELETE request failed:', error);
      throw error;
    }
  }
}

const apiClient = new ApiClient(import.meta.env.VITE_API_URL);

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

  createTestCase: async (data: {
    name: string;
    description: string;
    steps: string[];
    project_id: string;
  }): Promise<TestCase> => {
    return apiClient.post<TestCase>('/api/testcases/', {
      ...data,
      status: 'active',
      source: 'manual',
    });
  },

  updateTestCase: async (
    testCaseId: string,
    data: {
      name: string;
      description: string;
      steps: string[];
    },
  ): Promise<TestCase> => {
    return apiClient.put<TestCase>(`/api/testcases/${testCaseId}`, {
      ...data,
      status: 'active',
      source: 'manual',
    });
  },

  deleteTestCase: async (testCaseId: string): Promise<void> => {
    return apiClient.delete(`/api/testcases/${testCaseId}`);
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
