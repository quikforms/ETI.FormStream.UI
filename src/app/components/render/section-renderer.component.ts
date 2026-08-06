import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
  ProcessedElement, ProcessedSection, RadioLikeGroup, UnifiedField, UnifiedTable, UnifiedText,
} from '../../state/models/render/render-model';
import { MAX_VISUAL_DEPTH, NOTE_TEXT_PATTERN } from '../../state/models/render/render-tokens';

@Component({
  selector: 'fs-section',
  templateUrl: './section-renderer.component.html',
  styleUrls: ['./section-renderer.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionRendererComponent {
  @Input() section!: ProcessedSection;
  @Input() parentGroup!: FormGroup;

  get depthClass(): string { return `fs-depth-${Math.min(this.section?.depth ?? 0, MAX_VISUAL_DEPTH)}`; }

  // get([key]) (array form) treats the key as a literal — fieldNames contain dots,
  // which the string form of get() would wrongly parse as a nested path.
  control(key: string): FormControl { return this.parentGroup.get([key]) as FormControl; }

  // Narrowing helpers (strictTemplates-safe).
  asText(el: ProcessedElement): UnifiedText | null { return el.kind === 'text' ? el.element : null; }
  asFieldRow(el: ProcessedElement): UnifiedField[] | null { return el.kind === 'field-row' ? el.fields : null; }
  asRadioGroup(el: ProcessedElement): RadioLikeGroup | null { return el.kind === 'radio-group' ? el.group : null; }
  asTable(el: ProcessedElement): UnifiedTable | null { return el.kind === 'table' ? el.table : null; }

  isChecked(field: UnifiedField): boolean { return this.control(field.controlKey)?.value === field.exportValue; }
  toggle(field: UnifiedField): void {
    const c = this.control(field.controlKey);
    c.setValue(this.isChecked(field) ? '' : (field.exportValue ?? ''));
  }

  isNote(text: string): boolean { return NOTE_TEXT_PATTERN.test((text || '').trim()); }
  trackByIndex(i: number): number { return i; }
}
