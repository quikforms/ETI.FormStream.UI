/***************************************************************************************************
 * Load `$localize` onto the global scope - used if i18n tags appear in Angular templates.
 */
import '@angular/localize/init';

/*
 * This element is SELF-CONTAINED: it bundles its own Zone.js (here) and Angular runtime so it can
 * be embedded as a single <script> into ANY host page, including non-Angular ones. That is the
 * correct, required behaviour for the framework-agnostic external-embedding use case.
 *
 * KNOWN DEBT — double runtime: when this element is embedded in an Angular host, the page ends up
 * with TWO Zone.js patches + two Angular runtimes, which can cause change-detection/async quirks
 * and a larger payload. It cannot be made zoneless on Angular 15.2.
 * The real fix is dual consumption: keep this self-contained element for external (non-Angular)
 * hosts, and consume the same code as a normal Angular library/module inside Angular hosts — to be
 * done via a companion Angular library project in this repository.
 */
import 'zone.js';
(window as any).global = window;

