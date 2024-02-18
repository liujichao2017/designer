//@ts-nocheck
import { Link, useFetcher, useLoaderData, useSearchParams } from "@remix-run/react"
import { SearchIcon } from "~/components/ui/Icons"
import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useTranslation } from "react-i18next"
import Datepicker from "react-tailwindcss-datepicker"
import { DemandStatus } from "~/utils/definition"
import { getEnumValues, range } from "~/utils/helpers"
import { Roles, UserProps, useAppearanceStore } from "~/utils/store"
import { LoaderArgs, json, redirect, ActionArgs } from "@remix-run/node"
import { hasRole, isAuthenticated } from "~/utils/sessions.server"
import { useService } from "~/services/services.server"
import { ResultCode, fault } from "~/utils/result"
import Pagination from "~/components/ui/Pagination"
import Avatar from "~/components/ui/Avatar"
import dayjs from "dayjs"
import CheckoutDialog from "~/components/form/CheckoutDialog"
import { IdsValidator } from "~/utils/validators"
import { GlobalLoading } from "~/components/ui/Loading"

export async function loader (args: LoaderArgs) {
  const user = await isAuthenticated(args)
  if (!user) throw redirect("/auth/signin")
  const isAdmin = await hasRole(Roles.BACK_ADMIN, args)
  if (!isAdmin) throw redirect("/auth/signin")

  const { searchParams } = new URL(args.request.url)
  const page = +(searchParams.get("page") ?? "1")
  const status = searchParams.get("status") ?? range(7, 1).join(",")
  const keyword = searchParams.get("s") ?? ""
  const start = searchParams.get("start") ?? ""
  const end = searchParams.get("end") ?? ""

  const { pages, demands } = await useService("admin", { user }).getDemandsByFilter(page, status.split(",").map(val => +val), start, end, keyword)
  return json({ code: ResultCode.OK, pages, demands })
}

export async function action (args: ActionArgs) {
  const user = await isAuthenticated(args)
  if (!user) throw redirect("/auth/signin")
  const isAdmin = await hasRole(Roles.BACK_ADMIN, args)
  if (!isAdmin) throw redirect("/auth/sigin")

  const form = await args.request.formData()
  const _action = form.get("_action")
  const service = useService("admin", { user })
  switch (_action) {
    case "checkout":
      {
        const result = IdsValidator.safeParse(Object.fromEntries(form))
        if (!result.success) {
          return fault(ResultCode.FORM_INVALID)
        }
        const orders = await Promise.all((result.data.ids ?? []).map(id => service.checkout(id)))
        return json({ code: ResultCode.OK, orders })
      }

  }
}

export default function Page () {
  const { pages, demands } = useLoaderData<typeof loader>()
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [pending, startTransition] = useTransition()

  const status = (searchParams.get("status") ?? "").split(",").map(val => +val)
  const mutation = useFetcher()

  const [checked, setChecked] = useState<number[]>([])
  const [checkoutable, _] = useState(demands.filter(val => val.status === DemandStatus.completed))

  const [settledOrder, setSettledOrder] = useState([])

  useEffect(() => {
    if (mutation.state == "idle" && mutation.data?.code === ResultCode.OK) {
      setSettledOrder(mutation.data?.orders ?? []);
      if (mutation.data?.orders.every(val => !val.reason)) {
        (window as any)?.successDialog.showModal()
      } else {
        (window as any)?.checkoutDialog.showModal()
      }
    }
  }, [mutation])

  const checkout = useCallback((ids: number[]) => {

    mutation.submit({ _action: "checkout", ids: ids.join(",") }, { method: "post" })
  }, [])
  return (
    <div className="flex flex-col">
      <GlobalLoading />

      <dialog id="successDialog" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none" className="inline-block">
              <path fillRule="evenodd" clipRule="evenodd" d="M3 16C3 8.82 8.82 3 16 3C23.18 3 29 8.82 29 16C29 23.18 23.18 29 16 29C8.82 29 3 23.18 3 16ZM20.8133 13.5813C20.8933 13.4747 20.9512 13.3532 20.9836 13.2239C21.0159 13.0946 21.0221 12.9602 21.0018 12.8285C20.9815 12.6968 20.935 12.5704 20.8651 12.4569C20.7953 12.3434 20.7034 12.245 20.595 12.1675C20.4866 12.09 20.3638 12.035 20.2337 12.0056C20.1037 11.9763 19.9692 11.9732 19.838 11.9966C19.7068 12.02 19.5816 12.0694 19.4697 12.1419C19.3579 12.2144 19.2616 12.3085 19.1867 12.4187L14.872 18.4587L12.7067 16.2933C12.5171 16.1167 12.2664 16.0205 12.0073 16.0251C11.7482 16.0297 11.5011 16.1346 11.3178 16.3178C11.1346 16.5011 11.0297 16.7482 11.0251 17.0073C11.0205 17.2664 11.1167 17.5171 11.2933 17.7067L14.2933 20.7067C14.396 20.8092 14.5197 20.8882 14.656 20.9382C14.7922 20.9881 14.9377 21.0078 15.0824 20.9959C15.227 20.984 15.3673 20.9407 15.4935 20.8691C15.6197 20.7975 15.7289 20.6993 15.8133 20.5813L20.8133 13.5813Z" fill="#5AD298" />
            </svg>
            批量操作成功
          </h3>
          <p className="py-4">已批量将{mutation.data?.orders.filter(val => !val.reason)?.length || 0}笔订单打款给对应设计师</p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-primary">{t("ok")}</button>
            </form>
          </div>
        </div>
      </dialog>


      <CheckoutDialog
        orders={settledOrder.map(val => ({
          id: val.demand?.id ?? 0,
          score: val.score,
          amount: val.income,
          deliveryAt: val.demand?.full_delivery_time ?? "",
          reason: val.reason
        }))} />
      <div className="tabs">
        <a className={`tab tab-lg tab-lifted ${status.map(val => val < 8).every(it => it) ? "tab-active" : ""}`}
          onClick={_ => {
            setSearchParams(prev => {
              prev.delete("status")
              return prev
            })
          }}>
          {t("salary.unpaid")}</a>
        <a className={`tab tab-lg tab-lifted ${status.includes(DemandStatus.settled) ? "tab-active" : ""}`}
          onClick={_ => {
            setSearchParams(prev => {
              prev.set("status", "8")
              return prev
            })
          }}>{t("salary.paid")}</a>

        <a className={`tab tab-lg tab-lifted ${status.map(val => val > 8).every(it => it) ? "tab-active" : ""}`}
          onClick={_ => {
            setSearchParams(prev => {
              prev.set("status", "9,10,11")
              return prev
            })
          }}>{t("salary.remitted")}</a>
      </div>

      <div className="bg-base-100 rounded-md mb-20 p-2">
        <Filter checkout={() => {
          checkout(checked)
        }} />
        <div className="overflow-x-auto mt-4">
          <table className="table">
            <thead>
              <tr>
                <th>
                  <input type="checkbox" className="checkbox checkbox-primary"
                    checked={checkoutable.length && checked.length === checkoutable.length}
                    disable={checkoutable.length}
                    onChange={e => {
                      setChecked(e.target.checked ? checkoutable.map(val => val.id) : [])
                    }} />
                </th>
                <th>{t("salary.orderno")}</th>
                <th>{t("designer")}</th>
                <th>{t("salary.name")}</th>
                <th>{t("salary.status")}</th>
                <th>{t("salary.amount")}</th>
                <th>{t("salary.time")}</th>
                <th>{t("salary.operation")}</th>
              </tr>
            </thead>

            <tbody className="text-sm">
              {
                demands.map(d => {
                  return (
                    <tr key={d.id}>
                      <th>
                        <input type="checkbox" className="checkbox checkbox-primary"
                          disabled={d.status !== DemandStatus.completed}
                          checked={checked.includes(d.id)}
                          onChange={e => {
                            // console.log(e.target.checked, checked.filter(val => val.id !== d.id), checked)
                            // setTimeout(() => console.log(checked, d.id), 500)
                            setChecked(prev => {
                              return e.target.checked ? [...prev, d.id] : prev.filter(val => val !== d.id)
                            })
                          }} />
                      </th>
                      <th>
                        <Link to={"/dashboard/admin/work/" + d.id + "/detail"} className="link link-primary font-bold">
                          QU-{d.id}
                        </Link>
                      </th>
                      <th>
                        {
                          d.designer_user_id &&
                          <Link to={"/portfolio/" + d.designer_user_id} className="flex items-center gap-2">
                            <Avatar user={d.designer as UserProps} size="sm" />
                            <span>{d.designer?.name ?? ""}</span>
                          </Link> ||
                          <></>
                        }
                      </th>
                      <th>{d.name}</th>
                      <th>{t("demandorder.detail.demandStatusList." + d.status)}</th>
                      <th>{d.quotation ?? 0}</th>
                      <th>{dayjs(d.created_at).format("YYYY-MM-DD")}</th>
                      <th>
                        {/* <span>...</span> */}
                        <div className="flex gap-3 items-center">

                          <button className="link link-primary btn btn-ghost bg-base-100"
                            disabled={d.status !== DemandStatus.completed}
                            onClick={_ => checkout([d.id])}>{t("salary.checkout")}</button>
                          <Link to={"/dashboard/admin/work/" + d.id + "/detail"} className="link">{t("salary.detail")}</Link>
                        </div>
                      </th>
                    </tr>
                  )
                })
              }

            </tbody>
          </table>

          <div className="flex justify-center mt-8">
            <Pagination
              totalPages={pages}
              showDirection={true}
              currentPage={Number(searchParams.get("page") ?? 1)}
              linkGenerator={(page: number) => {
                const sp = new URLSearchParams(searchParams.toString())
                sp.set("page", page + "")
                return "/dashboard/admin/salary?" + sp.toString()
              }}
            />
          </div>
        </div>
      </div>
    </div >
  )
}

function Filter ({ checkout }: { checkout: () => void }) {
  const { t } = useTranslation()
  const lang = useAppearanceStore(s => s.lang)
  const [searchParams, setSearchParams] = useSearchParams()
  const status = (searchParams.get("status") ?? "").split(",").map(val => +val)
  const hasOperate = status.map(val => val < 8).every(it => it)


  const searchInputRef = useRef<HTMLInputElement>(null)
  const [initDate, _] = useState({
    startDate: searchParams.has("start") ? dayjs(searchParams.get("start")).toDate() : null,
    endDate: searchParams.has("end") ? dayjs(searchParams.get("end")).toDate() : null,
  })
  return (
    <div className="flex pt-3 justify-between">
      <div className="flex gap-3">
        {
          hasOperate &&
          <select className="select select-bordered select-sm"
            defaultValue={searchParams.has("status") ? Number(searchParams.get("status")) : -1}
            onChange={event => {
              setSearchParams(prev => {
                prev.set("status", event.target.value)
                return prev
              })
            }}>
            <option value={-1}
            >{t(`all`)}</option>
            {
              getEnumValues(DemandStatus).filter(v => v <= 7000).map((k, v) => {
                return <option value={v} key={k}
                >{t(`demandorder.detail.demandStatusList.${k / 1000}`)}</option>
              })
            }
          </select>
        }

        <div className="w-72">
          <Datepicker
            i18n={lang === "zh" ? "zh" : lang === "en" ? "en" : "zh-TW"}
            inputClassName="w-full input input-bordered input-sm"
            value={initDate}
            onChange={(date) => {
              setSearchParams(prev => {
                prev.set("start", date?.startDate?.toString() ?? "")
                prev.set("end", date?.endDate?.toString() ?? "")
                return prev
              })
            }}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <form className="join" onSubmit={event => {
          event.preventDefault()
          const s = searchInputRef.current!.value
          searchInputRef.current!.value = ""
          if (s) {
            setSearchParams(prev => {
              prev.set("s", s)
              return prev
            })
          }
        }}>
          <input type="text"
            defaultValue={searchParams.get("s") ?? ""}
            className="input input-bordered input-sm join-item"
            placeholder={t("salary.searchPlaceHolder")}
            ref={searchInputRef} />
          <button type="submit" className="btn btn-sm join-item">
            <SearchIcon size={4} />
          </button>
        </form>
        {
          hasOperate &&
          <button className="btn btn-sm" onClick={checkout}>批量结算</button>
        }
      </div>
    </div>
  )
}