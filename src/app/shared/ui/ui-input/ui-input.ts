import { Component, forwardRef, Input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-ui-input', standalone: true,
  host: { '[attr.id]': 'null' },
  templateUrl: './ui-input.html', styleUrls: ['./ui-input.scss'],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiInputComponent), multi: true }],
})
export class UiInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() error = '';
  @Input() id = 'input-' + crypto.randomUUID();
  @Input() maxlength: number | null = null;
  @Input() min: string | null = null;
  @Input() max: string | null = null;
  @Input() step: string | null = null;
  readonly value = signal<string | number>('');
  readonly disabled = signal(false);
  private onChange: (value: string | number | null) => void = () => {};
  private onTouched: () => void = () => {};
  writeValue(value: unknown): void { this.value.set(typeof value === 'string' || typeof value === 'number' ? value : ''); }
  registerOnChange(callback: (value: string | number | null) => void): void { this.onChange = callback; }
  registerOnTouched(callback: () => void): void { this.onTouched = callback; }
  setDisabledState(disabled: boolean): void { this.disabled.set(disabled); }
  handleInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value.set(input.value);
    this.onChange(this.type === 'number' ? (input.value === '' ? null : input.valueAsNumber) : input.value);
  }
  handleBlur(): void { this.onTouched(); }
}
