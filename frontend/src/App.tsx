import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type KeyboardEvent,
} from "react";
import type { Operation } from "./api/calculator";
import { useCalculator } from "./useCalculator";
import "./styles.css";

const OPERATIONS: ReadonlyArray<{
  operation: Operation;
  symbol: string;
  label: string;
  key: string;
}> = [
  { operation: "divide", symbol: "÷", label: "Divide", key: "/" },
  { operation: "multiply", symbol: "×", label: "Multiply", key: "*" },
  { operation: "subtract", symbol: "−", label: "Subtract", key: "-" },
  { operation: "add", symbol: "+", label: "Add", key: "+" },
];

const DIGITS = ["7", "8", "9", "4", "5", "6", "1", "2", "3"] as const;

export function App() {
  const {
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
  } = useCalculator();
  const calculatorRef = useRef<HTMLElement>(null);
  const displayRef = useRef<HTMLOutputElement>(null);

  useEffect(() => {
    calculatorRef.current?.focus();
  }, []);

  const operationSymbols = useMemo(
    () =>
      Object.fromEntries(
        OPERATIONS.map(({ operation, symbol }) => [operation, symbol]),
      ) as Record<Operation, string>,
    [],
  );

  const expression = history
    ? `${history.left} ${operationSymbols[history.operator]} ${history.right} =`
    : leftOperand && operator
      ? `${leftOperand} ${operationSymbols[operator]}`
      : "Server-calculated";

  const requestResult = useCallback(async () => {
    await evaluate();
    displayRef.current?.focus();
  }, [evaluate]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (
      event.target instanceof HTMLButtonElement &&
      (event.key === "Enter" || event.key === " ")
    ) {
      return;
    }

    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      inputDigit(event.key);
      return;
    }
    if (event.key === ".") {
      event.preventDefault();
      inputDecimal();
      return;
    }

    const selectedOperation = OPERATIONS.find(
      ({ key }) => key === event.key,
    );
    if (selectedOperation) {
      event.preventDefault();
      selectOperator(selectedOperation.operation);
      return;
    }

    switch (event.key) {
      case "Enter":
      case "=":
        event.preventDefault();
        void requestResult();
        break;
      case "Backspace":
        event.preventDefault();
        backspace();
        break;
      case "Delete":
      case "Escape":
        event.preventDefault();
        clear();
        break;
    }
  };

  return (
    <main className="app-shell">
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">Full-stack calculator</p>
        <h1 id="page-title">Calculate with confidence.</h1>
        <p>
          Every result is verified by the Go service, keeping one clear source
          of truth.
        </p>
      </section>

      <section
        ref={calculatorRef}
        className="calculator"
        aria-label="Calculator"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div className="display-panel" aria-busy={isLoading}>
          <span className="expression" aria-hidden="true">
            {expression}
          </span>
          <output
            ref={displayRef}
            className="display"
            aria-label="Calculator display"
            aria-live="polite"
            tabIndex={-1}
          >
            {display}
          </output>
          <span className="service-status" aria-live="polite">
            {isLoading ? "Calculating with the server…" : "Ready"}
          </span>
        </div>

        <div className="feedback" aria-live="assertive">
          {error && <p role="alert">{error}</p>}
        </div>

        <div className="keypad" role="group" aria-label="Calculator keypad">
          <button
            className="key key-secondary key-wide"
            type="button"
            onClick={clear}
            aria-label="Clear all"
          >
            AC
          </button>
          <button
            className="key key-secondary"
            type="button"
            onClick={backspace}
            disabled={isLoading}
            aria-label="Backspace"
          >
            ⌫
          </button>
          <OperationButton
            operation={OPERATIONS[0]}
            active={operator === OPERATIONS[0].operation}
            disabled={isLoading}
            onSelect={selectOperator}
          />

          {DIGITS.map((digit, index) => (
            <div className="key-slot" key={digit}>
              <button
                className="key"
                type="button"
                onClick={() => inputDigit(digit)}
                disabled={isLoading}
                aria-label={digit}
              >
                {digit}
              </button>
              {index === 2 && (
                <OperationButton
                  operation={OPERATIONS[1]}
                  active={operator === OPERATIONS[1].operation}
                  disabled={isLoading}
                  onSelect={selectOperator}
                />
              )}
              {index === 5 && (
                <OperationButton
                  operation={OPERATIONS[2]}
                  active={operator === OPERATIONS[2].operation}
                  disabled={isLoading}
                  onSelect={selectOperator}
                />
              )}
              {index === 8 && (
                <OperationButton
                  operation={OPERATIONS[3]}
                  active={operator === OPERATIONS[3].operation}
                  disabled={isLoading}
                  onSelect={selectOperator}
                />
              )}
            </div>
          ))}

          <button
            className="key key-zero"
            type="button"
            onClick={() => inputDigit("0")}
            disabled={isLoading}
            aria-label="0"
          >
            0
          </button>
          <button
            className="key"
            type="button"
            onClick={inputDecimal}
            disabled={isLoading}
            aria-label="Decimal point"
          >
            .
          </button>
          <button
            className="key key-equals"
            type="button"
            onClick={() => void requestResult()}
            disabled={
              isLoading ||
              isWaitingForOperand ||
              leftOperand === null ||
              operator === null
            }
            aria-label="Equals"
          >
            =
          </button>
        </div>

        <p className="keyboard-hint">
          Keyboard: 0–9, decimal, +, −, × (*), ÷ (/), Enter, Backspace, and
          Escape.
        </p>
      </section>
    </main>
  );
}

interface OperationButtonProps {
  operation: (typeof OPERATIONS)[number];
  active: boolean;
  disabled: boolean;
  onSelect: (operation: Operation) => void;
}

function OperationButton({
  operation,
  active,
  disabled,
  onSelect,
}: OperationButtonProps) {
  return (
    <button
      className="key key-operation"
      type="button"
      onClick={() => onSelect(operation.operation)}
      disabled={disabled}
      aria-label={operation.label}
      aria-pressed={active}
    >
      {operation.symbol}
    </button>
  );
}