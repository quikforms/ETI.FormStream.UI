import { Injectable } from '@angular/core';

@Injectable()
export class WindowRef {
  getNativeWindow(): Window {
    return window;
  }
}
