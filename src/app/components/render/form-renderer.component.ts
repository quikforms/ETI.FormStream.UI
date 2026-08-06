import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ProcessedSection } from '../../state/models/render/render-model';
import { RenderedForm } from '../../services/form-render.service';

@Component({
  selector: 'fs-form-renderer',
  templateUrl: './form-renderer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormRendererComponent {
  @Input() renderedForm!: RenderedForm;
  trackBySectionId(_i: number, s: ProcessedSection): string { return s.id; }
}
