import { useState } from 'react'
import dayjs from 'dayjs';
import { t } from "i18next";
import Pagination from "~/components/ui/Pagination"
import relativeTime from 'dayjs/plugin/relativeTime'
import { formatMoney } from "~/utils/helpers";
import { numDiv, numMulti } from "~/utils/helpers";
import { Button } from "@/components/ui/button"
import _ from 'lodash'
import {
    CaretSortIcon,
  } from "@radix-ui/react-icons"
import { redirect } from '@remix-run/node';

dayjs.extend(relativeTime)
type OrderProps = {
    data: any[];
    onPageChange?: (pageIndex: number) => string;
    onSortChange?: (key: string, sort: string) =>void;
    total?: number;
    currentPage?: number;
    onItemClick?: (item: any) => void;
}

const UserIncomeTable = ({ data = [], onSortChange = () => "", onItemClick=() => {}}: OrderProps) => {
    const [sortedColoums, setSortedColoums] = useState({
        created_at: 'desc',
        updated_at: 'desc'
    })
    return  <div className="overflow-x-auto">
    <table className="table">
        <thead>
        <tr>
            <th>{t("incomes.userincome.orderno")}</th>  
            <th className="hidden lg:table-cell"><Button
                    className="px-0"
                    variant="ghost"
                    onClick={() => {
                        setSortedColoums((pre) => {
                            return {
                                // ...pre,
                                created_at:  sortedColoums?.["created_at"] === "desc"? "asc" : "desc"
                            }
                        })
                        onSortChange("created_at", sortedColoums?.["created_at"] === "desc"? "asc" : "desc")
                    }}
                    >
                    {t("incomes.userincome.createTime")}
                    <CaretSortIcon className="ml-2 h-4 w-4" />
                </Button></th>
            <th className="hidden lg:table-cell"><Button
                    className="px-0"
                    variant="ghost"
                    onClick={() => {
                        setSortedColoums((pre) => {
                            return {
                                // ...pre,
                                updated_at:  sortedColoums?.["updated_at"] === "desc"? "asc" : "desc"
                            }
                        })
                        onSortChange("updated_at", sortedColoums?.["updated_at"] === "desc"? "asc" : "desc")
                    }}
                    >
                    {t("incomes.userincome.modifyTime")}
                    <CaretSortIcon className="ml-2 h-4 w-4" />
                </Button></th>
            <th className="hidden lg:table-cell">{t("incomes.userincome.account")}</th>
            <th className="hidden lg:table-cell">{t("incomes.userincome.status")}</th>
            <th className="hidden lg:table-cell">{t("incomes.userincome.balance")}</th>
            <th className="hidden lg:table-cell">{t("incomes.userincome.price")}</th>
        </tr>
        </thead>
        <tbody>
        {
          data.length > 0  && data?.map((item: any, index: number) => {
               return (
                    <tr key={index} className="cursor-pointer hover:bg-base-200" onClick={() => {
                        // 进入到订单详情
                        onItemClick(item)
                    }}>
                        <td>
                            {`IN-${item?.id}`}
                            <dl className="font-normal lg:hidden">
                                <td className="sr-only lg:hidden">{t("incomes.userincome.createTime")}</td>
                                <dd className="mt-1 truncate text-gray-500 sm:text-gray-700">{dayjs(item?.created_at).format("YYYY-MM-DD")}</dd>
                                <td className="sr-only lg:hidden">{t("incomes.userincome.modifyTime")}</td>
                                <dd className="mt-1 truncate text-gray-500 sm:text-gray-700">{dayjs(item?.updated_at).format("YYYY-MM-DD")}</dd>
                                <td className="sr-only lg:hidden">{t("incomes.userincome.account")}</td>
                                <dd className="mt-1 truncate text-gray-500 sm:text-gray-700">{item?.collection_account || ''}</dd>
                                <td className="sr-only lg:hidden">{t("incomes.userincome.status")}</td>
                                <dd className="mt-1 truncate text-gray-500 sm:text-gray-700">{item?.status == 0 ? t("incomes.filter.catchstatus.0"): t("incomes.filter.catchstatus.1")}</dd>
                                <td className="sr-only lg:hidden">{t("incomes.userincome.balance")}</td>
                                <dd className="mt-1 truncate text-gray-500 sm:text-gray-700">{item?.balance !== undefined ? `HK$ ${formatMoney(item?.balance,2)}`: ''}</dd>
                                <td className="sr-only lg:hidden">{t("incomes.userincome.price")}</td>
                                <dd className="mt-1 truncate text-gray-500 sm:text-gray-700">{item?.amount !== undefined ? `HK$ ${formatMoney(item?.amount,2)}`: ''}</dd>
                            </dl>
                        </td>
                        <td className="hidden lg:table-cell">{dayjs(item?.created_at).format("YYYY-MM-DD")}</td>
                        <td className="hidden lg:table-cell">{dayjs(item?.updated_at).format("YYYY-MM-DD")}</td>
                        <td className="hidden lg:table-cell">{item?.collection_account || ''}</td>
                        <td className="hidden lg:table-cell">{item?.status == 0 ? t("incomes.filter.catchstatus.0"): t("incomes.filter.catchstatus.1")}</td>
                        <td className="hidden lg:table-cell">{item?.balance !== undefined ? `HK$ ${formatMoney(item?.balance,2)}`: ''}</td>
                        <td className="hidden lg:table-cell">{item?.amount !== undefined ? `HK$ ${formatMoney(item?.amount,2)}`: ''}</td>
                    </tr>
                )
            })
        }
        {
           data?.length <=0 && <tr className="text-center"><td colSpan={7} className="font-thin text-xs">Empty</td></tr>
        }
        </tbody>
    </table>
</div>
}

const IncomeTable = ({ data = [], onSortChange = () => "", onItemClick=() => {}}: OrderProps) => {
  
    const [sortedColoums, setSortedColoums] = useState({
        final_delivery_time: 'desc'
    })
    return  <div className="overflow-x-auto">
    <table className="table">
        <thead>
        <tr>
            <th>{t("incomes.list.orderno")}</th>
            <th className="hidden lg:table-cell">{t("incomes.list.status")}</th>
            <th className="hidden lg:table-cell">
                <Button
                    className="px-0"
                    variant="ghost"
                    onClick={() => {
                        setSortedColoums((pre) => {
                            return {
                                ...pre,
                                final_delivery_time:  sortedColoums?.["final_delivery_time"] === "desc"? "asc" : "desc"
                            }
                        })
                        onSortChange("final_delivery_time", sortedColoums?.["final_delivery_time"] === "desc"? "asc" : "desc")
                    }}
                    >
                    {t("incomes.list.deliveryDate")}
                    <CaretSortIcon className="ml-2 h-4 w-4" />
                </Button>
            </th>
            <th className="hidden lg:table-cell">{t("incomes.list.score")}</th>
            <th className="hidden lg:table-cell">{t("incomes.list.price")}</th>
        </tr>
        </thead>
        <tbody>
        {
          data.length > 0  && data?.map((item: any, index: number) => {
                let totalScore = 0;
                (item?.demand_comment || [])?.forEach((ele: any) => {
                    let allStar = ele.satisfaction! + ele.design! + ele.speed! + ele.carefulness! + ele.attitude!
                    allStar = numDiv(allStar, 25)
                    allStar = numMulti(allStar, 5)
                    totalScore+= allStar;
                });
                if (totalScore/item?.demand_comment?.length > 0) {
                    totalScore =  Math.ceil(totalScore/item?.demand_comment?.length)
                }
                // 状态
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
                const price =   _.sumBy(item?.demand_pay, function(o: any) { return o.pay_price; });
                // t(`incomes.payTypeList.${item.pay_type}`
               return (
                    <tr key={index} className="cursor-pointer hover:bg-base-200 max-w-0 w-full lg:w-1/5 whitespace-nowrap" onClick={() => {
                        // 进入到订单详情
                        onItemClick(item)
                    }}>
                        <td>
                            {`QU-${item?.id}`}
                            <dl className="font-normal lg:hidden">
                                <td className="sr-only lg:hidden">{t("incomes.list.status")}</td>
                                <dd className="mt-1 truncate text-gray-500 sm:text-gray-700">{status || '--'}</dd>
                                <td className="sr-only lg:hidden">{t("incomes.list.deliveryDate")}</td>
                                <dd className="mt-1 truncate text-gray-500 sm:text-gray-700">{item?.final_delivery_time ? dayjs(item?.final_delivery_time).format("YYYY-MM-DD"): '--'}</dd>
                                <td className="sr-only lg:hidden">{t("incomes.list.score")}</td>
                                <dd className="mt-1 truncate text-gray-500 sm:text-gray-700">{totalScore}</dd>
                                <td className="sr-only lg:hidden">{t("incomes.list.price")}</td>
                                <dd className="mt-1 truncate text-gray-500 sm:text-gray-700">{item.status === 8000 ? `HK$ ${formatMoney(item?.user_income?.amount, 2)}`:`HK$ ${formatMoney(price ? price * 0.5: 0, 2)} - ${formatMoney(price ? price * 0.65: 0, 2)}`}</dd>
                            </dl>
                        </td>
                        <td className="hidden lg:table-cell">{status}</td>
                        <td className="hidden lg:table-cell">{item?.final_delivery_time ? dayjs(item?.final_delivery_time).format("YYYY-MM-DD"): '--'}</td>                 
                        <td className="hidden lg:table-cell">{totalScore}</td>
                        <td className="hidden lg:table-cell">{item.status === 8000 ? `HK$ ${formatMoney(item?.user_income?.amount, 2)}`:`HK$ ${formatMoney(price ? price * 0.5: 0, 2)} - ${formatMoney(price ? price * 0.65: 0, 2)}`}</td>  
                    </tr>
                )
            })
        }
        {
           data?.length <=0 && <tr className="text-center"><td colSpan={5} className="font-thin text-xs">Empty</td></tr>
        }
        </tbody>
    </table>
</div>
}

const IncomeItems = (orderProps : OrderProps) => {
    const {
        data = [],
        total = 0,
        currentPage = 1,
        onPageChange = () => {return ""},
        onSortChange = () => {},
        onItemClick = () => {},
    } = orderProps;

    return (
        <div>
            <IncomeTable data={data} onSortChange={onSortChange} onItemClick={onItemClick}/>
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

const IncomeMonthItems = (orderProps : OrderProps) => {
    const {
        data = [],
        total = 0,
        currentPage = 1,
        onPageChange = () => {return ""},
        onSortChange = () => {},
        onItemClick = () => {}
    } = orderProps;

    return (
        <div>
            <UserIncomeTable data={data} onSortChange={onSortChange} onItemClick={onItemClick}/>
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
    IncomeItems,
    IncomeMonthItems,
}