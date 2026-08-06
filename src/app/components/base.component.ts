import { Component, OnDestroy } from '@angular/core';

import { Subject } from 'rxjs';

@Component({
  template: ''
})
export abstract class BaseComponent implements OnDestroy {


  protected destroyed$: Subject<boolean> = new Subject();

  ngOnDestroy(): void {
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }
}
