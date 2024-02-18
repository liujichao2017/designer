import { json } from "@remix-run/node"

export type FaultResult = {
  code: number
  reason?: string
}

export const __ResultCode: Record<string, number | FaultResult> = {
  OK: 0,
  PASSWORD_INCORRECT: { code: 1, reason: "Password incorrect" },
  FORM_INVALID: { code: 2, reason: "form invalid" },
  AUTH_PROVIDER_INVALID: { code: 3, reason: "auth provider invalid" },
  DATABASE_ERROR: { code: 4, reason: "database error" },
  AWS_ERROR: { code: 5, reason: "AWS error" },
}

export enum ResultCode {
  OK = 0,
  PASSWORD_INCORRECT = 1,
  FORM_INVALID = 2,
  AUTH_PROVIDER_INVALID = 3,
  DATABASE_ERROR = 4,
  AWS_ERROR = 5,
  GOOGLE_ERROR = 6,
  EMAIL_ALREADY_EXIST = 7,
  INVALID_ACTIVE_CODE = 8,
  ACCOUNT_NOT_ACTIVED = 9,
  PERMISSION_DENIED = 10,

  EXPIRED = 11,
  DUPLICATE_ITEM = 12,
  UPPER_LIMIT = 13,
  EXCEPTION = 500,
}

export type ErrorCode = Omit<typeof ResultCode, "OK">
export type SuccessCode = Pick<typeof ResultCode, "OK">

export const __fault = (result: FaultResult | number) => json(result as FaultResult)
export const fault = (code: ResultCode) => json({ code: code })

//@deprecated
//just use json({code: ResultCode.OK}) can be reflect typed
export const success = (data: unknown) => json({
  code: ResultCode.OK,
  data
})