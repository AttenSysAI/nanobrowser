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
