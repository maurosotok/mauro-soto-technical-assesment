export type Operation = "add" | "subtract" | "multiply" | "divide";

export interface CalculateRequest {
  left: number;
  operator: Operation;
  right: number;
}

export interface CalculateResponse {
  result: number;
}

interface ErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}

export class CalculatorApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "CalculatorApiError";
  }
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export async function calculate(
  request: CalculateRequest,
  signal?: AbortSignal,
): Promise<CalculateResponse> {
  const response = await fetch(`${apiBaseUrl}/api/v1/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    let details: ErrorResponse = {};
    try {
      details = (await response.json()) as ErrorResponse;
    } catch {
      // Preserve a useful fallback when an upstream response is not JSON.
    }

    throw new CalculatorApiError(
      details.error?.code ?? "request_failed",
      response.status,
      details.error?.message ?? "The calculation could not be completed.",
    );
  }

  return (await response.json()) as CalculateResponse;
}
