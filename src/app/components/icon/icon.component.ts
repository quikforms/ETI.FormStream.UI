import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ICONS } from './icons';

/**
 * Renders an inline SVG icon by name (see ./icons). The icon inherits the surrounding text
 * colour (via `currentColor`) and font-size (1em), so it behaves like an icon-font glyph but
 * ships with the element — no external icon font is required on the host page.
 *
 * Usage: <fs-icon name="circle-info"></fs-icon>  ·  <fs-icon name="spinner" [spin]="true">
 */
@Component({
  selector: 'fs-icon',
  template: `<span class="fs-icon" [class.fs-icon--spin]="spin" [innerHTML]="svg"></span>`
})
export class IconComponent {
  @Input()
  set name(value: string) {
    this.svg = this._sanitizer.bypassSecurityTrustHtml(ICONS[value] ?? '');
  }

  @Input() spin = false;

  svg: SafeHtml = '';

  constructor(private _sanitizer: DomSanitizer) {}
}
