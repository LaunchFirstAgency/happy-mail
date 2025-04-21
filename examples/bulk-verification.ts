import { HappyEmailClient, InputLocationType } from "../src";

async function bulkVerificationExample() {
  // Create a client with NeverBounce API key
  const client = new HappyEmailClient({
    neverBounceApiKey: process.env.NEVER_BOUNCE_API_KEY,
  });

  try {
    // Example 1: Create a bulk job with a list of emails
    console.log("\n--- Creating Bulk Job with Email List ---");
    const emails = [
      { uid: "1", email: "user1@example.com" },
      { uid: "2", email: "user2@example.com" },
      { uid: "3", email: "user3@example.com" },
    ];

    const job = await client.createBulkJob({
      input: emails,
      inputLocation: InputLocationType.SUPPLIED,
      autoParse: true,
      autoStart: true,
      runSample: false,
    });

    console.log("Job created:", job);

    // Example 2: Create a bulk job with a remote URL
    console.log("\n--- Creating Bulk Job with Remote URL ---");
    const remoteJob = await client.createBulkJob({
      input: "https://example.com/emails.csv",
      inputLocation: InputLocationType.REMOTE_URL,
      filename: "emails.csv",
      autoParse: true,
      autoStart: true,
      runSample: false,
    });
    console.log("Remote job created:", remoteJob);

    // Example 3: Check job status
    console.log("\n--- Checking Job Status ---");
    const status = await client.getJobStatus(job.jobId);
    console.log("Job status:", status);

    // Example 4: Get job results (if complete)
    if (status.jobStatus === "complete") {
      console.log("\n--- Getting Job Results ---");
      const results = await client.getJobResults(job.jobId);
      console.log("Results:", results);

      // Example 5: Download results
      console.log("\n--- Downloading Results ---");
      const download = await client.downloadJobResults(job.jobId);
      console.log("Downloaded results size:", download.length, "bytes");
    }

    // Example 6: List all jobs
    console.log("\n--- Listing All Jobs ---");
    const jobs = await client.listJobs();
    console.log("Total jobs:", jobs.length);

    // Example 7: Search jobs with filters
    console.log("\n--- Searching Jobs ---");
    const searchResults = await client.searchJobs({
      completed: true,
      itemsPerPage: 10,
      page: 1,
    });
    console.log("Search results:", searchResults);

    // Example 8: Delete a job
    console.log("\n--- Deleting Job ---");
    const deleteResult = await client.deleteJob(job.jobId);
    console.log("Delete result:", deleteResult);

    // Example 9: Direct access to bulk verification service
    console.log("\n--- Using Bulk Verification Service Directly ---");
    const bulkService = client.getBulkVerification();
    if (bulkService) {
      const directResults = await bulkService.getJobResults(job.jobId);
      console.log("Direct results:", directResults);
    }
  } catch (error) {
    console.error("Error in bulk verification example:", error);
  }
}

// Run the example
if (process.env.NEVER_BOUNCE_API_KEY) {
  bulkVerificationExample();
} else {
  console.log("Please set NEVER_BOUNCE_API_KEY environment variable to run this example");
}
