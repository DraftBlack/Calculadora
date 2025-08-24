import { Component, signal } from '@angular/core'; // Importe 'signal'
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-calculadora',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calculadora.html',
  styleUrls: ['./calculadora.css']
})
export class Calculadora {

  // --- MUDANÇA: Variáveis de estado agora são Signals ---
  displayValue = signal<string>('0');
  firstOperand = signal<number | null>(null);
  operator = signal<string | null>(null);
  waitForSecondNumber = signal<boolean>(false);

  // RF-002: Lida com a entrada de números
  public onNumberClick(number: string): void {
    if (this.waitForSecondNumber()) {
      this.displayValue.set(number);
      this.waitForSecondNumber.set(false);
    } else {
      // Usamos .update() para calcular o novo valor a partir do anterior
      this.displayValue.update(currentValue =>
        currentValue === '0' ? number : currentValue + number
      );
    }
  }

  // RF-003: Lida com a entrada do ponto decimal
  public onDecimalClick(): void {
    // Apenas atualiza se a condição for verdadeira
    if (!this.displayValue().includes('.')) {
      this.displayValue.update(currentValue => currentValue + '.');
    }
  }

  // RF-004: Lida com a escolha de um operador
  public onOperatorClick(operator: string): void {
    const currentValue = parseFloat(this.displayValue());

    if (this.operator() && this.waitForSecondNumber()) {
      this.operator.set(operator);
      return;
    }

    if (this.firstOperand() === null) {
      this.firstOperand.set(currentValue);
    } else if (this.operator()) {
      const result = this.calculate(this.firstOperand()!, currentValue, this.operator()!);
      this.displayValue.set(String(result));
      this.firstOperand.set(result);
    }

    this.operator.set(operator);
    this.waitForSecondNumber.set(true);
  }

  // RF-005: Executa o cálculo
  public onEqualClick(): void {
    if (this.operator() === null || this.waitForSecondNumber()) {
      return;
    }

    const currentValue = parseFloat(this.displayValue());
    const result = this.calculate(this.firstOperand()!, currentValue, this.operator()!);

    // RF-008: Tratamento da divisão por zero
    if (result === null) {
      this.displayValue.set('Erro');
    } else {
      this.displayValue.set(String(result));
    }

    // Reseta o estado para o próximo cálculo
    this.firstOperand.set(null);
    this.operator.set(null);
    this.waitForSecondNumber.set(false);
  }

  // Lógica de cálculo (não precisa de Signals, pois é uma função pura)
  private calculate(op1: number, op2: number, operator: string): number | null {
    switch (operator) {
      case '+': return op1 + op2;
      case '-': return op1 - op2;
      case '*': return op1 * op2;
      case '/':
        if (op2 === 0) { return null; }
        return op1 / op2;
      default:
        return op2;
    }
  }

  // RF-006: Limpa tudo (All Clear)
  public onClearClick(): void {
    // Limpar com Signals é muito mais explícito e claro
    this.displayValue.set('0');
    this.firstOperand.set(null);
    this.operator.set(null);
    this.waitForSecondNumber.set(false);
  }

  // RF-007: Apaga o último dígito
  public onDeleteClick(): void {
    if (this.displayValue().length > 1) {
      this.displayValue.update(currentValue => currentValue.slice(0, -1));
    } else {
      this.displayValue.set('0');
    }
  }

  public onPercentageClick(): void {
    // Pega o valor que está no visor e converte para número
    const currentValue = parseFloat(this.displayValue());

    // Se não houver uma operação em andamento (nenhum primeiro operando)
    // a porcentagem age sobre o próprio número. Ex: 50% se torna 0.5
    if (this.firstOperand() === null) {
      this.displayValue.set(String(currentValue / 100));
      return;
    }

    // Se HOUVER uma operação (ex: 200 - 10%), a porcentagem é calculada
    // em cima do primeiro operando.
    // Ex: 10% de 200 = 20
    const percentageOfFirstOperand = this.firstOperand()! * (currentValue / 100);

    // Atualiza o visor com o valor da porcentagem calculada (ex: 20)
    // Agora o cálculo pendente é 200 - 20. Se o usuário clicar em "=", o resultado será 180.
    this.displayValue.set(String(percentageOfFirstOperand));
  }
}