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

  settled = 8000,  //已结算

  remiting = 9000,  //已打款
  remitFail = 10000, //打款失败
  remitSuccess = 11000, //打款成功
}

export enum UserIncomeStatus {
  unremit = 0,
  remiting = 1,
  remitSuccess = 2,
  remitFail = 3,

  freezed = 4,
  canceled = 5
}