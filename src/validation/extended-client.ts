import { HappyEmailClient } from "../client";
import { NeverBounceBulkVerification } from "./neverbounce-bulk-verification";
import type {
  BulkJobRequest,
  BulkJobResponse,
  BulkJobStatus,
  BulkJobResults,
  JobResultsQuery,
  JobSearchQuery,
} from "./neverbounce-bulk-verification";

export class ExtendedHappyEmailClient extends HappyEmailClient {
  private bulkClient: NeverBounceBulkVerification | null = null;

  constructor(options: { neverBounceApiKey?: string } = {}) {
    super(options);
    if (options.neverBounceApiKey) {
      this.bulkClient = new NeverBounceBulkVerification(options.neverBounceApiKey);
    }
  }

  private ensureBulkClient(): void {
    if (!this.bulkClient) {
      throw new Error("NeverBounce API key is required for bulk operations");
    }
  }

  async createBulkJob(request: BulkJobRequest): Promise<BulkJobResponse> {
    this.ensureBulkClient();
    return this.bulkClient!.createBulkJob(request);
  }

  async listJobs(): Promise<BulkJobStatus[]> {
    this.ensureBulkClient();
    return this.bulkClient!.listJobs();
  }

  async getJobStatus(jobId: string): Promise<BulkJobStatus> {
    this.ensureBulkClient();
    return this.bulkClient!.getJobStatus(jobId);
  }

  async getJobResults(jobId: string, query?: JobResultsQuery): Promise<BulkJobResults> {
    this.ensureBulkClient();
    return this.bulkClient!.getJobResults(jobId, query);
  }

  async downloadJobResults(jobId: string, query?: JobResultsQuery): Promise<Buffer> {
    this.ensureBulkClient();
    return this.bulkClient!.downloadJobResults(jobId, query);
  }

  async deleteJob(jobId: string): Promise<{ status: string }> {
    this.ensureBulkClient();
    return this.bulkClient!.deleteJob(jobId);
  }

  async searchJobs(query?: JobSearchQuery): Promise<{
    totalResults: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
    jobs: BulkJobStatus[];
  }> {
    this.ensureBulkClient();
    return this.bulkClient!.searchJobs(query);
  }
}
