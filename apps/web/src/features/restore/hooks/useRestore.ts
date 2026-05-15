import { useState, useRef } from "react";
import apiClient from "@/shared/lib/api-client";
import type {
  RestoreState,
  DryRunResult,
  RestoreJob,
  RestoreDto,
  RestoreExecuteResult,
} from "../types";

interface UseRestoreReturn {
  state: RestoreState;
  dryRunResult: DryRunResult | null;
  restoreJob: RestoreJob | null;
  finalStatus: RestoreJob["status"] | null;
  isLoading: boolean;
  error: string | null;
  executeDryRun: (dto: RestoreDto) => Promise<void>;
  confirmRestore: (dto: RestoreDto) => Promise<void>;
  setDone: (finalStatus: RestoreJob["status"]) => void;
  reset: () => void;
}

export function useRestore(): UseRestoreReturn {
  const [state, setState] = useState<RestoreState>("idle");
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);
  const [restoreJob, setRestoreJob] = useState<RestoreJob | null>(null);
  const [finalStatus, setFinalStatus] = useState<RestoreJob["status"] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function reset() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setState("idle");
    setDryRunResult(null);
    setRestoreJob(null);
    setFinalStatus(null);
    setIsLoading(false);
    setError(null);
  }

  async function executeDryRun(dto: RestoreDto) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<RestoreExecuteResult>("/restores", {
        ...dto,
        isDryRun: true,
      });

      if (response.data.dryRunResult) {
        setDryRunResult(response.data.dryRunResult);
      }

      setState("dry-run");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error ejecutando dry run";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function confirmRestore(dto: RestoreDto) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<RestoreExecuteResult>("/restores", {
        ...dto,
        isDryRun: false,
      });

      const job: RestoreJob = {
        id: response.data.jobId,
        status: "running",
        createdAt: new Date().toISOString(),
      };

      setRestoreJob(job);
      setState("running");

      // Start polling for job status
      pollRef.current = setInterval(async () => {
        try {
          const { data } = await apiClient.get<RestoreJob>(
            `/restores/${job.id}`,
          );

          if (data.status === "completed") {
            setFinalStatus("completed");
            setState("done");
            clearInterval(pollRef.current!);
            pollRef.current = null;
          } else if (data.status === "failed") {
            setFinalStatus("failed");
            setError(data.errorMessage ?? "Error desconocido");
            setState("done");
            clearInterval(pollRef.current!);
            pollRef.current = null;
          }
        } catch {
          // Ignore polling errors, keep trying
        }
      }, 1000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error ejecutando restore";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  function setDone(status: RestoreJob["status"]) {
    setFinalStatus(status);
    setState("done");
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  return {
    state,
    dryRunResult,
    restoreJob,
    finalStatus,
    isLoading,
    error,
    executeDryRun,
    confirmRestore,
    setDone,
    reset,
  };
}
