import { Directive, ElementRef, HostListener, Input, Optional } from '@angular/core';
import { FormControl, NgControl } from '@angular/forms';
import { applyFormatMask } from '../../state/models/render/form-render.utils';

// Re-applies a format mask on input, keeping the bound FormControl in sync.
@Directive({ selector: '[fsFormatMask]' })
export class FormatMaskDirective {
  @Input('fsFormatMask') mask = '';

  constructor(private el: ElementRef<HTMLInputElement>, @Optional() private ngControl: NgControl) {}

  @HostListener('input')
  onInput(): void {
    if (!this.mask) { return; }
    const masked = applyFormatMask(this.el.nativeElement.value, this.mask);
    // Write the DOM value ourselves and keep the control in sync WITHOUT letting
    // the value accessor re-write the view (emitModelToViewChange: false), which
    // would reset the caret to the end on every keystroke.
    this.el.nativeElement.value = masked;
    const control = this.ngControl?.control;
    if (control) { (control as FormControl).setValue(masked, { emitEvent: true, emitModelToViewChange: false }); }
  }
}
