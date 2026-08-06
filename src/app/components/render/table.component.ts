import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { UnifiedTable } from '../../state/models/render/render-model';

@Component({
  selector: 'fs-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent {
  @Input() table!: UnifiedTable;
  @Input() parentGroup!: FormGroup;

  // get([key]) (array form) treats the key as a literal — fieldNames contain dots,
  // which the string form of get() would wrongly parse as a nested path.
  control(key: string): FormControl { return this.parentGroup.get([key]) as FormControl; }
  trackByIndex(i: number): number { return i; }
}
