import { useEffect, useState } from 'react'
import { LoaderArgs, json, redirect, ActionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useLocation, useFetcher, useSearchParams } from "@remix-run/react";
import { useRef } from "react";
import {t} from "i18next";
import { ResultCode, fault } from "~/utils/result";
import { hasRole, isAuthenticated } from "~/utils/sessions.server";
import { Roles } from "~/utils/store";
import { formatMoney } from "~/utils/helpers";
import exceljs from 'exceljs';
import { useService } from "~/services/services.server";
import dayjs from 'dayjs';
import { numDiv, numMulti } from "~/utils/helpers";
import relativeTime from 'dayjs/plugin/relativeTime'
import CashDialog, { ValueHandler, setData} from '../components/form/CashDialog';
import { useToast } from "@/components/ui/use-toast"


const { Workbook } = exceljs;
const _ = require('lodash');
dayjs.extend(relativeTime)

export async function loader (args: LoaderArgs) {
  const {
    request,
} = args;
  const service = useService("income");
  const user = await isAuthenticated(args)
  if (!user) throw redirect("/auth/signin")
  const { searchParams, pathname } = new URL(request.url)
  const isDesigner = await hasRole(Roles.PRO, args)
  if (!isDesigner) return json({ code: ResultCode.PERMISSION_DENIED, user, amount: undefined})
  const amount = await service.getUserBalance(user.id)
  const page = searchParams?.get('page');
  const currentPage = page !=null &&  page != undefined? parseInt(page, 10) : 1;
  const take = 10 as number
  const skip = (currentPage - 1) * take
  const orderPayList = await getPayListByUser(user.id, take, skip, 8000, {}) 
  return json({ code: ResultCode.OK, user, amount, orderPayList })
}
async function getPayListByUser(id: number, take: number, skip: number, status?: number, sortitems?: any) {
  const service = useService("income");
  const result = await service.getOrdersListByUser(id, take, skip, status?[status]: undefined, {...sortitems});
  return result;
}
export const action = async (args: ActionArgs) => {
  // const form = await args.request.formData()
  const form = await args.request.json()
  switch (form._action) {
      case 'download': {
        if(form.type === 'overflow') {
          const result = await generateExcelData(form.id)
          return json({ code: ResultCode.OK, result, type: 'overflow'});
        } else {
          const result = await generateIncomeExcelData(form.id)
          return json({ code: ResultCode.OK, result, type: 'billflow'});
        }
      }
      case 'cashing': {
        await cashing(form.bank,form.type,form.account,form.amount,form.userid, form.demand_ids)
        return json({code: ResultCode.OK, type: 'cashing'})
      }
      default: {
          return json({ name: "JANA", status: 0 });
      }
  }
}

async function generateExcelData(id: number) {
  const service = useService("income");
  const list = await service.getOrdersByUser(id);
  return list;
}
async function generateIncomeExcelData(id: number) {
  const service = useService("income");
  const list = await service.getIncomeOrdersByUser(id);
  return list;
}
async function cashing(blank: string,type: number,account:string,amount:number, userid: number, demand_ids: string) {
  const service = useService("income");
  const list = await service.cashing(blank,type,account,amount,userid, demand_ids);
  return list;
}
export default function Page () {
  const { toast } = useToast()
  const fetcher = useFetcher()
  const fetcher2 = useFetcher()
  const valueResetRef = useRef<ValueHandler>(null)
  const { user, code, amount, orderPayList } = useLoaderData<typeof loader>()

  if (code !== ResultCode.OK) {
    return (
      <div className="flex gap-6 bg-base-100 justify-center items-center h-full ">
        <Link to="/dashboard/applydesigner"><button className="btn btn-sm btn-primary">申请平台设计师</button></Link>
      </div>
    )
  }
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data && fetcher.data?.code === ResultCode.OK) {
      download(fetcher?.data?.result || [], fetcher.data.type);
    }
  }, [fetcher])

  useEffect(() => {
    if (fetcher2.state === "idle" && fetcher2.data && fetcher2.data?.code === ResultCode.OK) {
      toast({
        variant: "destructive",
        description: "提现操作成功，请等待平台管理员打款",
      })
    }
  }, [fetcher2])

  async function download(list: any[], type: string) {
    const workbook = new Workbook();
    workbook.creator = 'Me';
    workbook.lastModifiedBy = 'Her';
    workbook.created = new Date(1985, 8, 30);
    workbook.modified = new Date();
    workbook.lastPrinted = new Date(2016, 9, 27);
    let sheet1 = workbook.addWorksheet('Sheet1');
    let reColumns = []
    if (type === 'orderflow') {
      reColumns=[
        {header:t("incomes.list.orderno"),key:"orderno"},
        {header:t("incomes.list.status"),key:"status"},
        {header:t("incomes.list.deliveryDate"),key:"final_delivery_time"},
        // {header:t("incomes.list.paymentDate"),key:"created_at"},
        // {header:t("incomes.list.transaction"),key:"pay_type"},
        // {header:t("incomes.list.account"),key:"account"},
        {header:t("incomes.list.score"),key:"score"},
        {header:t("incomes.list.price"),key:"pay_price"},
      ];
    } else {
      reColumns=[
        {header:t("incomes.userincome.orderno"),key:"orderno"},
        {header:t("incomes.userincome.createTime"),key:"createTime"},
        {header:t("incomes.userincome.modifyTime"),key:"modifyTime"},
        {header:t("incomes.userincome.account"),key:"account"},
        {header:t("incomes.userincome.status"),key:"status"},
        {header:t("incomes.userincome.balance"),key:"balance"},
        {header:t("incomes.userincome.price"),key:"price"},
      ];
    }
   
    sheet1.columns = reColumns;
    sheet1.addRows(list?.map((item) => {
      let totalScore = 0;
      (item?.demand?.demand_comment || [])?.forEach((ele: any) => {
          let allStar = ele.satisfaction! + ele.design! + ele.speed! + ele.carefulness! + ele.attitude!
          allStar = numDiv(allStar, 25)
          allStar = numMulti(allStar, 5)
          totalScore+= allStar;
      });
      if (totalScore/item?.demand?.demand_comment?.length > 0) {
          totalScore =  Math.ceil(totalScore/item?.demand?.demand_comment?.length)
      }
      let status = '--';
      if (item?.status > 3000 && item?.status < 7000) {
          // 进行中
          status = t("incomes.orderstatus.progress")
      }
      if (item?.status ==7000) {
          // 待发放（已完成）
          status = t("incomes.orderstatus.finished")
      }
      if (item.status === 8000) {
          // 已发放
          status = t("incomes.orderstatus.income")
      }
      let _price = item?.quotation;
      if (item?.discount!==undefined && item?.discount!==0 && item?.quotation!==undefined) {
          _price = item?.quotation * item?.discount
      }
      if (type === 'orderflow') {
        return {
          orderno: `QU-${item?.demand?.id}`,
          status,
          final_delivery_time: item?.demand?.final_delivery_time ? dayjs(item?.demand?.final_delivery_time).format("YYYY-MM-DD"): '--',
          pay_type: item?.user_income_id != undefined ? t(`incomes.payTypeList.${item?.user_income?.pay_type}`): '--',
          pay_price: item.status === 8000 ? `HK$ ${formatMoney(item?.user_income?.income, 2)}`:`HK$ ${formatMoney(_price ? _price * 0.45: 0, 2)} - ${formatMoney(_price ? _price * 0.65: 0, 2)}`
        }
      } else {
        return  {
          orderno: `QU-${item?.id}`,
          createTime: dayjs(item?.created_at).format("YYYY-MM-DD"),
          modifyTime: dayjs(item?.updated_at).format("YYYY-MM-DD"),
          account: item?.collection_account || '',
          status: item?.status == 0 ? '处理中': '已到账',
          balance: item?.balance !== undefined ? `HK$ ${formatMoney(item?.balance,2)}`: '',
          price: item?.amount !== undefined ? `HK$ ${formatMoney(item?.amount,2)}`: '',
        }
      }
    }))
    const a = document.createElement("a");
    a.download = `${new Date().toLocaleTimeString()}.xlsx`;
    a.href = window.URL.createObjectURL(
      new Blob([await workbook.xlsx.writeBuffer()], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      })
    );
    a.click();
  }
  const [searchParams, setSearchParams] = useSearchParams();
  const [defaultData, setDefaultData] = useState({})
  const handleOnChange = (e: any) => {
    
    const sp = new URLSearchParams(searchParams.toString())
    if (e.target.value == 'all') {
      setSearchParams((pre) => {
        return new URLSearchParams("");
      })
    } else {
      sp.set("status", e.target.value)
      setSearchParams((pre) => {
        return sp;
      })
    }
  }
  const { pathname } = useLocation()
  const active = useRef("text-primary border-b-2 border-primary font-semibold p-2 east-in duration-150")
  const normal = useRef("text-base-content/80 font-semibold p-2 east-in duration-150")


  const {
    balance: {
      profile: {
        balance = '0'
      } = {},
      profile = {},
    } = {},
    progressAmount: {
      _sum: {
        pay_price = '0'
      } = {}
    } = {},
    paddingAmount: {
      _sum: {
        pay_price: paddingprice = '0'
      } = {}
    } = {},
  } = amount;
  return (
    <div className="flex flex-col gap-6">
      <div className="px-2 py-6 rounded-xl bg-base-100">
        <div>{t("incomes.overview.overviewdes")}</div>
        <div className="stats flex border-none border-none">
          <div className="stat place-items-center">
            <div className="stat-title">{t("incomes.overview.totalincome")}</div>
            <div className="stat-value">{formatMoney(balance,2)} <a className='text-primary font-semibold p-2 text-xs cursor-pointer' onClick={() => {
                const d = orderPayList?.map((item: any) => {
                  let totalScore = 0;
                  return {
                    demand_id: item.id,
                    status: item.status,
                    date: item.final_delivery_time,
                    totalScore: totalScore,
                    amount: item?.user_income?.amount || 0
                  }
                })
                setData(d)
                setDefaultData({
                  ...profile,
                  // data: orderPayList,
                })
              setTimeout(() => {
                cashDialog?.showModal()
              }, 300);
            }}>{t("incomes.overview.cash")}</a></div>
          </div>
          <div className="stat place-items-center border-none">
            <div className="stat-title">{t("incomes.overview.issued")}</div>
            <div className="stat-value">{`${formatMoney(paddingprice * 0.5,2)}-${formatMoney(paddingprice*0.65,2)}`}</div>
          </div>
          <div className="stat place-items-center border-none">
            <div className="stat-title">{t("incomes.overview.progress")}</div>
            <div className="stat-value">{`${formatMoney(pay_price * 0.5,2)}-${formatMoney(pay_price*0.65,2)}`}</div>
          </div>
        </div>
      </div>
      <div className="py-6 rounded-xl bg-base-100">
        <div className="px-8 flex gap-12 justify-between items-center text-xs">
          <div>
            <Link to="/dashboard/income/orderflow"
                className={pathname.endsWith("orderflow") ? active.current : normal.current}>
                {t("incomes.overview.income")}
            </Link>
            <Link to="/dashboard/income/billflow"
                className={pathname.endsWith("billflow") ? active.current : normal.current}>
                {t("incomes.overview.catch")}
            </Link>
          </div>
          <div className="flex items-center">
            {`${t("incomes.overview.status")}`}
            {pathname.endsWith("orderflow") && <select className="select h-8 min-h-0 max-h-8 border-none text-xs focus:outline-none" onChange={handleOnChange}>
              <option value='all'>{t("incomes.filter.orderstatus.all")}</option>
              <option value="8000">{t("incomes.filter.orderstatus.8")}</option>
              <option value="7000">{t("incomes.filter.orderstatus.7")}</option>
              <option value="4000">{t("incomes.filter.orderstatus.4")}</option>
            </select>}
            {pathname.endsWith("billflow") && <select className="select h-8 min-h-0 max-h-8 border-none text-xs focus:outline-none" onChange={handleOnChange}>
              <option value="all">{t("incomes.filter.catchstatus.all")}</option>
              <option value="0">{t("incomes.filter.catchstatus.0")}</option>
              <option value="1">{t("incomes.filter.catchstatus.1")}</option>
            </select>}
            <button onClick={() => {
              fetcher.submit({ _action: "download", id: user.id, type: pathname.endsWith("orderflow") ? 'orderflow': 'billflow'}, { method: "post", encType: "application/json" })
              
            }} className="btn btn-outline btn-xs border-slate-300 text-gray-500"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
            <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
          </svg>
          {t("incomes.filter.download")}</button>
          </div>
        </div>
        <div className="py-6 px-10 rounded-xl bg-base-100">
          <Outlet />
        </div>
      </div>
      <CashDialog ref={valueResetRef} defaultData={defaultData} name="cashDialog" onOk={(data) => {
        fetcher2.submit({ _action: "cashing", userid: user.id, bank: profile.bank || data.bank, type:0, account: profile.account || data.account, amount: data.price, demand_ids: data?.demand_ids}, { method: "post", encType: "application/json" })
      }}/>
    </div>
  )
}