export class ApiError extends Error {
    public errorCode: number;
    public message: string;

    constructor(public error: any){
        super();
        this.errorCode  = error.ErrorCode || error.errorCode;
        this.message  = error.Message || error.message;
    }

    toString = () => `${this.message}`;
}
