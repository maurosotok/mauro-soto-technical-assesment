import { useCallback, useEffect, useRef, useState } from "react";
import {
  calculate,
  CalculatorApiError,
  type Operation,
} from "./api/calculator";

export interface CalculationHistory {
  left: string;
  operator: Operation;
  right: string;
}

export function useCalculator() {
  const [display, setDisplay] = useState("0");
  const [leftOperand, setLeftOperand] = useState<string | null>(null);
  const [operator, setOperator] = useState<Operation | null>(null);
  const [isWaitingForOperand, setIsWaitingForOperand] = useState(false);
  const [isResult, setIsResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<CalculationHistory | null>(null);
  const requestVersion = useRef(0);
  const activeRequest = useRef<AbortController | null>(null);

  useEffect(() => () => activeRequest.current?.abort(), []);

  const clear = useCallback(() => {
    requestVersion.current += 1;
    activeRequest.current?.abort();
    activeRequest.current = null;
    setDisplay("0");
    setLeftOperand(null);
    setOperator(null);
    setIsWaitingForOperand(false);
    setIsResult(false);
    setIsLoading(false);
    setError(null);
    setHistory(null);
  }, []);

  const inputDigit = useCallback(
    (digit: string) => {
      if (isLoading) return;
      setError(null);
      setHistory(null);
      if (isWaitingForOperand || isResult) {
        setDisplay(digit);
        setIsWaitingForOperand(false);
        setIsResult(false);
        if (isResult) {
          setLeftOperand(null);
          setOperator(null);
        }
        return;
      }
      setDisplay((current) => (current === "0" ? digit : current + digit));
    },
    [isLoading, isResult, isWaitingForOperand],
  );

  const inputDecimal = useCallback(() => {
    if (isLoading) return;
    setError(null);
    setHistory(null);
    if (isWaitingForOperand || isResult) {
      setDisplay("0.");
      setIsWaitingForOperand(false);
      setIsResult(false);
      if (isResult) {
        setLeftOperand(null);
        setOperator(null);
      }
      return;
    }
    setDisplay((current) => (current.includes(".") ? current : current + "."));
  }, [isLoading, isResult, isWaitingForOperand]);

  const selectOperator = useCallback(
    (nextOperator: Operation) => {
      if (isLoading) return;
      setError(null);
      setHistory(null);
      setLeftOperand(display);
      setOperator(nextOperator);
      setIsWaitingForOperand(true);
      setIsResult(false);
    },
    [display, isLoading],
  );

  const backspace = useCallback(() => {
    if (isLoading || isWaitingForOperand) return;
    setError(null);
    setHistory(null);
    if (isResult) {
      setDisplay("0");
      setLeftOperand(null);
      setOperator(null);
      setIsResult(false);
      return;
    }
    setDisplay((current) =>
      current.length <= 1 ? "0" : current.slice(0, -1),
    );
  }, [isLoading, isResult, isWaitingForOperand]);

  const evaluate = useCallback(async () => {
    if (
      isLoading ||
      isWaitingForOperand ||
      leftOperand === null ||
      operator === null
    ) {
      return;
    }

    const rightOperand = display;
    const version = requestVersion.current + 1;
    requestVersion.current = version;
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;

    setError(null);
    setHistory({ left: leftOperand, operator, right: rightOperand });
    setIsLoading(true);

    try {
      const response = await calculate(
        {
          left: Number(leftOperand),
          operator,
          right: Number(rightOperand),
        },
        controller.signal,
      );
      if (requestVersion.current !== version) return;

      setDisplay(String(response.result));
      setLeftOperand(null);
      setOperator(null);
      setIsWaitingForOperand(false);
      setIsResult(true);
    } catch (caught) {
      if (requestVersion.current !== version) return;
      if (caught instanceof DOMException && caught.name === "AbortError") return;

      if (
        caught instanceof CalculatorApiError &&
        caught.code === "division_by_zero"
      ) {
        setError("Cannot divide by zero.");
      } else if (caught instanceof CalculatorApiError) {
        setError(caught.message);
      } else {
        setError("Unable to reach the calculator service. Please try again.");
      }
    } finally {
      if (requestVersion.current === version) {
        setIsLoading(false);
        activeRequest.current = null;
      }
    }
  }, [display, isLoading, isWaitingForOperand, leftOperand, operator]);

  return {
    display,
    leftOperand,
    operator,
    isWaitingForOperand,
    isLoading,
    error,
    history,
    inputDigit,
    inputDecimal,
    selectOperator,
    backspace,
    clear,
    evaluate,
  };
}
