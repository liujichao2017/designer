import { ActionArgs, LoaderArgs, json, redirect } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { ChangeEvent, DragEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { PhotoProvider, PhotoView } from "react-photo-view";
import { PageError } from "~/components/ui/Errors";
import Order, { Props } from "~/components/ui/demand/Order";
import { useService } from "~/services/services.server";
import { PayOf, PayType } from "~/utils/definition";
import { formatMoney } from "~/utils/helpers";
import { ResultCode, fault } from "~/utils/result";
import { hasRole, isAuthenticated } from "~/utils/sessions.server";
import { Roles } from "~/utils/store";
import PaymeQRCode from "~/images/payme.jpeg"
import { PaidSnapValidator } from "~/utils/validators";


export async function loader (args: LoaderArgs) {
  const user = await isAuthenticated(args)
  if (!user) throw redirect("/dashboard/project")

  const isAdmin = await hasRole(Roles.BACK_ADMIN, args)
  if (!isAdmin) throw redirect("/dashboard/project")

  const { params: { id } } = args

  if (!id) throw redirect("/dashboard/project")

  const service = useService("demand", { user })
  const demand = await service.getDemand(+id)
  //@ts-ignore
  const quotation = await service.getQuotations(demand)
  return json({ code: ResultCode.OK, demand, quotation })
}

export async function action (args: ActionArgs) {
  const user = await isAuthenticated(args)
  if (!user) throw redirect("/auth/signin")
  const { request } = args
  const data = await args.request.json()

  const { _action } = data
  switch (_action) {
    case "snap":
      {
        const result = PaidSnapValidator.safeParse(data)
        if (!result.success) return fault(ResultCode.FORM_INVALID)
        await useService("demand", { user }).uploadPaymentSnap(result.data.id, result.data.snap, result.data.amount, result.data.type)
        return json({ code: ResultCode.OK })
      }
  }
}


export default function Page () {
  const { code, demand, quotation } = useLoaderData<typeof loader>()
  if (code !== ResultCode.OK || !demand) return <PageError />

  const { t } = useTranslation()
  const payOfs = [
    [4, "Payme"],
    [0, t("detailpay.paymethod.0")],
    [1, t("detailpay.paymethod.1")],
    [3, t("detailpay.paymethod.2")],
  ]

  const [payType, setPayType] = useState(PayType.FULL)
  const [payOf, setPayOf] = useState(0)
  const mutation = useFetcher()

  const paid = demand.demand_pay.map(d => d.pay_price).reduce((a, b) => Number(a) + Number(b), 0)
  console.log(demand.demand_pay, quotation)
  //@ts-ignore  
  const totalPrice = quotation?.totalPrice * (1 - (quotation?.discount ?? 0))
  const remain = totalPrice - paid

  const payment = demand.demand_pay?.at(0)

  const submit = (snap: string) => {
    if (!snap) return
    mutation.submit({ _action: "snap", id: demand.id, amount: remain, type: payOf, snap },
      {
        method: "post",
        encType: "application/json"
      })
  }

  return (
    <div className="flex flex-col gap-6">
      <Order demand={demand as Props["demand"]} payments={demand?.demand_pay as Props["payments"]} paid={paid} />

      <div className="bg-base-100 rounded-lg p-5 mt-8 flex flex-col gap-6">
        <b>{t("pay")}</b>

        <div className="flex gap-4">
          <button className={`btn btn-sm rounded-full ${payType === 0 && "btn-primary"}`}
            disabled={!!demand.demand_pay.length}
            onClick={_ => setPayType(0)}
          >{t('detailpay.payInFull')}</button>
          {/* <button className={`btn btn-sm rounded-full ${payType === 1 && "btn-primary"}`}
            onClick={_ => setPayType(1)}
          >付部分</button> */}
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex gap-4 items-center">
            <span className="text-lg">HK${formatMoney(totalPrice)}</span>
            {
              !!paid &&
              <span>{t('detailpay.Paid')}</span> ||
              <></>
            }
          </div>
          <span className="text-sm text-base-content/50">
            {`(${t('detailpay.desc')})`}
          </span>
        </div>

        {
          !!paid &&
          <div className="flex flex-col gap-6">
            <div className="flex gap-8">
              {
                payment?.pay_type === PayOf.BANK &&
                <BankAccount />
              }

              {
                payment?.pay_type === PayOf.CHEQUE &&
                <ChequeAccount />
              }

              {
                payment?.pay_type === PayOf.CHEQUE &&
                <ChequeAccount />
              }

              {
                payment?.pay_type === PayOf.PAYME &&
                <PaymeAccount />
              }

              <div className="flex flex-col gap-1">
                <h3>{payOfs[payment?.pay_type ?? -1] ?? ""}</h3>
                <img src={payment?.pay_image ?? ""} alt="payment snapshot" className="w-96 h-auto" />
              </div>
            </div>
            <button className="btn btn-primary btn-sm w-48" disabled={true}>Ensure payment</button>
          </div>
        }

        {
          !paid &&
          <>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex gap-4 items-center flex-wrap" onChange={event => {
                //@ts-ignore
                setPayOf(+event.target.value)
              }}>
                <span>{t('detailpay.choose')}</span>
                {
                  payOfs.map(([k, v]) => (
                    <span className="flex gap-1 items-center" key={k}>
                      <input id="bank" type="radio" name="payOf" className="radio radio-primary" value={k} defaultChecked={k == payOf} />
                      <label htmlFor="bank">{v}</label>
                    </span>
                  ))
                }
              </div>
            </div>

            {
              payOf === PayOf.BANK && <BankPay submit={submit} payments={demand.demand_pay.filter(val => val.pay_type === PayOf.BANK)} />
            }

            {
              payOf === PayOf.FPS && <FPSPay submit={submit} payments={demand.demand_pay.filter(val => val.pay_type === PayOf.FPS)} />
            }

            {
              payOf === PayOf.CHEQUE && <ChequePay submit={submit} payments={demand.demand_pay.filter(val => val.pay_type === PayOf.CHEQUE)} />
            }


            {
              payOf === PayOf.PAYME && <Payme submit={submit} payments={demand.demand_pay.filter(val => val.pay_type === PayOf.PAYME)} />
            }
          </>
        }
      </div>
    </div>
  )
}

type _Props = {
  submit: (snap: string) => void,
  payments: { pay_image?: string, pay_price: number, id: number }[]
}
function BankPay ({ submit, payments }: _Props) {
  const [paySnap, setPaySnap] = useState("")
  const { t } = useTranslation()


  const onChange = (event: ChangeEvent<HTMLInputElement> & DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    let [file, ..._] = event.dataTransfer?.files ?? event.target.files
    if (!file.type.startsWith("image")) {
      return
    }
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      setPaySnap(reader.result as string)
    }
  }
  return (
    <>
      <div className="flex gap-12 flex-wrap">
        <BankAccount />

        <div className="flex flex-col gap-2 items-center">
          <span>
            {t("detailpay.scshot")}
          </span>
          <label
            className={`flex justify-center items-center w-full h-32 px-10 transition border-2 border-base-300 border-dashed rounded-md appearance-none cursor-pointer hover:bg-base-300/30 hover:text-base-content/80 focus:outline-none text-base-content/60 bg-base-300/10`}
            onDrop={onChange}
            onDragEnter={e => {
              e.preventDefault()
            }}
            onDragOver={e => {
              e.preventDefault()
            }}>
            <span className="flex flex-col items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </span>
            <input type="file" className="hidden" onChange={onChange} />
          </label>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <PhotoProvider>
            {
              payments.map(val => (
                <PhotoView src={val.pay_image} key={val.id}>
                  <img src={val.pay_image} className="h-40 object-cover rounded-md shadow-md cursor-pointer" />
                </PhotoView>
              ))
            }
            {
              paySnap &&
              <PhotoView src={paySnap}>
                <img src={paySnap} className="h-40 object-cover rounded-md shadow-md cursor-pointer" />
              </PhotoView>
            }

          </PhotoProvider>
        </div>
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        <button className="btn btn-sm" onClick={_ => {
          submit(paySnap)
          setPaySnap("")
        }}>{t('detailpay.submission')}</button>
        <span className="text-sm text-base-content/60">
          {t('detailpay.message')}
        </span>
      </div>
    </>
  )
}

function FPSPay ({ submit, payments }: _Props) {
  const [paySnap, setPaySnap] = useState("")
  const { t } = useTranslation()


  const onChange = (event: ChangeEvent<HTMLInputElement> & DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    let [file, ..._] = event.dataTransfer?.files ?? event.target.files
    if (!file.type.startsWith("image")) {
      return
    }
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      setPaySnap(reader.result as string)
    }
  }
  return (
    <>
      <div className="flex gap-12 flex-wrap">
        <FPSAccount />

        <div className="flex flex-col gap-2 items-center">
          <span>
            {t("detailpay.scshot")}
          </span>
          <label
            className={`flex justify-center items-center w-full h-32 px-10 transition border-2 border-base-300 border-dashed rounded-md appearance-none cursor-pointer hover:bg-base-300/30 hover:text-base-content/80 focus:outline-none text-base-content/60 bg-base-300/10`}
            onDrop={onChange}
            onDragEnter={e => {
              e.preventDefault()
            }}
            onDragOver={e => {
              e.preventDefault()
            }}>
            <span className="flex flex-col items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </span>
            <input type="file" className="hidden" onChange={onChange} />
          </label>
        </div>

        <PhotoProvider>
          {
            payments.map(val => (
              <PhotoView src={val.pay_image} key={val.id}>
                <img src={val.pay_image} className="h-40 object-cover rounded-md shadow-md cursor-pointer" />
              </PhotoView>
            ))
          }
          {
            paySnap &&
            <PhotoView src={paySnap}>
              <img src={paySnap} className="h-40 object-cover rounded-md shadow-md cursor-pointer" />
            </PhotoView>
          }

        </PhotoProvider>
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        <button className="btn btn-sm" onClick={_ => {
          submit(paySnap)
          setPaySnap("")
        }}>{t("detailpay.submission")}</button>
        <span className="text-sm text-base-content/60">
          {t("detailpay.message")}
        </span>
      </div>
    </>
  )
}

function ChequePay ({ submit, payments }: _Props) {
  const [paySnap, setPaySnap] = useState("")
  const { t } = useTranslation()


  const onChange = (event: ChangeEvent<HTMLInputElement> & DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    let [file, ..._] = event.dataTransfer?.files ?? event.target.files
    if (!file.type.startsWith("image")) {
      return
    }
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      setPaySnap(reader.result as string)
    }
  }
  return (
    <>
      <div className="flex gap-12 flex-wrap">
        <ChequeAccount />

        <div className="flex flex-col gap-2 items-center">
          <span>
            {t("detailpay.scshot")}
          </span>
          <label
            className={`flex justify-center items-center w-full h-32 px-10 transition border-2 border-base-300 border-dashed rounded-md appearance-none cursor-pointer hover:bg-base-300/30 hover:text-base-content/80 focus:outline-none text-base-content/60 bg-base-300/10`}
            onDrop={onChange}
            onDragEnter={e => {
              e.preventDefault()
            }}
            onDragOver={e => {
              e.preventDefault()
            }}>
            <span className="flex flex-col items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </span>
            <input type="file" className="hidden" onChange={onChange} />
          </label>
        </div>

        <PhotoProvider>
          {
            payments.map(val => (
              <PhotoView src={val.pay_image} key={val.id}>
                <img src={val.pay_image} className="h-40 object-cover rounded-md shadow-md cursor-pointer" />
              </PhotoView>
            ))
          }
          {
            paySnap &&
            <PhotoView src={paySnap}>
              <img src={paySnap} className="h-40 object-cover rounded-md shadow-md cursor-pointer" />
            </PhotoView>
          }

        </PhotoProvider>
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        <button className="btn btn-sm" onClick={_ => {
          submit(paySnap)
          setPaySnap("")
        }}>{t("detailpay.submission")}</button>
        <span className="text-sm text-base-content/60">
          {t("detailpay.message")}
        </span>
      </div>
    </>
  )
}

function Payme ({ submit, payments }: _Props) {
  const [paySnap, setPaySnap] = useState("")
  const { t } = useTranslation()


  const onChange = (event: ChangeEvent<HTMLInputElement> & DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    let [file, ..._] = event.dataTransfer?.files ?? event.target.files
    if (!file.type.startsWith("image")) {
      return
    }
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      setPaySnap(reader.result as string)
    }
  }
  return (
    <>
      <div className="flex gap-12 flex-wrap">
        <PaymeAccount />

        <div className="flex flex-col gap-2 items-center">
          <span>
            {t("detailpay.scshot")}
          </span>
          <label
            className={`flex justify-center items-center w-full h-32 px-10 transition border-2 border-base-300 border-dashed rounded-md appearance-none cursor-pointer hover:bg-base-300/30 hover:text-base-content/80 focus:outline-none text-base-content/60 bg-base-300/10`}
            onDrop={onChange}
            onDragEnter={e => {
              e.preventDefault()
            }}
            onDragOver={e => {
              e.preventDefault()
            }}>
            <span className="flex flex-col items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </span>
            <input type="file" className="hidden" onChange={onChange} />
          </label>
        </div>

        <PhotoProvider>
          {
            payments.map(val => (
              <PhotoView src={val.pay_image} key={val.id}>
                <img src={val.pay_image} className="h-40 object-cover rounded-md shadow-md cursor-pointer" />
              </PhotoView>
            ))
          }
          {
            paySnap &&
            <PhotoView src={paySnap}>
              <img src={paySnap} className="h-40 object-cover rounded-md shadow-md cursor-pointer" />
            </PhotoView>
          }

        </PhotoProvider>
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        <button className="btn btn-sm" onClick={_ => {
          submit(paySnap)
          setPaySnap("")
        }}>{t("detailpay.submission")}</button>
        <span className="text-sm text-base-content/60">
          {t("detailpay.message")}
        </span>
      </div>
    </>
  )
}

type Amount = { amount: number, id: number, currency: string }

function BankAccount () {
  const { t } = useTranslation()
  return (
    <div className="rounded-md p-4 border border-base-200/80 flex flex-col gap-2 text-sm px-12 justify-center">
      <span>
        {t('detailpay.tfAddress')}
      </span>
      <span>
        {t('detailpay.account')}：HobbyLand Technology Limited
      </span>
      <span>
        {t('detailpay.bank')}：HSBC
      </span>
      <span>
        {t('detailpay.accountno')}：139 199681 838
      </span>
    </div>
  )
}

function PaymeAccount () {
  return (
    <div className="rounded-md p-4 border border-base-200/80 flex flex-col gap-2 text-sm px-12 justify-center">
      <img src={PaymeQRCode} alt="Payme QRCode" className="w-56 h-auto" />
    </div>
  )
}

function ChequeAccount () {
  const { t } = useTranslation()
  return (
    <div className="rounded-md p-4 border border-base-200/80 flex flex-col gap-2 text-sm px-12 justify-center">
      <span>
        {t("detailpay.uploaddesc")}
      </span>
    </div>
  )
}

function FPSAccount () {
  const { t } = useTranslation()
  return (
    <div className="rounded-md p-4 border border-base-200/80 flex flex-col gap-2 text-sm px-12 justify-center">
      <span>
        {t('detailpay.tfAddress')}
      </span>
      <span>
        {t('detailpay.account')}：HobbyLand Technology Limited
      </span>
      <span>
        {t('detailpay.accountno')}：105825434
      </span>
    </div>
  )
}