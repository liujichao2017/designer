import { t } from "i18next";
import { ReactNode, useState, useRef, useTransition } from "react";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime'
import Avatar from "~/components/ui/Avatar";
import { range, formatMoney } from "~/utils/helpers";
import TimelineDialog, { ValueHandler } from '../form/TimelineDialog';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Link } from "@remix-run/react"
import Contact from "~/components/ui/demand/Contact";
import Designer from "~/components/ui/demand/Designer";
import Design from "~/components/ui/demand/Design";
import Printing from "~/components/ui/demand/Printing";
import Preference from "~/components/ui/demand/Preference";
import Quotation from "~/components/ui/demand/Quotation";
import { DemandStatus, TimelineStatus } from '@/utils/definition'
import { useTranslation } from "react-i18next";


const placeholders = new Map<number, string>()
placeholders.set(1, `1. logo 名稱是：
2.產品或服務類型：
3. 營運理念：
4 品牌名稱解釋：
5.設計必須的融入特徵/元素： 
6.字體/顏色偏好：
7.設計風格：例如:企業、專業、樸素、復古、高級、科技......
8. 心儀的 logo 相片 (如 有，請提供於備注)`)
placeholders.set(3, `名稱：
職位：
電話：
電子郵件地址：
其他備註：`)

dayjs.extend(relativeTime)
type RequirementDetailProps = {
    data?: Detail
}

type TabProps = {
    defaultActiveKey: string;
    items: TabItemType[];
    useLinkTab?: boolean;
    onChange?: (activeKey: string) => void;
}
export type TabItemType = {
    key: string;
    label: ReactNode;
    children: ReactNode;
}

export type EvaluateProps = {
    scoreItems: ScoreData[];
    type?: 'self' | 'demand';
    totalScore?: number;
}
export type ScoreData = {
    score: number;
    content: string;
    images: string[],
    designer: any;
    created_at: string;
}
type ScoreProps = {
    data?: ScoreData;
}

type Detail = {
    services?: number;
    name?: string;
    type?: number;
    size?: string; // 尺寸
    page?: string; // 页数
    order_price?: string;
    created_at?: string;
    remark?: string;
    email?: string;
    contact_number: string;
    printing_number: number;
    printing_page: number;
    printing_size: number;
    cover_paper: string;
    inner_paper: string;
    staple: string;
    finish: string;
    img_list: any[];
    category: string;
    attachments?: Attachment[];
    pictures: string[];
}

type Attachment = {
    name?: string;
    link?: string;
    description?: string;
}

type OrderDetailProps = {
    tabItems: TabItemType[];
    onTabChanged?: (activeKey: string) => void;
    useLinkTab?: boolean;
    defaultActiveKey?: string;
    activeKey?: string;
}
type StatusProps = {
    data: StatusDetail,
    designerQuotation: string,
    onAccept: (data: {
        id: number,
        draftTime: Date;
        complatelTime: Date;
        finalTime: Date;
        toUser: number;
    }) => void;
    onReject: (id: number, toUser: number) => void;
    onBegin: (id: number, toUser: number) => void;
}

type StatusDetail = {
    id: number;
    type?: number;
    status?: number;
    name?: string;
    avatarUrl?: string;
    order_price?: number;
    quotation?: number,
    discount?: number,
    final_delivery_time?: string;
    full_delivery_time?: string;
    draft_delivery_time: string;
    user_id: number;
    timeline_status: number;
    documents: any;
    project: any;
}

type PayProps = {
    data?: PayDetail,
}

type PayDetail = {
    order_price?: string;
    pay_type?: string;
}

const OrderDetail = ({ onTabChanged, tabItems: items, useLinkTab = false, defaultActiveKey = '' }: OrderDetailProps) => {

    return (
        <OrderTab items={items} defaultActiveKey={defaultActiveKey} onChange={onTabChanged} useLinkTab={useLinkTab} />
    )

}

const OrderTab = (props: TabProps) => {
    const {
        defaultActiveKey,
        items = [],
        onChange = () => { },
        useLinkTab = false,
    } = props;

    const [activeKey, setActiveKey] = useState(defaultActiveKey);

    function tabClick (activeKey: string) {
        setActiveKey(activeKey)
        onChange(activeKey)
    }

    function getItemChildrenByKey (items: TabItemType[], key: string) {
        return items.find((ele: TabItemType) => {
            return ele.key == key;
        })?.children
    }

    const childrenItem = getItemChildrenByKey(items, activeKey)
    return (
        <div className="flex flex-col gap-4 bg-base md:rounded-md w-full p-0">
            <div className="tabs">
                {items?.map((element: TabItemType, index: number) => {
                    return <div key={index} className={`tab ${activeKey == element.key ? 'tab-active' : ''}`} onClick={() => { tabClick(element.key) }}>{element.label}</div>
                })}
            </div>
            {childrenItem}
        </div>
    )
}

const RequirementDetail = ({ data }: RequirementDetailProps) => {
    const {
        services = 0,
        type = '',
        status,
        size = '',
        page = '',
        order_price = '--',
        created_at = '',
        remark = '',
        email,
        contact_number,
        img_list = [],
        attachments = [],
        pictures = [],
        name,
    } = data || {};

    return (
        <div className="flex flex-col gap-4 bg-base-100 md:rounded-md w-full p-5">
            <div>{t("demandorder.detail.demandInfo")}</div>
            <div className="grid grid-cols-6 gap-4">
                <div>
                    <div className="font-thin text-xs py-2">{t("demandorder.detail.services")}</div>
                    <div className="text-xs py-2">{t(`demandorder.detail.servicesItem.${services}`)}</div>
                </div>
                <div>
                    <div className="font-thin text-xs py-2">{t("demandorder.detail.type")}</div>
                    <div className="text-xs py-2">{t(`demandorder.detail.typeItem.${type}`)}</div>
                </div>
                <div>
                    <div className="font-thin text-xs py-2">{t("demandorder.detail.publishTime")}</div>
                    <div className="text-xs py-2">{dayjs(created_at).format('YYYY-MM-DD hh:mm')}</div>
                </div>
            </div>
            <div className="grid grid-cols-6 gap-4">
                {
                    type == 0 && <>
                        <div>
                            <div className="font-thin text-xs py-2">{t("demandorder.detail.category")}</div>
                            <div className="text-xs py-2">{data?.category ? t(`demandorder.detail.categoryItem.${data?.category}`) : '--'}</div>
                        </div>
                        <div>
                            <div className="font-thin text-xs py-2">{t("demandorder.detail.size")}</div>
                            <div className="text-xs py-2">{data?.size ? t(`demandorder.detail.sizeItem.${data?.size}`) : '--'}</div>
                        </div>
                        <div>
                            <div className="font-thin text-xs py-2">{t("demandorder.detail.pages")}</div>
                            <div className="text-xs py-2">{data?.page || '--'}</div>
                        </div>
                    </>
                }
                {
                    type === 1 && <>
                        <div>
                            <div className="font-thin text-xs py-2">logDesign</div>
                            <div className="text-xs py-2">{data?.logo_design || '--'}</div>
                        </div>
                    </>
                }
                {
                    type == 2 && <>
                        <div>
                            <div className="font-thin text-xs py-2">{t("demandorder.detail.size")}</div>
                            <div className="text-xs py-2">{data?.size ? t(`demandorder.detail.sizeItem.${data?.size}`) : '--'}</div>
                        </div>
                        <div>
                            <div className="font-thin text-xs py-2">folding</div>
                            <div className="text-xs py-2">{data?.folding || '--'}</div>
                        </div>
                    </>
                }
                {
                    type == 3 && <>
                        <div>
                            <div className="font-thin text-xs py-2">{t("demandorder.detail.size")}</div>
                            <div className="text-xs py-2">{data?.size ? t(`demandorder.detail.sizeItem.${data?.size}`) : '--'}</div>
                        </div>
                    </>
                }
            </div>
            {[1, 2].indexOf(services) > -1 && <div className="grid grid-cols-6 gap-4">
                <div>
                    <div className="font-thin text-xs py-2">{t("demandorder.detail.printingNumber")}</div>
                    <div className="text-xs py-2">{data?.printing_number || '--'}</div>
                </div>
                <div>
                    <div className="font-thin text-xs py-2">{t("demandorder.detail.printingPage")}</div>
                    <div className="text-xs py-2">{data?.printing_page || '--'}</div>
                </div>
                <div>
                    <div className="font-thin text-xs py-2">{t("demandorder.detail.printingSize")}</div>
                    <div className="text-xs py-2">{data?.printing_size ? t(`demandorder.detail.printingSizeItem.${data?.printing_size}`) : '--'}</div>
                </div>
                <div>
                    <div className="font-thin text-xs py-2">{t("demandorder.detail.coverPaper")}</div>
                    <div className="text-xs py-2">{data?.cover_paper ? t(`demandorder.detail.coverPaperItem.${data?.cover_paper}`) : '--'}</div>
                </div>
                <div>
                    <div className="font-thin text-xs py-2">{t("demandorder.detail.innerPaper")}</div>
                    <div className="text-xs py-2">{data?.inner_paper || '--'}</div>
                </div>
                <div>
                    <div className="font-thin text-xs py-2">{t("demandorder.detail.staple")}</div>
                    <div className="text-xs py-2">{data?.staple ? t(`demandorder.detail.stapleItem.${data?.staple}`) : '--'}</div>
                </div>
                <div>
                    <div className="font-thin text-xs py-2">{t("demandorder.detail.finish")}</div>
                    <div className="text-xs py-2">{
                        (() => {
                            console.log(data?.finish?.length, data?.finish)
                            let finished = [];
                            if (data?.finish) {
                                try {
                                    finished = JSON.parse(data.finish)
                                } catch (e) { }
                            }
                            return <div>{finished?.map(ele => <span className="mx-0.5">{t(`demandorder.detail.finishItem.${ele}`)}</span>)}</div>
                        })()
                    }</div>
                </div>
            </div>}
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <div className="font-thin text-xs">{t("demandorder.detail.requirement")}</div>
                    <div>{remark || '--'}</div>
                </div>
            </div>
            {/* <div className ="grid grid-cols-1 gap-4">
                <div> */}
            <div className="font-thin text-xs">{t("demandorder.detail.attachment")}</div>
            <div className="grid grid-cols-8 gap-4">
                {/* {img_list?.map((item: any, index: number) => {
                    return <div key={index} className="bg-white rounded-md aspect-square border border-solid bg-contain h-50"
                    style={{ backgroundImage: `url('${item.thumbnail}')`}} />
                })
            } */}
                {img_list?.map((value, index) => {
                    return (<div key={index}>
                        <img className="w-40 rounded-lg object-cover aspect-[4/5]" src={value.thumbnail} />
                    </div>)
                })}</div>
            <div>{t("demandorder.detail.customerInfo")}</div>
            {status > 3000 && <div className="grid grid-cols-4 gap-4">
                <div>
                    <div className="font-thin text-xs py-2">{t("demandorder.detail.companyname")}</div>
                    <div className="text-xs py-2">{name}</div>
                </div>
                <div>
                    <div className="font-thin text-xs py-2">{t("demandorder.detail.email")}</div>
                    <div className="text-xs py-2">{email}</div>
                </div>
                <div>
                    <div className="font-thin text-xs py-2">Whatsapp</div>
                    <div className="text-xs py-2">{contact_number}</div>
                </div>
            </div>}
            <div>{t("demandorder.detail.customerPreferences")}</div>
            <div className="grid grid-cols-8 gap-4" >
                {
                    pictures?.map((val: any, index: number) => {
                        return (<div key={index} className="rounded overflow-hidden mr-2.5"><img src={val} className="object-cover h-40 w-40" /></div>)
                    })
                }
            </div>
        </div>
    )
}


const RequirmentDetialNew = ({ demandDetail, addAddition }: { demandDetail: any, addAddition?: (s: string) => void }) => {

    const contact = {
        name: demandDetail?.name || '--',
        whatsapp: demandDetail?.whatsapp || demandDetail.contact_number || '--',
        email: demandDetail?.email || '--'
    }
    const design = {
        // foldingType: demandDetail?.folding,
        // final_delivery_time: demandDetail?.final_delivery_time,
        // size: demandDetail?.size,
        // type: demandDetail?.type,
        type: demandDetail.type,
        category: demandDetail.category,
        size: demandDetail.size,
        pages: demandDetail.page,
        logoSummary: demandDetail.logo_design,
        logo: demandDetail.logo_type,
        foldingType: demandDetail.folding,
        final_delivery_time: demandDetail.final_delivery_time
    }
    let bussiness
    try {
        bussiness = JSON.parse(demandDetail.bussiness_card ?? "{}");
    }
    catch (ex) {

    }

    const attachment = {
        remark: demandDetail.remark,
        link: demandDetail.attach_link,
        date: demandDetail.final_delivery_time,
        images: demandDetail.img_list,
    }
    const print = {
        quality: demandDetail.printing_number,
        pages: demandDetail.printing_page,
        size: demandDetail.printing_size,
        coverPaper: demandDetail.cover_paper,
        innerPaper: demandDetail.inner_paper,
        bindingType: demandDetail.folding,
        finishOptions: demandDetail.finish && JSON.parse(demandDetail.finish)
    }
    const services = demandDetail?.services || 0
    const { t } = useTranslation()
    const additionRef = useRef<HTMLTextAreaElement>(null)
    const [_, startTransition] = useTransition()
    const [addition, setAddition] = useState(demandDetail?.designer_addition ?? "")
    return (
        <>
            <dialog id="additionDialog" className="modal">
                <div className="modal-box rounded-sm">
                    <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                    </form>
                    <h3 className="font-bold flex justify-center">{t("demand.stepList.4")}</h3>
                    <div className="flex flex-col gap-2">
                        <span>{t("demand.stepList.4")}</span>
                        <textarea rows={12} placeholder={placeholders.get(demandDetail?.type) ?? ""} value={addition}
                            className="textarea rounded-sm p-1" ref={additionRef} onChange={event => {
                                setAddition(event.currentTarget.value)
                            }} />
                        <div className="flex justify-end mt-2 gap-2">
                            <button className="btn btn-sm" onClick={_ => (window as any)?.additionDialog.close()
                            }>{t("cancel")}</button>
                            <button className="btn btn-sm btn-primary" onClick={_ => {
                                !!addAddition && addAddition(additionRef.current!.value)
                                additionRef.current!.value = ""
                                startTransition(() => (window as any)?.additionDialog.close())
                            }}>{t("ok")}</button>
                        </div>
                    </div>


                </div>
            </dialog>

            <div className="flex justify-end md:col-span-2 gap-2 text-sm px-4 pt-4">
                <button className="link link-hover flex items-center hover:link-primary hover:text-primary" onClick={_ => {
                    (window as any)?.additionDialog.showModal()
                }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <span>{t("demand.stepList.4")}</span>
                </button>

            </div>

            <div className="grid md:grid-cols-2 grid-cols-1 lg:gap-y-1 gap-y-2 gap-x-10 px-4 pt-8 bg-base-100">
                {demandDetail?.status > 3000 && <Contact infomation={{ ...contact }} />}
                <Design service={services || 0} design={design} bussiness={bussiness} attach={attachment} />
                {
                    print && [0, 2, 3, 4].includes(design?.type ?? -1) && [1, 2].includes(services ?? -1) &&
                    <Printing print={print} />
                }

                <Preference images={demandDetail.selectedImages ?? []}
                    addition={demandDetail?.addition ?? ""} designerAddition={demandDetail?.designer_addition ?? ""} />

            </div>
        </>
    )
}

const OrderStatus = ({ data, designerQuotation, onReject, onAccept, onBegin }: StatusProps) => {
    const valueResetRef = useRef<ValueHandler>(null)
    const typeBadge = {
        [DemandStatus.unreception]: <div className="badge badge-ghost text-[#2F4CDD] whitespace-nowrap mx-1">{t("demandorder.detail.demandStatusList.3")}</div>,
        [DemandStatus.progressing]: <div className="badge badge-success whitespace-nowrap mx-1">{t("demandorder.detail.demandStatusList.4")}</div>,
        [DemandStatus.canceled]: <div className="badge badge-ghost whitespace-nowrap mx-1">{t("demandorder.detail.demandStatusList.5")}</div>,
        [DemandStatus.uncommented]: <div className="badge badge-warning whitespace-nowrap mx-1">{t("demandorder.detail.demandStatusList.6")}</div>,
        [DemandStatus.completed]: <div className="badge badge-ghost text-[#C4C9D2] whitespace-nowrap mx-1">{t("demandorder.detail.demandStatusList.7")}</div>,
        [DemandStatus.settled]: <div className="badge badge-ghost text-[#C4C9D2] whitespace-nowrap mx-1">{t("demandorder.detail.demandStatusList.8")}</div>,
        [DemandStatus.remiting]: <div className="badge badge-ghost text-[#C4C9D2] whitespace-nowrap mx-1">{t("demandorder.detail.demandStatusList.9")}</div>,
        [DemandStatus.remitFail]: <div className="badge badge-ghost text-[#C4C9D2] whitespace-nowrap mx-1">{t("demandorder.detail.demandStatusList.10")}</div>,
        [DemandStatus.remitSuccess]: <div className="badge badge-ghost text-[#C4C9D2] whitespace-nowrap mx-1">{t("demandorder.detail.demandStatusList.11")}</div>,
    }
    const {
        type,
        status = '',
        // order_price = 0,
        quotation,
        discount,
        name = '',
        avatarUrl = '',
        timeline_status,
        full_delivery_time,
        draft_delivery_time,
        final_delivery_time,
        demand_comment = [],
        id = 0,
    } = data || {};
    // 已经分组后的设计文件
    // 1 是初稿
    // 2 是全稿
    const {
        books = []
    }= data?.project ?? {}
    const groupedDocument = books?.reduce((result, item) => {
        (result[item.type] = result[item.type] || []).push(item);
        return result;
    }, {});

    let _price = quotation;
    if (discount !== undefined && discount !== 0 && quotation !== undefined) {
        _price = quotation * discount
    }

    const now = dayjs();
    const targetDate = dayjs(full_delivery_time || final_delivery_time);
    const targetDraftDate = dayjs(draft_delivery_time);
    const hoursUntilTargetDate = targetDate.diff(now, 'hour');
    const hoursUntilDraftTargetDate = targetDraftDate.diff(now, 'hour');
    let desc;
    if (status == DemandStatus.unreception) {
        // 等待接单
        desc = t("demandorder.detail.waitingAccept")
    }
    // 2024/2/2号变更逻辑，简化流程
    if (status === DemandStatus.progressing) {
        if (timeline_status == TimelineStatus.DESINNERCONFIRMED || timeline_status == TimelineStatus.EMPLOYCONFIRMED || timeline_status == TimelineStatus.INIT) {
            desc = `${t("demandorder.detail.afterAccept")} ${t("demandorder.detail.leftuntil")} ${hoursUntilDraftTargetDate}${t("demandorder.detail.upload")}`
            if (groupedDocument?.[1]?.length > 0) {
                // 已经上传了初稿
                desc = t("demandorder.detail.afterDraft")
            }
        }
        if (timeline_status == TimelineStatus.FINISHEDDAFT) {
            desc = `${t("demandorder.detail.draftConfirmed")} ${t("demandorder.detail.leftuntil2")} ${hoursUntilTargetDate > 0 ? hoursUntilTargetDate : 0}${t("demandorder.detail.upload2")}`
            if (groupedDocument?.[2]?.length > 0) {
                // 已经上传了全稿
                desc = t("demandorder.detail.afterFull")
            }
        }
        if (timeline_status == TimelineStatus.FINISHEDFULL) {
            desc = t("demandorder.detail.fullConfirmed")
        }
    }
    if (status === DemandStatus.completed) {
        // 已经完成的看是否有评论
        if (demand_comment?.length > 0) {
            desc = t("demandorder.detail.reviewMessage")
        }
    }
    return (
        <>
            {[DemandStatus.progressing, DemandStatus.unreception, DemandStatus.completed].indexOf(status) > -1 && desc && <Alert className="bg-indigo-100 w-full flex items-center">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="w-full text-xs">{desc}</AlertDescription>
                <Link className="flex w-full justify-end text-xs items-center" to={`/dashboard/order/${id}/design/d`}>{t("demandorder.detail.goto")}<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
                </Link>
            </Alert>}
            <div className="flex gap-4 bg-base-100 md:rounded-md w-full p-5 justify-between items-center">
                <div className="flex flex-col gap-4">
                    <div className="font-medium text-xl">
                        <span>{t(`demandorder.detail.typeItem.${type || 0}`)}</span>
                        {status !== undefined ? typeBadge?.[status] : '--'}
                    </div>
                    <div className="font-thin text-xs">
                        <div className="flex">
                            <span>{t("demandorder.detail.estimated")}：</span>
                            {designerQuotation == '' ? (
                                <span>{`HK$ ${formatMoney(order_price ? order_price * 0.45 : 0, 2)} - ${formatMoney(order_price ? order_price * 0.65 : 0, 2)}`}</span>
                            ) : (
                                <span>{designerQuotation}</span>
                            )}

                        </div>
                        <div className="flex">
                            <div className="font-thin text-xs py-2">{`${t("demandorder.order.no")}: `}</div>
                            <div className="text-xs py-2">{`QU-${id}`}</div>
                        </div>
                    </div>
                </div>
                {status == DemandStatus.unreception && <div className="flex text-xs md:text-sm flex-col md:flex-row">
                    <button className="btn btn-xs md:btn-sm btn-outline btn-primary min-w-14 m-1" onClick={() => {
                        onReject(data.id, data.user_id)
                    }}>{t("demandorder.info.reject")}</button>
                    <button className="btn btn-xs md:btn-sm btn-primary m-1 min-w-14" onClick={() => {
                        valueResetRef?.current!.reset(data);
                        timeLineDialog.showModal();
                    }}>{t("demandorder.info.accept")}</button>
                </div>}
                {/* 2024/2/2需求移除确认并开始设计 */}
                {/* {
                    status == DemandStatus.progressing && (timeline_status == TimelineStatus.EMPLOYCONFIRMED || timeline_status == TimelineStatus.INIT) && <div>
                        <button className="btn btn-sm btn-outline btn-primary mx-1.5" onClick={() => { onBegin(data.id, data.user_id) }}>{t("demandorder.info.timeline")}</button>
                    </div>
                } */}
                <TimelineDialog ref={valueResetRef} name="timeLineDialog" onOk={onAccept} />
            </div>
        </>
    )
}

const EvaluateDetail = ({ scoreItems = [], type = 'demand', totalScore = 0 }: EvaluateProps) => {
    return (<div className="bg-base-100 divide-y divide-dashed pt-4 overflow-x-auto">
        {type == "self" &&
            <div className="flex items-center justify-left px-14 pt-0 pb-5">
                <div>
                    <div className="px-px-2 font-medium text-3xl">{totalScore ? totalScore.toFixed(1) : '--'}</div>
                    <div className="text-xs">{t("demandorder.detail.comprehensiveScore")}</div>
                </div>
                <div className="flex ml-14 pl-4 flex-col">
                    <div className="flex">
                        <div className="rating">
                            {range(5).map((val) => {
                                return <input key={`score-${val}`} type="radio" className="mask mask-star-2 bg-yellow-400" checked={totalScore == val + 1} disabled />
                            })}
                        </div>
                        <div>
                            <div className="px-2">{totalScore ? totalScore.toFixed(1) : '--'}</div>
                        </div>
                    </div>
                    <div className="font-thin text-xs">{`${scoreItems?.length || 0}人评分`}</div>
                </div>

            </div>
        }
        {scoreItems?.map((item: any, index: number) => {
            return <ScoreItem data={item} key={`items-${index}`} />
        })}
        {
            scoreItems?.length <= 0 && <div className="bg-base-100 flex font-thin text-center justify-center justify-items-center items-center text-xs" style={{ height: 400 }}>Empty</div>
        }
    </div>)
}

const ScoreItem = ({ data }: ScoreProps) => {
    const {
        score = 0,
        content = '',
        images = [],
        created_at = '',
        designer,
    } = data || {};
    return (
        <>
            <div className="flex flex-col gap-0 bg-base-100 md:rounded-md w-full px-5 pt-5">
                <div className="flex flex-row gap-5 md:rounded-md w-full px-5 items-center">
                    <div className="avatar placeholder">
                        <Avatar user={designer} size="xs" />
                    </div>
                    <span className="font-medium">{`${designer.name}`}</span>
                </div>
                <div className="flex gap-4 md:rounded-md w-full my-0 justify-between">
                    <div className="flex ml-14 pl-4">
                        <div className="rating">
                            {range(5).map((val) => {
                                return <input key={`score-${val}`} type="radio" className="mask mask-star-2 bg-yellow-400" checked={score == val + 1} disabled />
                            })}
                        </div>
                        <div className="px-2">{score.toFixed(1)}</div>
                    </div>
                    <div className="font-thin text-xs">{dayjs(created_at).format('YYYY-MM-DD hh:mm:ss')}</div>
                </div>
                <div className="px-14 py-3 ml-14 pl-4">{content}</div>
                <div className="grid grid-cols-6 gap-2 bg-base-100 md:rounded-md w-full p-2 pl-[60px]">
                    {images?.map((val: string, index: number) => {
                        return (<div key={index} className="rounded overflow-hidden mr-2.5"><img src={val} className="object-cover h-40 w-40" /></div>)
                    })}
                </div>
            </div>
        </>
    )
}

export {
    OrderDetail,
    OrderStatus,
    EvaluateDetail,
    RequirementDetail,
    OrderTab,
    RequirmentDetialNew,
}