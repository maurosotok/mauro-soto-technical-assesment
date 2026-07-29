import { useCallback, useEffect, useRef, useState } from "react";
import { calculate, type Operation } from "./api";
import "./styles.css";

const operationLabels: Record<Operation, string> = {
  add: "+",
  subtract: "−",
  multiply: "×",
  divide: "÷",
};

const operationKeys: Record<string, Operation> = {
  "+": "add",
  "-": "subtract",
  "*": "multiply",
  "/": "divide",
};

export function App() {
  const [display, setDisplay] = useState("0");
  const [leftOperand, setLeftOperand] = useState<string | null>(null);
  const [operation, setOperation] = useState<Operation | null>(null);
  const [replaceDisplay, setReplaceDisplay] = useState(false);
  const [resultShown, setResultShown] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const calculatorRef = useRef<HTMLElement>(null);

  const clear = useCallback(() => {
    setDisplay("0");
    setLeftOperand(null);
    setOperation(null);
    setReplaceDisplay(false);
    setResultShown(false);
    setError("");
  }, []);

  const enterDigit = useCallback(
    (digit: string) => {
      if (loading) return;
      setError("");
      setDisplay((current) => {
        if (replaceDisplay || resultShown) return digit;
        return current === "0" ? digit : current + digit;
      });
      if (replaceDisplay || resultShown) {
        setReplaceDisplay(false);
        setResultShown(false);
        if (resultShown) {
          setLeftOperand(null);
          setOperation(null);
        }
      }
    },
    [loading, replaceDisplay, resultShown],
  );

  const enterDecimal = useCallback(() => {
    if (loading) return;
    setError("");
    setDisplay((current) =>
      replaceDisplay || resultShown
        ? "0."
        : current.includes(".")
          ? current
          : current + ".",
    );
    if (replaceDisplay || resultShown) {
      setReplaceDisplay(false);
      setResultShown(false);
      if (resultShown) {
        setLeftOperand(null);
        setOperation(null);
      }
    }
  }, [loading, replaceDisplay, resultShown]);

  const chooseOperation = useCallback(
    (nextOperation: Operation) => {
      if (loading) return;
      setError("");
      setLeftOperand(display);
      setOperation(nextOperation);
      setReplaceDisplay(true);
      setResultShown(false);
    },
    [display, loading],
  );

  const backspace = useCallback(() => {
    if (loading) return;
    setError("");
    if (replaceDisplay || resultShown) return;
    setDisplay((current) => (current.length <= 1 ? "0" : current.slice(0, -1)));
  }, [loading, replaceDisplay, resultShown]);

  const submit = useCallback(async () => {
    if (loading || leftOperand === null || operation === null) return;
    setLoading(true);
    setError("");
    try {
      const response = await calculate({
        left: Number(leftOperand),
        operator: operation,
        right: Number(display),
      });
      setDisplay(String(response.result));
      setLeftOperand(null);
      setOperation(null);
      setReplaceDisplay(true);
      setResultShown(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The calculator could not complete that request.",
      );
    } finally {
      setLoading(false);
    }
  }, [display, leftOperand, loading, operation]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (/^[0-9]$/.test(event.key)) enterDigit(event.key);
      else if (event.key === ".") enterDecimal();
      else if (event.key in operationKeys)
        chooseOperation(operationKeys[event.key]);
      else if (event.key === "Enter" || event.key === "=") void submit();
      else if (event.key === "Backspace") backspace();
      else if (event.key === "Escape" || event.key.toLowerCase() === "c")
        clear();
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [backspace, chooseOperation, clear, enterDecimal, enterDigit, submit]);

  useEffect(() => {
    calculatorRef.current?.focus();
  }, []);

  const expression =
    leftOperand !== null && operation
      ? `${leftOperand} ${operationLabels[operation]}`
      : "Ready";

  return (
    <main className="page-shell">
      <section
        className="calculator"
        ref={calculatorRef}
        tabIndex={-1}
        aria-label="Calculator"
      >
        <header>
          <p className="eyebrow">Backend-powered</p>
          <h1>Calculator</h1>
        </header>
        <div className="screen" aria-live="polite" aria-busy={loading}>
          <span className="expression">{expression}</span>
          <output data-testid="display">
            {loading ? "Calculating…" : display}
          </output>
        </div>
        <p className="error" role="alert">
          {error}
        </p>
        <div className="keypad">
          <button className="utility span-two" onClick={clear}>
            Clear
          </button>
          <button
            className="utility"
            aria-label="Backspace"
            onClick={backspace}
          >
            ⌫
          </button>
          <button
            className="operator"
            aria-label="Divide"
            onClick={() => chooseOperation("divide")}
          >
            ÷
          </button>
          {["7", "8", "9"].map((digit) => (
            <button key={digit} onClick={() => enterDigit(digit)}>
              {digit}
            </button>
          ))}
          <button
            className="operator"
            aria-label="Multiply"
            onClick={() => chooseOperation("multiply")}
          >
            ×
          </button>
          {["4", "5", "6"].map((digit) => (
            <button key={digit} onClick={() => enterDigit(digit)}>
              {digit}
            </button>
          ))}
          <button
            className="operator"
            aria-label="Subtract"
            onClick={() => chooseOperation("subtract")}
          >
            −
          </button>
          {["1", "2", "3"].map((digit) => (
            <button key={digit} onClick={() => enterDigit(digit)}>
              {digit}
            </button>
          ))}
          <button
            className="operator"
            aria-label="Add"
            onClick={() => chooseOperation("add")}
          >
            +
          </button>
          <button className="span-two" onClick={() => enterDigit("0")}>
            0
          </button>
          <button onClick={enterDecimal}>.</button>
          <button
            className="equals"
            aria-label="Equals"
            disabled={loading}
            onClick={() => void submit()}
          >
            =
          </button>
        </div>
        <p className="hint">
          Keyboard: 0–9, +, −, ×, ÷, Enter, Backspace, Escape
        </p>
      </section>
    </main>
  );
}
