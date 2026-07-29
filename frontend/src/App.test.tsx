import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

const jsonResponse = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

describe("App", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it.each([
    { left: "1.5", operator: "Add", right: "2.25", operation: "add", result: 3.75 },
    { left: "2", operator: "Subtract", right: "5", operation: "subtract", result: -3 },
    { left: "2.5", operator: "Multiply", right: "4", operation: "multiply", result: 10 },
    { left: "7.5", operator: "Divide", right: "2.5", operation: "divide", result: 3 },
    { left: "2", operator: "Exponentiate", right: "3", operation: "power", result: 8 },
  ])("submits $operation to the backend and displays its result", async ({ left, operator, right, operation, result }) => {
    vi.mocked(fetch).mockReturnValueOnce(jsonResponse({ result }));
    const user = userEvent.setup();
    render(<App />);

    await user.keyboard(left);
    await user.click(screen.getByRole("button", { name: operator }));
    await user.keyboard(right);
    await user.click(screen.getByRole("button", { name: "Equals" }));

    expect(await screen.findByTestId("display")).toHaveTextContent(String(result));
    expect(fetch).toHaveBeenCalledWith("/api/v1/calculate", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ left: Number(left), operator: operation, right: Number(right) }),
    }));
  });

  it("submits square root as a unary operation", async () => {
    vi.mocked(fetch).mockReturnValueOnce(jsonResponse({ result: 3 }));
    const user = userEvent.setup();
    render(<App />);

    await user.keyboard("9");
    await user.click(screen.getByRole("button", { name: "Square root" }));

    expect(await screen.findByTestId("display")).toHaveTextContent("3");
    expect(fetch).toHaveBeenCalledWith("/api/v1/calculate", expect.objectContaining({
      body: JSON.stringify({ left: 9, operator: "square_root" }),
    }));
  });

  it("shows the backend error for a negative square root", async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(jsonResponse({ result: -3 }))
      .mockReturnValueOnce(jsonResponse({ error: { code: "negative_square_root", message: "left operand must not be negative for square_root" } }, 422));
    const user = userEvent.setup();
    render(<App />);

    await user.keyboard("2-5{Enter}");
    await waitFor(() => expect(screen.getByTestId("display")).toHaveTextContent("-3"));
    await user.click(screen.getByRole("button", { name: "Square root" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("left operand must not be negative for square_root");
    expect(vi.mocked(fetch).mock.calls[1][1]?.body).toBe(JSON.stringify({ left: -3, operator: "square_root" }));
  });
  it("shows the backend division-by-zero message", async () => {
    vi.mocked(fetch).mockReturnValueOnce(jsonResponse({ error: { code: "division_by_zero", message: "right operand must not be zero when dividing" } }, 422));
    const user = userEvent.setup();
    render(<App />);
    await user.keyboard("1/0{Enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent("right operand must not be zero when dividing");
  });

  it("supports clear, backspace, and keyboard input", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.keyboard("123{Backspace}");
    expect(screen.getByTestId("display")).toHaveTextContent("12");
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByTestId("display")).toHaveTextContent("0");
    await user.keyboard("4.5");
    expect(screen.getByTestId("display")).toHaveTextContent("4.5");
  });

  it("starts a second calculation from the backend result", async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(jsonResponse({ result: 5 }))
      .mockReturnValueOnce(jsonResponse({ result: 10 }));
    const user = userEvent.setup();
    render(<App />);
    await user.keyboard("2+3{Enter}");
    await waitFor(() => expect(screen.getByTestId("display")).toHaveTextContent("5"));
    await user.keyboard("*2{Enter}");
    expect(await screen.findByTestId("display")).toHaveTextContent("10");
    expect(vi.mocked(fetch).mock.calls[1][1]?.body).toBe(JSON.stringify({ left: 5, operator: "multiply", right: 2 }));
  });

  it("reports an unavailable backend and preserves the entered expression", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("proxy failure", { status: 500 }));
    const user = userEvent.setup();
    render(<App />);
    await user.keyboard("8+2{Enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent("Calculator service is unavailable. Please try again.");
    expect(screen.getByTestId("display")).toHaveTextContent("2");
  });

  it("shows loading state and prevents duplicate submissions", async () => {
    let resolveResponse!: (response: Response) => void;
    vi.mocked(fetch).mockReturnValueOnce(new Promise((resolve) => { resolveResponse = resolve; }));
    const user = userEvent.setup();
    render(<App />);
    await user.keyboard("9-4{Enter}");
    expect(screen.getByTestId("display")).toHaveTextContent("Calculating…");
    expect(screen.getByRole("button", { name: "Equals" })).toBeDisabled();
    await user.keyboard("{Enter}");
    expect(fetch).toHaveBeenCalledTimes(1);
    resolveResponse(new Response(JSON.stringify({ result: 5 }), { status: 200 }));
    await waitFor(() => expect(screen.getByTestId("display")).toHaveTextContent("5"));
  });
});