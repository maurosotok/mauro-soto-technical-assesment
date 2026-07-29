import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { calculate, CalculatorApiError } from "./api/calculator";

vi.mock("./api/calculator", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api/calculator")>();
  return { ...actual, calculate: vi.fn() };
});

const mockedCalculate = vi.mocked(calculate);

describe("Calculator", () => {
  beforeEach(() => {
    mockedCalculate.mockReset();
  });

  it("enters digits and one decimal point", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "1" }));
    await user.click(screen.getByRole("button", { name: "2" }));
    await user.click(screen.getByRole("button", { name: "Decimal point" }));
    await user.click(screen.getByRole("button", { name: "3" }));
    await user.click(screen.getByRole("button", { name: "Decimal point" }));

    expect(screen.getByLabelText("Calculator display")).toHaveTextContent("12.3");
  });

  it("calls the API, displays its result, and starts fresh", async () => {
    const user = userEvent.setup();
    mockedCalculate.mockResolvedValue({ result: 3.75 });
    render(<App />);

    for (const name of ["1", "Decimal point", "2", "5"]) {
      await user.click(screen.getByRole("button", { name }));
    }
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByRole("button", { name: "Add" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    for (const name of ["2", "Decimal point", "5"]) {
      await user.click(screen.getByRole("button", { name }));
    }
    await user.click(screen.getByRole("button", { name: "Equals" }));

    await waitFor(() =>
      expect(mockedCalculate).toHaveBeenCalledWith(
        { left: 1.25, operator: "add", right: 2.5 },
        expect.any(AbortSignal),
      ),
    );
    const display = screen.getByLabelText("Calculator display");
    expect(display).toHaveTextContent("3.75");
    expect(display).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "7" }));
    expect(display).toHaveTextContent("7");
  });

  it("shows division-by-zero feedback returned by the API", async () => {
    const user = userEvent.setup();
    mockedCalculate.mockRejectedValue(
      new CalculatorApiError(
        "division_by_zero",
        422,
        "right operand must not be zero when dividing",
      ),
    );
    render(<App />);

    await user.click(screen.getByRole("button", { name: "9" }));
    await user.click(screen.getByRole("button", { name: "Divide" }));
    await user.click(screen.getByRole("button", { name: "0" }));
    await user.click(screen.getByRole("button", { name: "Equals" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Cannot divide by zero.",
    );
  });

  it("announces loading and keeps clear available", async () => {
    const user = userEvent.setup();
    let resolveRequest!: (value: { result: number }) => void;
    mockedCalculate.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );
    render(<App />);

    await user.click(screen.getByRole("button", { name: "2" }));
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: "3" }));
    await user.click(screen.getByRole("button", { name: "Equals" }));

    expect(screen.getByText("Calculating with the server…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Clear all" })).toBeEnabled();

    await act(async () => {
      resolveRequest({ result: 5 });
    });
    expect(screen.getByLabelText("Calculator display")).toHaveTextContent("5");
  });

  it("shows a network failure and allows clearing", async () => {
    const user = userEvent.setup();
    mockedCalculate.mockRejectedValue(new TypeError("Failed to fetch"));
    render(<App />);

    await user.click(screen.getByRole("button", { name: "8" }));
    await user.click(screen.getByRole("button", { name: "Multiply" }));
    await user.click(screen.getByRole("button", { name: "4" }));
    await user.click(screen.getByRole("button", { name: "Equals" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to reach the calculator service. Please try again.",
    );
    await user.click(screen.getByRole("button", { name: "Clear all" }));
    expect(screen.getByLabelText("Calculator display")).toHaveTextContent("0");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("supports keyboard entry and a negative server result", async () => {
    mockedCalculate.mockResolvedValue({ result: -2 });
    render(<App />);
    const calculator = screen.getByRole("region", { name: "Calculator" });

    fireEvent.keyDown(calculator, { key: "4" });
    fireEvent.keyDown(calculator, { key: "-" });
    fireEvent.keyDown(calculator, { key: "6" });
    fireEvent.keyDown(calculator, { key: "Enter" });

    await waitFor(() =>
      expect(mockedCalculate).toHaveBeenCalledWith(
        { left: 4, operator: "subtract", right: 6 },
        expect.any(AbortSignal),
      ),
    );
    expect(screen.getByLabelText("Calculator display")).toHaveTextContent("-2");
  });
});
