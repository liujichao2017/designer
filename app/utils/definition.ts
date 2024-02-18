export enum DemandStatus {
  draft = 0,   //草稿

  obligation = 1000, //待支付
  pendingWithPartPay = 1001, //部分支付未确认
  pendingWithPay = 1002, //支付未确认
  pending = 2000,  //待分配   和待支付 1001 1002 可以相互颠倒

  unreception = 3000,  //待接受
  progressing = 4000, //进行中
  canceled = 5000,  //取消了
  uncommented = 6000, //待评价
  completed = 7000,  //完成

  settled = 8000,  //已结算  到这里user_income才有数据，profile.balance才有余额

  remiting = 9000,  //已打款
  remitFail = 10000, //打款失败
  remitSuccess = 11000, //打款成功
}

export enum TimelineStatus {
  INIT = 0,
  EMPLOYCONFIRMED = 1,
  DESINNERCONFIRMED = 2,
  FINISHEDDAFT = 3,
  FINISHEDFULL = 4,
}

export enum UserIncomeStatus {
  unremit = 0,
  remiting = 1,
  remitSuccess = 2,
  remitFail = 3,

  freezed = 4,
  canceled = 5
}

export enum NotifyType {
  TYPE_APPLY_FOR_PRO = 1,
  TYPE_REJCT_FOR_PRO = 2,
  TYPE_BECOME_PRO = 4,
  TYPE_SEND_OFFER = 3,
  TYPE_COMMON_NOTIFY = 0,
  TYPE_REJECT = 5,
  TYPE_ACCEPT_DEMAND = 6,
  TYPE_REJECT_DEMAND = 7
}

export enum PayOf {
  BANK = 0,
  FPS = 1,
  PAYPAL = 2,
  CHEQUE = 3,
  PAYME = 4
}

export enum PayType {
  FULL = 0,
  PART = 1
}

export enum PayPalStatus {
  UNCOMPLETE = 0,
  COMPLETED = 1
}

export const categoryMapper = new Map(Object.entries({
  2: 27,
  0: 25,
  1: 26,
  4: 28,
  5: 29,
  11: 32,
  3: 1,
}))


export enum PictureStatus {
  ACCEPTED = 0,
  REJECTED = 1,
  PENDING = 2
}

export enum CommentStatus {
  STATUS_UNREAD = 0,
  STATUS_READED = 1
}
