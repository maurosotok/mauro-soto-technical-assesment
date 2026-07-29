package main

import (
	"errors"
	"math"
)

type Operation string

const (
	OperationAdd      Operation = "add"
	OperationSubtract Operation = "subtract"
	OperationMultiply Operation = "multiply"
	OperationDivide   Operation = "divide"
)

var (
	ErrUnsupportedOperation = errors.New("unsupported operation")
	ErrNonFiniteOperand     = errors.New("operands must be finite")
	ErrDivisionByZero       = errors.New("division by zero")
	ErrNonFiniteResult      = errors.New("result is not finite")
)

type Calculator struct{}

func (Calculator) Calculate(operation Operation, left, right float64) (float64, error) {
	if !isFinite(left) || !isFinite(right) {
		return 0, ErrNonFiniteOperand
	}

	var result float64
	switch operation {
	case OperationAdd:
		result = left + right
	case OperationSubtract:
		result = left - right
	case OperationMultiply:
		result = left * right
	case OperationDivide:
		if right == 0 {
			return 0, ErrDivisionByZero
		}
		result = left / right
	default:
		return 0, ErrUnsupportedOperation
	}

	if !isFinite(result) {
		return 0, ErrNonFiniteResult
	}
	return result, nil
}

func isFinite(value float64) bool {
	return !math.IsNaN(value) && !math.IsInf(value, 0)
}
