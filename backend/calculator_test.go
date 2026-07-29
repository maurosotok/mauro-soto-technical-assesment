package main

import (
	"errors"
	"math"
	"testing"
)

func TestCalculatorCalculateSuccess(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		operation Operation
		left      float64
		right     float64
		want      float64
	}{
		{name: "adds decimals", operation: OperationAdd, left: 1.25, right: 2.5, want: 3.75},
		{name: "subtracts negative number", operation: OperationSubtract, left: 5, right: -2, want: 7},
		{name: "multiplies by negative number", operation: OperationMultiply, left: 2.5, right: -4, want: -10},
		{name: "divides decimals", operation: OperationDivide, left: 7.5, right: 2.5, want: 3},
		{name: "raises to a power", operation: OperationPower, left: 2, right: 3, want: 8},
		{name: "calculates square root", operation: OperationSquareRoot, left: 81, want: 9},
	}

	calculator := Calculator{}
	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			got, err := calculator.Calculate(test.operation, test.left, test.right)
			if err != nil {
				t.Fatalf("Calculate() error = %v", err)
			}
			if got != test.want {
				t.Errorf("Calculate() = %v, want %v", got, test.want)
			}
		})
	}
}

func TestCalculatorCalculateErrors(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		operation Operation
		left      float64
		right     float64
		wantErr   error
	}{
		{name: "unsupported operation", operation: "modulo", left: 1, right: 2, wantErr: ErrUnsupportedOperation},
		{name: "NaN left operand", operation: OperationAdd, left: math.NaN(), right: 2, wantErr: ErrNonFiniteOperand},
		{name: "infinite right operand", operation: OperationAdd, left: 1, right: math.Inf(1), wantErr: ErrNonFiniteOperand},
		{name: "division by positive zero", operation: OperationDivide, left: 1, right: 0, wantErr: ErrDivisionByZero},
		{name: "division by negative zero", operation: OperationDivide, left: 1, right: math.Copysign(0, -1), wantErr: ErrDivisionByZero},
		{name: "overflowing result", operation: OperationMultiply, left: math.MaxFloat64, right: 2, wantErr: ErrNonFiniteResult},
		{name: "negative square root", operation: OperationSquareRoot, left: -1, wantErr: ErrNegativeSquareRoot},
		{name: "non-real power result", operation: OperationPower, left: -1, right: 0.5, wantErr: ErrNonFiniteResult},
	}

	calculator := Calculator{}
	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			_, err := calculator.Calculate(test.operation, test.left, test.right)
			if !errors.Is(err, test.wantErr) {
				t.Errorf("Calculate() error = %v, want %v", err, test.wantErr)
			}
		})
	}
}
