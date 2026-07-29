import { afterEach, describe, expect, it, vi } from "vitest";
import {
  calculate,
  type CalculateRequest,
} from "./calculator";

const request: CalculateRequest = {
  left: 8,
  operator: "divide",
  right: 2,
};

describe("calculate API client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts a typed request and returns the result", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ result: 4 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(calculate(request)).resolves.toEqual({ result: 4 });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/calculate",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      }),
    );
  });

  it("throws the backend's structured error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: vi.fn().mockResolvedValue({
          error: {
            code: "division_by_zero",
            message: "right operand must not be zero when dividing",
          },
        }),
      }),
    );

    await expect(calculate(request)).rejects.toMatchObject({
      name: "CalculatorApiError",
      code: "division_by_zero",
      status: 422,
    });
  });

  it("uses a fallback when an error response is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: vi.fn().mockRejectedValue(new SyntaxError("not JSON")),
      }),
    );

    await expect(calculate(request)).rejects.toMatchObject({
      code: "request_failed",
      status: 502,
      message: "The calculation could not be completed.",
    });
  });
});
