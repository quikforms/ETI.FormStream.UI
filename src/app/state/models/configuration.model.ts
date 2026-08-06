export class Configuration {

    constructor (
        public api: ApiConfiguration,
    ) {}

    static fromResponse(configurationRAW: any): Configuration {
        return new this(
            ApiConfiguration.fromResponse(configurationRAW.api)            
        );
    }

};

export class ApiConfiguration {    

    constructor(
        public qfe: string,
        public auth: string,
        public idp: string,
        public esign: string
    ) {}

    static fromResponse(apiConfigurationRAW: any): ApiConfiguration {
        return new this(
            apiConfigurationRAW.qfe,
            apiConfigurationRAW.auth,
            apiConfigurationRAW.idp,
            apiConfigurationRAW.esign
        );
    }

};

export class Endpoints {
    
    public qfe: any;
    public auth: any;
    public idp: any;
    public esign: any;

    constructor (configuration: Configuration) {
        this.qfe = {
            formPreviewUrl: configuration.api.qfe + 'qfe/execute/html',
            multipackageUrl: configuration.api.qfe + 'multipackage',
            uploadAttachmentsUrl: configuration.api.qfe + 'attachments/upload/viewer',
            deleteAttachmentUrl: configuration.api.qfe + 'attachments/{fileId}/remove',
            getAttachmentsUrl: configuration.api.qfe + 'attachments',
            saveForms: configuration.api.qfe + 'formstream/save',
            printForms: configuration.api.qfe + 'print/submit'
        };

        this.auth = configuration.api.auth;

        this.idp = configuration.api.idp;

        this.esign = {
            signingGroups: configuration.api.esign + 'formstream/docusign/signing-groups',
            envelopeSign: configuration.api.esign + 'formstream/docusign/envelope/sign'
        };
    }
}