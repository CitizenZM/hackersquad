export interface JobStep {
  name: string;
  status: "pending" | "running" | "complete" | "error";
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  log: string[];
}

export interface JobState {
  id: string;
  projectId: string;
  status: "pending" | "running" | "complete" | "error";
  progress: number;
  currentStep: string | null;
  steps: JobStep[];
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface JobEvent {
  type: "progress" | "step_update" | "complete" | "error" | "log";
  jobId: string;
  data: Partial<JobState> & { message?: string };
}

type Listener = (event: JobEvent) => void;

class JobManager {
  private jobs = new Map<string, JobState>();
  private listeners = new Map<string, Set<Listener>>();

  createJob(id: string, projectId: string, stepNames: string[]): JobState {
    const job: JobState = {
      id,
      projectId,
      status: "pending",
      progress: 0,
      currentStep: null,
      steps: stepNames.map((name) => ({
        name,
        status: "pending",
        progress: 0,
        log: [],
      })),
    };
    this.jobs.set(id, job);
    return job;
  }

  getJob(id: string): JobState | undefined {
    return this.jobs.get(id);
  }

  getJobByProject(projectId: string): JobState | undefined {
    for (const job of this.jobs.values()) {
      if (job.projectId === projectId && (job.status === "running" || job.status === "pending")) {
        return job;
      }
    }
    return undefined;
  }

  startJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    job.status = "running";
    job.startedAt = new Date();
    this.emit(jobId, { type: "progress", jobId, data: { status: "running", progress: 0 } });
  }

  startStep(jobId: string, stepName: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    const step = job.steps.find((s) => s.name === stepName);
    if (step) {
      step.status = "running";
      step.startedAt = new Date();
    }
    job.currentStep = stepName;
    this.emit(jobId, {
      type: "step_update",
      jobId,
      data: { currentStep: stepName, steps: job.steps },
    });
  }

  updateStepProgress(jobId: string, stepName: string, progress: number, message?: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    const step = job.steps.find((s) => s.name === stepName);
    if (step) {
      step.progress = progress;
      if (message) step.log.push(message);
    }
    const totalSteps = job.steps.length;
    const completedSteps = job.steps.filter((s) => s.status === "complete").length;
    const currentProgress = step ? step.progress / 100 : 0;
    job.progress = Math.round(((completedSteps + currentProgress) / totalSteps) * 100);

    this.emit(jobId, {
      type: "progress",
      jobId,
      data: { progress: job.progress, steps: job.steps, message },
    });
  }

  completeStep(jobId: string, stepName: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    const step = job.steps.find((s) => s.name === stepName);
    if (step) {
      step.status = "complete";
      step.progress = 100;
      step.completedAt = new Date();
    }
    const totalSteps = job.steps.length;
    const completedSteps = job.steps.filter((s) => s.status === "complete").length;
    job.progress = Math.round((completedSteps / totalSteps) * 100);

    this.emit(jobId, {
      type: "step_update",
      jobId,
      data: { progress: job.progress, steps: job.steps },
    });
  }

  failStep(jobId: string, stepName: string, error: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    const step = job.steps.find((s) => s.name === stepName);
    if (step) {
      step.status = "error";
      step.error = error;
      step.completedAt = new Date();
      step.log.push(`Error: ${error}`);
    }
    this.emit(jobId, {
      type: "step_update",
      jobId,
      data: { steps: job.steps, message: `Step "${stepName}" failed: ${error}` },
    });
  }

  completeJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    job.status = "complete";
    job.progress = 100;
    job.completedAt = new Date();
    this.emit(jobId, { type: "complete", jobId, data: { status: "complete", progress: 100 } });
  }

  failJob(jobId: string, error: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    job.status = "error";
    job.error = error;
    job.completedAt = new Date();
    this.emit(jobId, { type: "error", jobId, data: { status: "error", error } });
  }

  subscribe(jobId: string, listener: Listener): () => void {
    if (!this.listeners.has(jobId)) {
      this.listeners.set(jobId, new Set());
    }
    this.listeners.get(jobId)!.add(listener);
    return () => {
      this.listeners.get(jobId)?.delete(listener);
    };
  }

  private emit(jobId: string, event: JobEvent) {
    this.listeners.get(jobId)?.forEach((listener) => {
      try {
        listener(event);
      } catch {
        // listener error, ignore
      }
    });
  }
}

const globalForJobs = globalThis as unknown as { jobManager: JobManager };
export const jobManager = globalForJobs.jobManager || new JobManager();
if (process.env.NODE_ENV !== "production") globalForJobs.jobManager = jobManager;
