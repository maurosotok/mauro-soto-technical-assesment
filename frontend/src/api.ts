export type BinaryOperation = "add" | "subtract" | "multiply" | "divide" | "power";
export type UnaryOperation = "square_root";
export type Operation = BinaryOperation | UnaryOperation;

export type CalculateRequest =
  | { left: number; operator: BinaryOperation; right: number }
  | { left: number; operator: UnaryOperation };

export interface CalculateResponse {
  result: number;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export async function calculate(request: CalculateRequest): Promise<CalculateResponse> {
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}/api/v1/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    throw new Error("Calculator service is unavailable. Please try again.");
  }

  const body = (await response.json().catch(() => null)) as CalculateResponse | ApiErrorResponse | null;
  if (!response.ok) {
    if (body && "error" in body && typeof body.error.message === "string") {
      throw new Error(body.error.message);
    }
    if (response.status >= 500) {
      throw new Error("Calculator service is unavailable. Please try again.");
    }
    throw new Error("The calculator could not complete that request.");
  }
  if (!body || !("result" in body) || typeof body.result !== "number") {
    throw new Error("The calculator returned an invalid response.");
  }
  return body;
}