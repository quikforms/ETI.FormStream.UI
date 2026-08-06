import { Injectable } from '@angular/core';
import { combineLatest, Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { RenderedForm } from './form-render.service';
import { FormCompletion, computeCompletion } from '../state/models/render/form-completion';

@Injectable()
export class FormCompletionService {

  // Emits an index-aligned completion array for the given forms, updating on every edit.
  // Each form recomputes only on its own valueChanges; combineLatest replays the cached
  // metrics for the others, so a single keystroke never recomputes every form.
  track(forms: RenderedForm[]): Observable<FormCompletion[]> {
    if (!forms.length) { return of([]); }

    return combineLatest(
      forms.map(form =>
        form.formGroup.valueChanges.pipe(
          startWith(form.formGroup.value),
          map(values => computeCompletion(values as Record<string, string>, form.fieldDescriptors.length))
        )
      )
    );
  }
}
