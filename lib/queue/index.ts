/**
 * Job Queue
 * In-memory job queue for media processing.
 * For production, replace with BullMQ + Redis.
 */

import { v4 as uuidv4 } from 'uuid';

export type JobStatus =
  | 'queued'
  | 'analyzing'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'expired';

export interface JobData {
  url: string;
  formatId: string;
  platform: string;
  ipAddress: string;
}

export interface Job {
  id: string;
  status: JobStatus;
  data: JobData;
  progress: number;      // 0-100
  speed?: string;
  eta?: string;
  statusText?: string;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  error?: string;
  result?: {
    downloadId: string;
    filename: string;
    mimeType: string;
    filesize?: number;
    /** Local scratch path for direct browser downloads; never expose via the job API. */
    localPath?: string;
  };
}

// In-memory store (replace with Redis for production)
const jobs = new Map<string, Job>();

const JOB_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
const JOB_TIMEOUT_MS = 5 * 60 * 1000;  // 5 minute processing timeout

/**
 * Create a new job.
 */
export function createJob(data: JobData): Job {
  const id = uuidv4();
  const now = Date.now();
  const job: Job = {
    id,
    status: 'queued',
    data,
    progress: 0,
    createdAt: now,
    updatedAt: now,
    expiresAt: now + JOB_EXPIRY_MS,
  };
  jobs.set(id, job);
  return job;
}

/**
 * Get a job by ID.
 */
export function getJob(id: string): Job | null {
  const job = jobs.get(id);
  if (!job) return null;

  // Check expiry
  if (Date.now() > job.expiresAt && job.status === 'completed') {
    job.status = 'expired';
    jobs.set(id, job);
  }

  return job;
}

/**
 * Update job status and progress.
 */
export function updateJob(
  id: string,
  updates: Partial<Pick<Job, 'status' | 'progress' | 'error' | 'result' | 'speed' | 'eta' | 'statusText'>>
): Job | null {
  const job = jobs.get(id);
  if (!job) return null;

  Object.assign(job, updates, { updatedAt: Date.now() });
  jobs.set(id, job);
  return job;
}

/**
 * Clean up expired jobs.
 */
export function cleanupExpiredJobs(): number {
  const now = Date.now();
  let cleaned = 0;
  for (const [id, job] of jobs.entries()) {
    if (now > job.expiresAt + JOB_EXPIRY_MS) {
      jobs.delete(id);
      cleaned++;
    }
  }
  return cleaned;
}

/**
 * Count active jobs for an IP.
 */
export function countActiveJobsForIP(ip: string): number {
  let count = 0;
  for (const job of jobs.values()) {
    if (
      job.data.ipAddress === ip &&
      (job.status === 'queued' || job.status === 'analyzing' || job.status === 'processing')
    ) {
      count++;
    }
  }
  return count;
}

export { JOB_TIMEOUT_MS };
