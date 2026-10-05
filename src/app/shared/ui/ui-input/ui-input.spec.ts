import { TestBed } from '@angular/core/testing';
import { UiInputComponent } from './ui-input';
describe('Input value accessor', () => {
  it('updates rendered values and disabled state after programmatic writes', async () => {
    const fixture = TestBed.createComponent(UiInputComponent); await fixture.whenStable();
    fixture.componentInstance.writeValue('Nuevo valor'); fixture.componentInstance.setDisabledState(true);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('Nuevo valor'); expect(input.disabled).toBe(true);
    fixture.componentInstance.setDisabledState(false); await fixture.whenStable(); expect(input.disabled).toBe(false);
  });
  it('returns a number or null from numeric inputs', async () => {
    const fixture = TestBed.createComponent(UiInputComponent); fixture.componentRef.setInput('type', 'number');
    const changed = vi.fn(); fixture.componentInstance.registerOnChange(changed); await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = '12.5'; input.dispatchEvent(new Event('input')); expect(changed).toHaveBeenCalledWith(12.5);
    input.value = ''; input.dispatchEvent(new Event('input')); expect(changed).toHaveBeenCalledWith(null);
  });
});
