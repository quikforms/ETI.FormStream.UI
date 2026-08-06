import { NgModule, Injector, Injectable, APP_INITIALIZER } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { Store, StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormStreamReducer } from './app/state/reducers/formstream.reducer';
import { FormStreamEffects } from './app/state/effects/formstream.effects';
import { FormStreamComponent } from './app/components/formstream/formstream.component';
import { IconComponent } from './app/components/icon/icon.component';
import { FormRenderService } from './app/services/form-render.service';
import { FormCompletionService } from './app/services/form-completion.service';
import { FormActionsComponent } from './app/components/form-actions/form-actions.component';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { AuthTokenReducer } from './app/state/reducers/auth-token.reducer';
import { ConfigurationReducer } from './app/state/reducers/configuration.reducer';
import { ConfigurationEffects } from './app/state/effects/configuration.effects';
import { Configuration } from './app/state/models/configuration.model';
import { environment } from './environments/environment';
import { FormStreamConfigLoaded } from './app/state/actions/configuration.actions';
import { AuthTokenService } from './app/services/token.service';
import { QfHttpService } from './app/services/qf-http.service';
import { ModalModule } from 'ngx-bootstrap/modal';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { AttachmentsComponent } from './app/components/attachments/attachments.component';
import { FormStreamModalService } from './app/services/formstream-modals.service';
import { AttachmentsEffects } from './app/state/effects/attachments.effects';
import { AttachmentsReducer } from './app/state/reducers/attachments.reducer';
import { WindowEffects } from './app/state/effects/window.effects';
import { WindowRef } from './app/services/window-ref.service';
import { ConfirmComponent } from './app/components/modals/confirm-modal.component';
import { SaveFormService } from './app/services/save-form.service';
import { NotificationComponent } from './app/components/notifications/notification.component';
import { NotificationReducer } from './app/state/reducers/notification.reducer';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BackgroundComponent } from './app/components/background/background.component';
import { PrintFormService } from './app/services/print-form.service';
import { FormRendererComponent } from './app/components/render/form-renderer.component';
import { SectionRendererComponent } from './app/components/render/section-renderer.component';
import { FieldRowComponent } from './app/components/render/field-row.component';
import { FieldComponent } from './app/components/render/field.component';
import { RadioGroupComponent } from './app/components/render/radio-group.component';
import { TableComponent } from './app/components/render/table.component';
import { FormatMaskDirective } from './app/components/render/format-mask.directive';
import { ProportionalScrollDirective } from './app/directives/proportional-scroll.directive';
import { SendForSignatureComponent } from './app/components/esign/send-for-signature.component';
import { SignersTableComponent } from './app/components/esign/signers-table.component';
import { SigningGroupsReducer } from './app/state/reducers/signing-groups.reducer';
import { SigningGroupsEffects } from './app/state/effects/signing-groups.effects';
import { SignEnvelopeEffects } from './app/state/effects/sign-envelope.effects';

@Injectable()
export class ConfigLoader {

  constructor(private _store: Store<any>) {}

  public loadConfig(): Promise<void> {
    // The API endpoints are baked into the build (see src/environments), so the element is
    // self-contained and needs no runtime config fetch or host wiring to initialise.
    const config = Configuration.fromResponse(environment);
    this._store.dispatch(new FormStreamConfigLoaded(config));
    return Promise.resolve();
  }
}

export function initializeConfig(configLoader: ConfigLoader) {
  return () => configLoader.loadConfig();
}


@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    StoreModule.forRoot({formStreamReducer: FormStreamReducer, authTokenReducer: AuthTokenReducer, configurationReducer: ConfigurationReducer, attachmentsReducer: AttachmentsReducer, notificationReducer: NotificationReducer, signingGroupsReducer: SigningGroupsReducer }),
    EffectsModule.forRoot([FormStreamEffects, ConfigurationEffects, AttachmentsEffects, WindowEffects, SigningGroupsEffects, SignEnvelopeEffects]),
    ModalModule.forRoot(),
    TooltipModule.forRoot()
  ],
  declarations: [
    IconComponent,
    FormStreamComponent,
    FormActionsComponent,
    BackgroundComponent,
    AttachmentsComponent,
    ConfirmComponent,
    NotificationComponent,
    FormRendererComponent,
    SectionRendererComponent,
    FieldRowComponent,
    FieldComponent,
    RadioGroupComponent,
    TableComponent,
    FormatMaskDirective,
    ProportionalScrollDirective,
    SendForSignatureComponent,
    SignersTableComponent
  ],
  providers: [
    QfHttpService,
    AuthTokenService,
    FormStreamModalService,
    SaveFormService,
    PrintFormService,
    FormRenderService,
    FormCompletionService,
    ConfigLoader,
    WindowRef,
    {
        provide: APP_INITIALIZER,
        useFactory: initializeConfig,
        deps: [ConfigLoader],
        multi: true
    }
  ]
})
export class FormStreamElementModule {
  constructor(private injector: Injector) {    
      const formStreamElement = createCustomElement(FormStreamComponent, { injector });
      customElements.define('quik-formstream', formStreamElement);      
  }

  ngDoBootstrap() {}
}
