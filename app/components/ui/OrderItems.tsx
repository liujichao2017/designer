import { Link } from "@remix-run/react"
import {  useRef } from 'react'
import dayjs from 'dayjs';
import { t } from "i18next";
import Pagination from "~/components/ui/Pagination"
import relativeTime from 'dayjs/plugin/relativeTime'
import { formatMoney } from "~/utils/helpers";
import TimelineDialog, { ValueHandler} from '../form/TimelineDialog';
import { Button } from "@/components/ui/button"
import { DemandStatus } from '@/utils/definition'
import {
    DotsHorizontalIcon,
  } from "@radix-ui/react-icons"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"

dayjs.extend(relativeTime)
type OrderProps = {
    data: any[];
    activeKey?: number;
    // tabItems: any[];
    onAccept: (data: {
        id: number,
        draftTime: Date;
        complatelTime: Date
        finalTime: Date,
        toUser: number,
    }) => void;
    onReject: (id: number, toUser: number) => void;
    onPageChange?: (pageIndex: number) => string;
    total?: number;
    currentPage?: number;
    onTabChanged?: (key: number) => void;
}

const OrderTable = ({ data = [], onAccept=() => {}, onReject=() => {} }: OrderProps) => {
    const valueResetRef = useRef<ValueHandler>(null)
    const typeBadge = {
        [DemandStatus.draft]: <div className="badge badge-ghost text-[#2F4CDD] whitespace-nowrap">{t("demandorder.detail.demandStatusList.0")}</div>,
        [DemandStatus.obligation]: <div className="badge badge-ghost text-[#2F4CDD] whitespace-nowrap">{t("demandorder.detail.demandStatusList.1")}</div>,
        [DemandStatus.pending]: <div className="badge badge-ghost text-[#2F4CDD] whitespace-nowrap">{t("demandorder.detail.demandStatusList.2")}</div>,
        [DemandStatus.unreception]: <div className="badge badge-ghost text-[#2F4CDD] whitespace-nowrap">{t("demandorder.detail.demandStatusList.3")}</div>,
        [DemandStatus.progressing]: <div className="badge badge-success whitespace-nowrap">{t("demandorder.detail.demandStatusList.4")}</div>,
        [DemandStatus.canceled]: <div className="badge badge-ghost whitespace-nowrap">{t("demandorder.detail.demandStatusList.5")}</div>,
        [DemandStatus.uncommented]: <div className="badge badge-warning whitespace-nowrap">{t("demandorder.detail.demandStatusList.6")}</div>,
        [DemandStatus.completed]: <div className="badge badge-ghost text-[#C4C9D2] whitespace-nowrap">{t("demandorder.detail.demandStatusList.7")}</div>,
        [DemandStatus.settled]: <div className="badge badge-ghost text-[#C4C9D2] whitespace-nowrap">{t("demandorder.detail.demandStatusList.8")}</div>,
        [DemandStatus.remiting]: <div className="badge badge-ghost text-[#C4C9D2] whitespace-nowrap">{t("demandorder.detail.demandStatusList.9")}</div>,
        [DemandStatus.remitFail]: <div className="badge badge-ghost text-[#C4C9D2] whitespace-nowrap">{t("demandorder.detail.demandStatusList.10")}</div>,
        [DemandStatus.remitSuccess]: <div className="badge badge-ghost text-[#C4C9D2] whitespace-nowrap">{t("demandorder.detail.demandStatusList.11")}</div>,
    }

    return  <div className="overflow-x-auto">
    <table className="table">
        {/* head */}
        <thead>
        <tr>
            <th>{t("demandorder.order.no")}</th>
            <th className="hidden lg:table-cell">{t("demandorder.order.project")}</th>
            <th className="hidden lg:table-cell">{t("demandorder.order.customerName")}</th>
            <th className="hidden lg:table-cell">{t("demandorder.order.price")}</th>
            <th className="hidden lg:table-cell">{t("demandorder.order.finishedDate")}</th>
            <th className="hidden lg:table-cell">{t("demandorder.order.status")}</th>
            <th>{t("demandorder.order.operation")}</th>
        </tr>
        </thead>
        <tbody>
        {
          data.length > 0  && data?.map((item: any, index: number) => {
                let psrc; //默认图
                try {
                    if (item.img_list) {
                      const imglist = JSON.parse(item.img_list);
                      psrc = imglist.length > 0 ? imglist?.[0]?.litpic_url : '';
                    }
                } catch(e){}
            
                let _price = item?.quotation;
                if (item?.discount!==undefined && item?.discount!==0 && item?.quotation!==undefined) {
                    _price = item?.quotation * item?.discount
                }
                return (
                    <tr key={index}>
                        <td className="max-w-0 w-full lg:w-1/5 whitespace-nowrap">
                            <div className="whitespace-nowrap">{`QU-${item.id}`}</div>
                            <dl className="font-normal lg:hidden">
                                <td className="sr-only lg:hidden">{t("demandorder.order.project")}</td>
                                <dd className="mt-1 truncate text-gray-500 sm:text-gray-700">
                                    {item?.type !== undefined ? <Link className="text-primary font-semibold p-0" to={`/dashboard/order/${item.id}/demand`} >{t(`demandorder.detail.typeItem.${item?.type}`)}</Link>: '--'}
                                </dd>
                                <td className="sr-only lg:hidden">{t("demandorder.order.customerName")}</td>
                                <dd className="mt-1 truncate text-gray-500 sm:text-gray-700">{item?.name || '--'}</dd>
                                <td className="sr-only lg:hidden">{t("demandorder.order.price")}</td>
                                <dd className="mt-1 truncate text-gray-500 sm:text-gray-700">{`HK$ ${formatMoney(_price ? _price * 0.45: 0, 2)} - ${formatMoney(_price ? _price * 0.65: 0, 2)}`}</dd>
                                <td className="sr-only lg:hidden">{t("demandorder.order.finishedDate")}</td>
                                <dd className="mt-1 truncate text-gray-500 sm:text-gray-700">{item?.final_delivery_time ? dayjs(item?.final_delivery_time).format('YYYY-MM-DD'): '--'}</dd>
                                <td className="sr-only lg:hidden">{t("demandorder.order.status")}</td>
                                <dd className="mt-1 truncate text-gray-500 sm:text-gray-700">{item?.status != undefined ? typeBadge[item?.status] : '--'}</dd>
                            </dl>
                        </td>
                        <td className="hidden lg:table-cell">
                            <div className="flex items-center space-x-3">
                                {/* <div className="avatar">
                                    <div className="w-12 h-12">
                                        {psrc ? <img src={psrc} /> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 self-center">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>}
                                    </div>
                                </div> */}
                                <div>
                                    <div className="text-sm whitespace-nowrap">
                                        {item?.type !== undefined ? <Link className="text-primary font-semibold p-2" to={`/dashboard/order/${item.id}/demand`} >{t(`demandorder.detail.typeItem.${item?.type}`)}</Link>: '--'}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td className="hidden lg:table-cell"><div>{item?.name || '--'}</div></td>
                        <td className="hidden lg:table-cell">{`HK$ ${formatMoney(_price ? _price * 0.45: 0, 2)} - ${formatMoney(_price ? _price * 0.65: 0, 2)}`}</td>
                        <td className="hidden lg:table-cell">{item?.final_delivery_time ? dayjs(item?.final_delivery_time).format('YYYY-MM-DD'): '--'}</td>
                        <td className="hidden lg:table-cell">{item?.status != undefined ? typeBadge[item?.status] : '--'}</td>                   
                        <td>
                            <div className="relative group w-200 bg-base-100">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                        <DotsHorizontalIcon className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-base-100">
                                        {[DemandStatus.unreception].indexOf(item.status) > -1 && <DropdownMenuItem
                                            onClick={() => {
                                                valueResetRef?.current!.reset(item);
                                                timeLineDialog?.showModal()
                                            }}
                                         >
                                        {t("demandorder.info.accept")}
                                        </DropdownMenuItem>}
                                        {/* <DropdownMenuSeparator /> */}
                                        {[DemandStatus.unreception].indexOf(item.status) > -1 && <DropdownMenuItem onClick={() => {
                                               onReject(item.id, item.user_id)
                                        }}>{t("demandorder.info.reject")}</DropdownMenuItem>}
                                        {/* <DropdownMenuSeparator /> */}
                                        <DropdownMenuItem><Link className="w-full" to={`/dashboard/order/${item.id}/demand`}>{t("demandorder.info.detail")}</Link></DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </td>
                    </tr>
                )
            })
        }
        {
           data?.length <=0 && <tr className="text-center"><td colSpan={6} className="font-thin text-xs">Empty</td></tr>
        }
        <TimelineDialog  ref={valueResetRef} name="timeLineDialog" onOk={onAccept}/>
        </tbody>
    </table>
</div>
}

const OrderItems = (orderProps : OrderProps) => {
    const {
        data = [],
        total = 0,
        currentPage = 1,
        onAccept = () => {},
        onReject = () => {},
        onPageChange = () => {return ""}
    } = orderProps;

    return (
        <div>
            <OrderTable data={data} onAccept={onAccept} onReject={onReject}/>
            <div className="flex justify-center mt-8">
                <Pagination
                    totalPages={total}
                    showDirection={true}
                    currentPage={currentPage}
                    linkGenerator={(page: number) => {
                        return onPageChange(page)
                    }}
                />
            </div>
        </div>)
}

export {
    OrderItems,
}