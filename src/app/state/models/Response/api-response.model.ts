import { FormStreamData } from './formstream-data.model';

export class ApiResponse {
  constructor(
    public resultData: FormStreamData = new FormStreamData(),
    public errorCode: number = 0,
    public message: string = '',
    public errors: any = null
  ) {}

  static fromRaw = (raw: any): ApiResponse =>
    new ApiResponse(
      FormStreamData.fromRaw(raw.resultData || {}),
      raw.errorCode || 0, raw.message || '', raw.errors || null
    );
}
