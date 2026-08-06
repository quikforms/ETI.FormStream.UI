import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { FormControl } from '@angular/forms';
import { RadioLikeGroup } from '../../state/models/render/render-model';

@Component({
  selector: 'fs-radio-group',
  templateUrl: './radio-group.component.html',
  styleUrls: ['./radio-group.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioGroupComponent implements OnChanges {
  @Input() group!: RadioLikeGroup;
  @Input() control!: FormControl;

  hasDescriptions = false;
  ngOnChanges(): void { this.hasDescriptions = (this.group?.options ?? []).some(o => !!o.description); }

  isSelected(exportValue: string): boolean { return this.control?.value === exportValue; }
  select(exportValue: string): void { this.control.setValue(exportValue); }
  trackByExport(_i: number, o: { exportValue: string }): string { return o.exportValue; }
}
