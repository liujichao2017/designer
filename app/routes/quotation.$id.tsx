
import { LoaderArgs, json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { MediumLogo, DesignLogo, Seal, Partner1, Partner2 } from "~/components/ui/Logo";
import { useService } from "~/services/services.server";
import { formatMoney } from "~/utils/helpers";
import { ResultCode, fault } from "~/utils/result";


export async function loader ({ request, params }: LoaderArgs) {
  const { id } = params
  const service = useService("demand")
  const demand = await service.getDemand(Number(id))
  //@ts-ignore
  const level = await service.getQuotationLevel(demand)
  //@ts-ignore
  const quotation = service.getQuotations(demand, level ?? 4, true)
  return json({ demand, quotation, code: ResultCode.OK })
}

export default function Page () {
  const { demand, quotation, code } = useLoaderData<typeof loader>()
  if (code !== ResultCode.OK) {
    return <></>
  }

  const totalPrice = (quotation?.totalPrice ?? 0) * (1 - (quotation?.discount ?? 0))

  const { t } = useTranslation()
  return (
    <main className="flex flex-col items-center gap-10 p-6">
      <div className="flex justify-start w-full">
        <DesignLogo />
      </div>
      <div className="flex justify-between w-full">

        <div className="flex flex-col gap-4">
          <h3 className="text-3xl font-semibold">QUOTE</h3>
          <span>{demand?.name}</span>
        </div>

        <div className="flex gap-6">

          <div className="flex flex-col gap-2 text-sm">
            <div className="flex flex-col">
              <b className="font-semibold">Date</b>
              <i>{dayjs(demand?.created_at).format("DD MMM YYYY")}</i>
            </div>

            <div className="flex flex-col">
              <b className="font-semibold">Expiry</b>
              <i>{dayjs(demand?.created_at).add(30, "days").format("DD MMM YYYY")}</i>
            </div>

            <div className="flex flex-col">
              <b className="font-semibold">Quote Number</b>
              <i>{demand?.id}</i>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-sm w-32 flex-wrap">
            HobbyLand Technology Limited
            9N Century Industrial Building, 33-35 Au Pui Wan St, Fo Tan
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1 w-full">
        <header className="flex justify-between py-2 border-b border-black">
          <div>
            <b className="font-semibold">
              Description
            </b>
          </div>

          <div className="flex gap-2">
            <b className="font-semibold w-24">Quantity</b>
            <b className="font-semibold w-24">Unit Price</b>
            <b className="font-semibold w-24">Discount</b>
            <b className="font-semibold w-28">Amount HKD</b>
          </div>
        </header>

        <div className="flex justify-between border-black border-b py-2">
          <div className="flex flex-col">
            <span className="flex gap-2 text-sm">
              <span>{t("demand.typeItem." + demand?.type)}</span>
            </span>
            <span>
              日期: {dayjs(demand?.created_at).format("MMM DD, YYYY")}
            </span>

            <span>
              檔案: PDF
            </span>
            <span>
              {/* {t("salary.deliveryDate")}: {dayjs(demand?.deliveryDate).format("MMM DD, YYYY")} */}
              {t("salary.deliveryDate")}: --
            </span>
            <span>
              {/* 修改: 1 次 */}
            </span>
          </div>

          <div className="flex gap-2">
            <span className="w-24 text-center">{quotation?.pages}</span>
            <span className="w-24 text-center">{formatMoney(quotation?.price)}</span>
            <span className="w-24 text-center">{quotation?.discount * 100}%</span>

            <span className="w-28 text-center">{formatMoney(totalPrice)}</span>
          </div>
        </div>

        <div className="flex justify-between">
          <Seal />
          <div className="flex flex-col gap-1">
            <div className="flex gap-2">
              <span className="w-24 text-center"></span>
              <span className="w-24 text-center">Subtotal</span>
              <span className="w-28 text-center">{formatMoney(totalPrice)}</span>
            </div>
            <div className="flex gap-2">
              <span className="w-24 text-center"></span>
              <b className="w-24 text-center">TOTAL HKD</b>
              <b className="w-28 text-center">{formatMoney(totalPrice)}</b>
            </div>
          </div>
        </div>

        <Term />

        <Partner />
      </div>
    </main>
  )
}


function Term () {
  return (
    <div className="flex flex-col gap-4 mt-[18rem]">
      <h3 className="font-bold border-b w-full">Terms</h3>
      <b>Quote Number QU-2534</b>

      <h3 className="font-bold">條款</h3>
      <ol className="list-decimal">
        <li>
          無限修改 (設計項目) 是指限定日期內進行修改。從確認初稿後開始計算,每次修改一般需時1-
          3天,視乎修改量多寡而調整。
        </li>
        <li>
          初稿頁數為 2-4 頁,客人確認初稿風格後,設計師會完成餘下頁數。
        </li>
        <li>
          如有特別繪圖定製要求,例如定製logo、地圖、電子繪圖等,須在確認報價前提出額外設計要求,並以本公
          司及客戶同意的服務範圍及要求釐定之報價為準。有關詳情請聯絡本公司的客戶服務員。
        </li>
        <li>
          修改設計須以客戶和本公司雙方皆具效率之流程進行。
        </li>
        <li>
          如非本公司的責任而導致設計進度受影響,設計期限會相應延遲,在設計順延的情況下本公司不需承擔任
          何責任。
        </li>
        <li>
          HK Desgin Pro將盡最大能力為客人提供滿意的設計、印刷服務。
        </li>
      </ol>

      <div className="flex justify-between items-center">
        <div className="w-5/6">
          <h3 className="font-bold">平面設計步驟</h3>
          <ol className="list-decimal">
            <li>
              提交設計資料
            </li>
            <li>
              HKDP設計師提交初稿(一般約3-4天)
            </li>
            <li>
              收到客戶的回饋/確認後,HKDP設計師修改初稿並設計剩下的頁數/事項。
            </li>
            <li>
              HKDP設計師完成所有頁數設計/事項,客戶可以檢查所有頁數並回饋修改需要。
            </li>
          </ol>
        </div>
        <Seal />
      </div>

      <h3 className="font-bold">收費條款及細則</h3>
      <h5>私人企業:</h5>
      <ol className="list-disc">
        <li>
          所有訂單必須繳付全額或50%訂金 (視乎項目,部分項目不適用),並由本公司確認收款,方安排處理。
        </li>
        <li>
          完成設計或印刷項目後的一個月內繳付全數款項或簽署報價單後三個月內繳付全數款項 (取較近的日期)
        </li>
        <li>
          貨前付款
        </li>
      </ol>
      <h5>大型非牟利機構/學校:</h5>
      <ol className="list-disc">
        <li>
          必須蓋印及簽署報價單以確認項目
        </li>
        <li>
          完成設計或印刷項目後的一個月內繳付全數款項或簽署報價單後三個月內繳付全數款項 (取較近的日期)
        </li>
        <li>
          如設計/印刷項目的款項超過$40,000,則須要先付50%訂金
          (如 貴機構有固定Payment Term要求,本公司會視乎情況彈性處理)
        </li>
      </ol>

      <div className="flex justify-between">
        <div className="flex flex-col w-7/12">
          <h5>QU-2534</h5>
          <h3 className="font-bold">付款方式</h3>
          <ol className="list-decimal">
            <li>
              HSBC: 139 199681 838 (HobbyLand Technology Limited)
            </li>
            <li>
              FPS: 105825434 (HobbyLand Technology Limited)
            </li>
            <li>
              支票付款: HobbyLand Technology Limited
              Address:9N Century Industrial Centre,
              33-35 Au Pui Wan St FO TAN
            </li>
            <li>
              採購卡 (P card)
              088026234400 (HobbyLand Technology Limited)
            </li>
          </ol>
        </div>

        <div className="flex flex-col gap-6 w-4/12">
          <h5>客戶蓋章:</h5>
          <span className="w-full h-8 border-b"></span>
          <h5>客戶簽署:</h5>
          <span className="w-full h-8 border-b"></span>
          <h5>日期:</h5>
          <span className="w-full h-8 border-b"></span>
        </div>
      </div>
    </div>
  )
}

function Partner () {
  return (
    <div className="flex flex-col gap-4 mt-[4rem]">
      <div className="flex flex-col">
        <Partner1 />
        <Partner2 />
      </div>
    </div>
  )
}