import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { UnifiedField } from '../../state/models/render/render-model';
import { INPUT_ROW_HEIGHT_PX, maskPlaceholder } from '../../state/models/render/render-tokens';

@Component({
  selector: 'fs-field',
  templateUrl: './field.component.html',
  styleUrls: ['./field.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldComponent {
  @Input() field!: UnifiedField;
  @Input() control!: FormControl;

  readonly rowHeight = INPUT_ROW_HEIGHT_PX;
  get placeholder(): string { return maskPlaceholder(this.field.formatMask || ''); }

  // checkbox/radio single-select
  get checked(): boolean { return this.control?.value === this.field.exportValue; }
  toggle(): void { this.control.setValue(this.checked ? '' : (this.field.exportValue ?? '')); }
}
