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
    public idp: any;
    public esign: any;

    constructor (configuration: Configuration) {
        // Every runtime call goes to a route FormStream does not share with another client. The
        // attachment and print routes used to be general-purpose ones, shared with the legacy HTML
        // viewer and the Quik! web app respectively, which is why neither could be given an
        // authorization policy of its own. These are the dedicated equivalents.
        this.qfe = {
            uploadAttachmentsUrl: configuration.api.qfe + 'formstream/attachments/upload',
            deleteAttachmentUrl: configuration.api.qfe + 'formstream/attachments/{fileId}',
            getAttachmentsUrl: configuration.api.qfe + 'formstream/attachments',
            saveForms: configuration.api.qfe + 'formstream/save',
            printForms: configuration.api.qfe + 'formstream/print'
        };

        // `auth` is accepted on the apiConfig input but has no endpoint of its own here: nothing in the
        // element calls it. It stays part of the input shape because a first-party host validates that
        // all four base URLs are present and passes no override at all when one is missing — dropping it
        // from the contract would silently fall such a host back to the baked production URLs.

        this.idp = configuration.api.idp;

        this.esign = {
            signingGroups: configuration.api.esign + 'formstream/docusign/signing-groups',
            envelopeSign: configuration.api.esign + 'formstream/docusign/envelope/sign'
        };
    }
}