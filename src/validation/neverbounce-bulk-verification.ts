import { Logger } from "../util";
import { camelizeKeys, snakeizeKeys } from "../util/case-converter";

const NEVERBOUNCE_API_BASE = "https://api.neverbounce.com/v4" as const;

export interface BulkJobRequest {
  input: string | { uid: string; email: string }[];
  inputLocation: InputLocationType;
  filename?: string;
  autoStart: boolean;
  autoParse: boolean;
  runSample: boolean;
  callbackUrl?: string;
  callbackHeaders?: Record<string, string>;
  allowManualReview?: boolean;
  requestMetaData?: {
    leverageHistoricalData: number;
  };
}

export interface BulkJobResponse {
  status: string;
  jobId: string;
  executionTime: number;
}

export interface BulkJobStatus {
  status: string;
  id: string;
  filename: string;
  created: string;
  started: string | null;
  finished: string | null;
  total: number;
  processed: number;
  completed: number;
  jobStatus:
    | "underReview"
    | "queued"
    | "failed"
    | "complete"
    | "running"
    | "parsing"
    | "waiting"
    | "waitingAnalyzed"
    | "uploading";
}

export interface BulkJobResults {
  total: number;
  results: Array<{
    email: string;
    verificationStatus: string;
    result: string;
  }>;
}

export interface JobSearchQuery {
  page?: number;
  itemsPerPage?: number;
  jobId?: string;
  filename?: string;
  completed?: boolean;
  jobStatus?: string;
}

export interface JobResultsQuery {
  page?: number;
  itemsPerPage?: number;
  email?: string;
  verificationStatus?: string;
}

export enum InputLocationType {
  REMOTE_URL = "remote_url",
  SUPPLIED = "supplied",
}

export class NeverBounceBulkVerification {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest<T>(endpoint: string, method: string = "GET", data?: any): Promise<T> {
    const url = new URL(`${NEVERBOUNCE_API_BASE}${endpoint}`);

    // Convert request data to snake_case for NeverBounce API
    const snakeData = data ? snakeizeKeys(data) : undefined;

    // Add API key to all requests
    const requestData = {
      key: this.apiKey,
      ...snakeData,
    };

    try {
      if (method === "GET") {
        url.search = new URLSearchParams(requestData as Record<string, string>).toString();
      }

      const response = await fetch(url.toString(), {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: method !== "GET" ? JSON.stringify(requestData) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json();
        Logger.error("NeverBounce API error:", errorData);
        throw new Error(`NeverBounce API error: ${errorData.message || response.statusText}`);
      }

      // Convert response data to camelCase
      const responseData = await response.json();

      return camelizeKeys(responseData) as T;
    } catch (error) {
      Logger.error("Failed to make NeverBounce API request:", error);
      throw error;
    }
  }

  /**
   * Creates a new bulk verification job
   * @param request The job configuration
   * @returns The created job details
   */
  async createBulkJob(request: BulkJobRequest): Promise<BulkJobResponse> {
    return this.makeRequest<BulkJobResponse>("/jobs/create", "POST", request);
  }

  /**
   * Lists all bulk verification jobs
   * @returns Array of job statuses
   */
  async listJobs(): Promise<BulkJobStatus[]> {
    const response = await this.makeRequest<{ jobs: BulkJobStatus[] }>("/jobs/search");
    return response.jobs;
  }

  /**
   * Gets the status of a specific bulk verification job
   * @param jobId The ID of the job to check
   * @returns The job status
   */
  async getJobStatus(jobId: number): Promise<BulkJobStatus> {
    return this.makeRequest<BulkJobStatus>("/jobs/status", "GET", { jobId });
  }

  /**
   * Gets the results of a completed bulk verification job
   * @param jobId The ID of the job
   * @param query Optional query parameters
   * @returns The job results
   */
  async getJobResults(jobId: string, query?: JobResultsQuery): Promise<BulkJobResults> {
    return this.makeRequest<BulkJobResults>("/jobs/results", "GET", {
      jobId,
      ...query,
    });
  }

  /**
   * Downloads the results of a bulk verification job
   * @param jobId The ID of the job
   * @param query Optional query parameters
   * @returns The job results as a Buffer
   */
  async downloadJobResults(jobId: string, query?: JobResultsQuery): Promise<Buffer> {
    const url = new URL(`${NEVERBOUNCE_API_BASE}/jobs/download`);
    const params = snakeizeKeys({
      key: this.apiKey,
      jobId,
      ...(query || {}),
    });
    url.search = new URLSearchParams(params).toString();

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        const errorData = await response.json();
        Logger.error("NeverBounce API error:", errorData);
        throw new Error(`NeverBounce API error: ${errorData.message || response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      Logger.error("Failed to download job results:", error);
      throw error;
    }
  }

  /**
   * Deletes a bulk verification job
   * @param jobId The ID of the job to delete
   * @returns The deletion status
   */
  async deleteJob(jobId: string): Promise<{ status: string }> {
    return this.makeRequest<{ status: string }>("/jobs/delete", "POST", { jobId });
  }

  /**
   * Searches for bulk verification jobs with filters
   * @param query Search query parameters
   * @returns Paginated search results
   */
  async searchJobs(query?: JobSearchQuery): Promise<{
    totalResults: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
    jobs: BulkJobStatus[];
  }> {
    return this.makeRequest("/jobs/search", "GET", query);
  }
}
