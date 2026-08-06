import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { UnifiedField } from '../../state/models/render/render-model';

type RowLayout = 'single-checkbox' | 'checkboxes' | 'checkboxes-and-inputs' | 'single-input' | 'inputs';

@Component({
  selector: 'fs-field-row',
  templateUrl: './field-row.component.html',
  styleUrls: ['./field-row.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldRowComponent implements OnChanges {
  @Input() fields: UnifiedField[] = [];
  @Input() parentGroup!: FormGroup;

  layout: RowLayout = 'inputs';
  checkboxFields: UnifiedField[] = [];
  inputFields: UnifiedField[] = [];

  ngOnChanges(): void {
    this.checkboxFields = this.fields.filter(f => f.isChoice);
    this.inputFields = this.fields.filter(f => !f.isChoice);
    this.layout = this.resolveLayout();
  }

  // R3: the five field-row layout cases.
  private resolveLayout(): RowLayout {
    const total = this.fields.length;
    const cb = this.checkboxFields.length;
    const inp = this.inputFields.length;
    if (total === 1 && cb === 1) { return 'single-checkbox'; }
    if (cb > 1 && inp === 0) { return 'checkboxes'; }
    if (cb > 0 && inp > 0) { return 'checkboxes-and-inputs'; }
    if (total === 1) { return 'single-input'; }
    return 'inputs';
  }

  // get([key]) (array form) treats the key as a literal — fieldNames contain dots,
  // which the string form of get() would wrongly parse as a nested path.
  control(field: UnifiedField): FormControl { return this.parentGroup.get([field.controlKey]) as FormControl; }
  trackByControlKey(_i: number, f: UnifiedField): string { return f.controlKey; }
}
