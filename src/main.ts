import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { FormStreamElementModule } from './formstream-element.module';

platformBrowserDynamic()
  .bootstrapModule(FormStreamElementModule) // Only bootstrap the web component module
  .catch(err => console.error(err));  
