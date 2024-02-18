//@ts-nocheck
import { Prisma } from "@prisma/client"
import dayjs from "dayjs"
import Logo from "~/components/ui/Logo"
import { UserProps } from "~/utils/store"
import logo from "~/images/logo-md.png"


const configCht = {
  'servicesItem': ['只設計', '設計 + 印刷', '只印刷', '其他'],
  'typeItem': ['書刊/小册子設計', 'Logo設計', '傳單設計', '商業卡片設計', '海報設計', '其他（請聯系職員）'],
  'categoryItem': ['年報', '通訊', '季刊', '文集', '價目表', '文宣小册子', '產品集', '活動册', '場刊', '週刊', '其他小册子', '其他書刊'],
  'sizeItem': ['A5 (148*210mm)', 'A4 (210*297mm)', 'A3 (297*420mm)', 'B4 (257*364 mm)', 'B5 (182 mm*257 mm)', 'B6 (128 mm*182 mm)', '其他 210*210mm', '其他 210*285mm', '其他尺寸', 'A3 (297*420mm) 或以上', 'A2 (420*594 mm)'],
  'foldingItem': ['雙摺頁', '三摺頁（兩折）', '門摺頁', 'Z摺頁', '地圖式摺頁', '法式摺頁', '法式摺頁', '閉門式摺頁', '地圖式摺頁'],
  'printingSizeItem': ['A6 (105148mm)', 'A5 (148210mm)', 'A4 (210297mm)', 'A3 (297420mm)', 'B4 (257364 mm)', 'B5 (182 mm257 mm)', 'B6 (128 mm*182 mm)', '其他 210*210mm', '其他 210*285mm', '其他尺寸'],
  'coverPaperItem': ['光粉紙128g', '光粉紙157g', '光粉紙200g', '光粉紙250g', '光粉紙300g', '光粉紙350g', '啞粉紙128g', '啞粉紙157g', '啞粉紙200g', '啞粉紙250g', '啞粉紙300g', '啞粉紙350g', '書紙80g', '書紙100g', '書紙140g', '書紙160g', '書紙200g', '書紙240g', '其他', '不適用'],
  'stapleItem': ['騎馬釘', '膠裝', '鎖線膠裝', '硬殼精裝', '其他'],
  'finishItem': ['沒有', '封面過啞膠', '封面過光膠', '封面UV', '封面燙金/燙銀', '其他']
}

const configEn = {
  'servicesItem': ["Design Only", 'Design + Printing', 'Printing Only', 'Other'],
  'typeItem': ["Book/Booklet Design",
  "Logo Design",
  "Leaflet Design",
  "Business Card Design",
  "Poster Design",
  "Packaging Design",
  "Exhibition/Backdrop Design",
  "Digital Drawing/Illustration",
  "Social media poster/banner",
  "UI Design",
  "Packaging Design",
  "PPT Design",
  "Other Design"],
  'categoryItem': [ "Annual Report",
  "Newsletter",
  "Quarterly Journal",
  "Collected Works",
  "Price List",
  "Event/Promotional Booklet",
  "Product Catalog",
  "Event Program",
  "Weekly Newsletter",
  "Report",
  "Book",
  "Magazine",
  "Newspaper",
  "Academic Journal",
  "Membership Publication",
  "Comic Book",
  "Other Publications",
  "Other Booklets",
  "Other Layouts"],
  'sizeItem': [ "A5 (148*210mm)",
  "A4 (210*297mm)",
  "A3 (297*420mm)",
  "B4 (257*364 mm)",
  "B5 (182 mm*257 mm)",
  "B6 (128 mm*182 mm)",
  "Other 210*210mm",
  "Other 210*285mm",
  "Other sizes (please specify in the comments)",
  "A3 (297*420mm) or larger",
  "A2 (420*594 mm)"],
  'foldingItem': ["Double Fold Page",
  "Triple Fold Page (Two Folds)",
  "Gate Fold Page",
  "Z Fold Page",
  "Map Fold Page",
  "French Fold Page",
  "Accordion Fold Page",
  "Closed Gate Fold Page",
  "Map Fold Page",
  "Double Parallel Fold"],
  'printingSizeItem': ["A6 (105148mm)",
  "A5 (148210mm)",
  "A4 (210297mm)",
  "A3 (297420mm)",
  "B4 (257364 mm)",
  "B5 (182 mm257 mm)",
  "B6 (128 mm*182 mm)",
  "other 210*210mm",
  "other 210*285mm",
  "other sizes (please fill in the remarks)"],
  'coverPaperItem': [ "Coated Paper 128g",
  "Coated Paper 157g",
  "Coated Paper 200g",
  "Coated Paper 250g",
  "Coated Paper 300g",
  "Coated Paper 350g",
  "Matt Paper 128g",
  "Matt Paper 157g",
  "Matt Paper 200g",
  "Matt Paper 250g",
  "Matt Paper 300g",
  "Matt Paper 350g",
  "Book Paper 80g",
  "Book Paper 100g",
  "Book Paper 140g",
  "Book Paper 160g",
  "Book Paper 200g",
  "Book Paper 240g",
  "Other (please fill in the remarks)",
  "Not Applicable"],
  'stapleItem': [
  "Saddle Stitch",
  "Perfect Binding",
  "Sewn Binding",
  "Hardcover Binding",
  "Other (please fill in the remarks)"],
  'finishItem': ["None",
  "Matte Lamination on Cover",
  "Gloss Lamination on Cover",
  "UV Coating on Cover",
  "Foil Stamping on Cover",
  "Other (please fill in the remarks)"]
}

const configZh = {
  'servicesItem': ['只设计', '设计 + 印刷', '只印刷', '其他'],
  'typeItem': ['书刊/小册子设计', 'Logo设计', '传单设计', '商业卡片设计', '海报设计', '其他（请联系职员）'],
  'categoryItem': ['年报', '通讯', '季刊', '文集', '价目表', '文宣小册子', '产品集', '活动册', '场刊', '週刊', '其他小册子', '其他书刊'],
  'sizeItem': ['A5 (148*210mm)', 'A4 (210*297mm)', 'A3 (297*420mm)', 'B4 (257*364 mm)', 'B5 (182 mm*257 mm)', 'B6 (128 mm*182 mm)', '其他 210*210mm', '其他 210*285mm', '其他尺寸', 'A3 (297*420mm) 或以上', 'A2 (420*594 mm)'],
  'foldingItem': ['双摺页', '三摺页（两折）', '门摺页', 'Z摺页', '地图式摺页', '法式摺页', '法式摺页', '闭门式摺页', '地图式摺页'],
  'printingSizeItem': ['A6 (105148mm)', 'A5 (148210mm)', 'A4 (210297mm)', 'A3 (297420mm)', 'B4 (257364 mm)', 'B5 (182 mm257 mm)', 'B6 (128 mm*182 mm)', '其他 210*210mm', '其他 210*285mm', '其他尺寸'],
  'coverPaperItem': ['光粉纸128g', '光粉纸157g', '光粉纸200g', '光粉纸250g', '光粉纸300g', '光粉纸350g', '哑粉纸128g', '哑粉纸157g', '哑粉纸200g', '哑粉纸250g', '哑粉纸300g', '哑粉纸350g', '书纸80g', '书纸100g', '书纸140g', '书纸160g', '书纸200g', '书纸240g', '其他', '不适用'],
  'stapleItem': ['骑马钉', '胶装', '锁线胶装', '硬壳精装', '其他'],
  'finishItem': ['没有', '封面过哑胶', '封面过光胶', '封面UV', '封面烫金/烫银', '其他']
}

const templateCht = ({ demand, pictures = [], designer = {}, loginUrl = ""}) =>(
    <div>
      <h2>
        Definer&HKDesignPro
      </h2>
      <h3>需求確認郵件</h3>
      <b>您好 {demand?.name}</b>
      <p>感謝您使用我們的報價表。</p>
      <p>這是一封確認電郵，代表我們已收到您的表格。</p>
      <p>如需盡快回覆，建議可 WhatsApp 我們 wa.me/85267548453。否則，我們的職員會盡力務求在6小時內回覆您。</p>
      <br />
      <b>報價表詳情</b>
      <p>機構名稱: {demand?.name}</p>
      <p>Whatsapp: {demand?.contact_number}</p>
      <p>Email: {demand?.email}</p>
      <br />
      <b>設計偏好: </b>
      {
        //for picture join
        pictures.map((val) => (
          <img src={val} style={{ width: "80px" }} />
        ))
      }
      <p>服務: {configCht.servicesItem.at(demand.services ?? 0)}</p>
      <p>設計種類: {configCht.typeItem.at(demand.type ?? 0)}</p>
      {
        demand.type === 0 && <>
          <p>選擇最合適得類別: {configCht.categoryItem.at(demand.category ?? 0)}</p>
          <p>尺寸: {configCht.sizeItem.at(demand.size ?? 0)}</p>
          <p>頁數: {demand.page ?? ""}</p>
        </>
      }
      {
        demand.type === 1 && <>
          <p>品牌名稱、經營服務/產品、風格、需融入的元素、營運理念: {demand.logo_design}</p>
        </>
      }
      {
        demand.type === 2 && <>
          <p>尺寸: {configCht.sizeItem.at(demand.size ?? 0)}</p>
          <p>單張摺法: {configCht.foldingItem.at(demand.folding ?? 0)}</p>
        </>
      }
      {
        demand.type === 3 && <>
        </>
      }
      <br />
      {
        [1, 2].includes(demand.services) && demand.type !== 3 &&
        <>
          <p>印刷數量: {demand.printing_number}</p>
          <p>印刷頁數: {demand.printing_page}</p>
          <p>印刷尺寸: {configCht.sizeItem.at(demand.printing_size ?? 0)}</p>
          <p>紙張種類（Cover）: {configCht.coverPaperItem.at(demand.cover_paper ?? 0)}</p>
          <p>紙張種類（Inner Pages）: {configCht.coverPaperItem.at(demand.inner_paper ?? 0)}</p>
          <p>釘裝: {configCht.stapleItem.at(demand.staple ?? 0)}</p>
          <p>加工: {configCht.finishItem.at(demand.finish ? +demand.finish : 0)}</p>
        </>
      }
      <p>設計師: {demand.designer_user_id ? (designer.name ?? designer.email) : "由 HK Design Pro 安排"} </p>
      <p>Note 備註: {demand?.remark && demand.remark !== "undefined" ? demand.remark : ""} </p>
      <p>參考資料: </p>
      {
        JSON.parse(demand.img_list ?? "[]").map(val =>
          <img src={val} style={{ width: "80px" }} />
        )
      }
      {
        loginUrl &&
        <p>
          <button>
            <a href={loginUrl}>直接登入用戶端，查看項目詳情</a>
          </button>
        </p>
      }

      <br />
      <br />


      <p>
        如有任何疑問或需要更多資訊，請隨時聯絡我哋。希望我哋嘅報價能滿足您嘅需求！
      </p>

      <p>
        祝好， {demand.platform === 2 ? "HK Design PRO" : "Definertech"}
      </p>
      <p>日期: {dayjs(demand.created_at).format("YYYY-MM-DD")}</p>
    </div>
)

const templateZh = ({ demand, pictures = [], designer = {}, loginUrl = ""}) =>(
  <div>
    <h2>
      Definer&HKDesignPro
    </h2>
    <h3>需求确认邮件</h3>
    <b>您好 {demand?.name}</b>
    <p>感谢您使用我们的报价表。</p>
    <p>这是一封确认电邮，代表我们已收到您的表格。</p>
    <p>如需尽快回覆，建议可 WhatsApp 我们 wa.me/85267548453。否则，我们的职员会尽力务求在6小时内回覆您。</p>
    <br />
    <b>报价表详情</b>
    <p>机构名称: {demand?.name}</p>
    <p>Whatsapp: {demand?.contact_number}</p>
    <p>Email: {demand?.email}</p>
    <br />
    <b>设计偏好: </b>
    {
      //for picture join
      pictures.map((val) => (
        <img src={val} style={{ width: "80px" }} />
      ))
    }
    <p>服务: {configZh.servicesItem.at(demand.services ?? 0)}</p>
    <p>设计种类: {configZh.typeItem.at(demand.type ?? 0)}</p>
    {
      demand.type === 0 && <>
        <p>选择最合适得类别: {configZh.categoryItem.at(demand.category ?? 0)}</p>
        <p>尺寸: {configZh.sizeItem.at(demand.size ?? 0)}</p>
        <p>页数: {demand.page ?? ""}</p>
      </>
    }
    {
      demand.type === 1 && <>
        <p>品牌名称、经营服务/产品、风格、需融入的元素、营运理念: {demand.logo_design}</p>
      </>
    }
    {
      demand.type === 2 && <>
        <p>尺寸: {configZh.sizeItem.at(demand.size ?? 0)}</p>
        <p>单张摺法: {configZh.foldingItem.at(demand.folding ?? 0)}</p>
      </>
    }
    {
      demand.type === 3 && <>
      </>
    }
    <br />
    {
      [1, 2].includes(demand.services) && demand.type !== 3 &&
      <>
        <p>印刷数量: {demand.printing_number}</p>
        <p>印刷页数: {demand.printing_page}</p>
        <p>印刷尺寸: {configZh.sizeItem.at(demand.printing_size ?? 0)}</p>
        <p>纸张种类（Cover）: {configZh.coverPaperItem.at(demand.cover_paper ?? 0)}</p>
        <p>纸张种类（Inner Pages）: {configZh.coverPaperItem.at(demand.inner_paper ?? 0)}</p>
        <p>钉装: {configZh.stapleItem.at(demand.staple ?? 0)}</p>
        <p>加工: {configZh.finishItem.at(demand.finish ? +demand.finish : 0)}</p>
      </>
    }
    <p>设计师: {demand.designer_user_id ? (designer.name ?? designer.email) : "由 HK Design Pro 安排"} </p>
    <p>Note 备注: {demand?.remark && demand.remark !== "undefined" ? demand.remark : ""} </p>
    <p>参考资料: </p>
    {
      JSON.parse(demand.img_list ?? "[]").map(val =>
        <img src={val} style={{ width: "80px" }} />
      )
    }
    {
      loginUrl &&
      <p>
        <button>
          <a href={loginUrl}>直接登入用户端，查看项目详情</a>
        </button>
      </p>
    }

    <br />
    <br />


    <p>
      如有任何疑问或需要更多资讯，请随时联络我哋。希望我哋嘅报价能满足您嘅需求！
    </p>

    <p>
      祝好， {demand.platform === 2 ? "HK Design PRO" : "Definertech"}
    </p>
    <p>日期: {dayjs(demand.created_at).format("YYYY-MM-DD")}</p>
  </div>
)

const templateEn = ({ demand, pictures = [], designer = {}, loginUrl = ""}) =>(
  <div>
  <h2>
    Definer&HKDesignPro
  </h2>
  <h3>Requirement Confirmation Email</h3>
  <b>Hello {demand?.name}</b>
  <p>Thank you for using our quotation form.</p>
  <p>This is a confirmation email, indicating that we have received your form.</p>
  <p>If you require a prompt reply, we suggest contacting us via WhatsApp at wa.me/85267548453. Otherwise, our staff will strive to respond within 6 hours.</p>
  <br />
  <b>Quotation Details</b>
  <p>Organization Name: {demand?.name}</p>
  <p>Whatsapp: {demand?.contact_number}</p>
  <p>Email: {demand?.email}</p>
  <br />
  <b>Design Preferences: </b>
  {
    //for picture join
    pictures.map((val) => (
      <img src={val} style={{ width: "80px" }} />
    ))
  }
  <p>Service: {configEn.servicesItem.at(demand.services ?? 0)}</p>
  <p>Design Type: {configEn.typeItem.at(demand.type ?? 0)}</p>
  {
    demand.type === 0 && <>
      <p>Choose the Most Suitable Category: {configEn.categoryItem.at(demand.category ?? 0)}</p>
      <p>Size: {configEn.sizeItem.at(demand.size ?? 0)}</p>
      <p>Number of Pages: {demand.page ?? ""}</p>
    </>
  }
  {
    demand.type === 1 && <>
      <p>Brand Name, Services/Products Offered, Style, Elements to Incorporate, Operating Philosophy: {demand.logo_design}</p>
    </>
  }
  {
    demand.type === 2 && <>
      <p>Size: {configEn.sizeItem.at(demand.size ?? 0)}</p>
      <p>Single Sheet Folding Method: {configEn.foldingItem.at(demand.folding ?? 0)}</p>
    </>
  }
  {
    demand.type === 3 && <>
    </>
  }
  <br />
  {
    [1, 2].includes(demand.services) && demand.type !== 3 &&
    <>
      <p>Printing Quantity: {demand.printing_number}</p>
      <p>Printing Pages: {demand.printing_page}</p>
      <p>Printing Size: {configEn.sizeItem.at(demand.printing_size ?? 0)}</p>
      <p>Paper Type (Cover): {configEn.coverPaperItem.at(demand.cover_paper ?? 0)}</p>
      <p>Paper Type (Inner Pages): {configEn.coverPaperItem.at(demand.inner_paper ?? 0)}</p>
      <p>Binding: {configEn.stapleItem.at(demand.staple ?? 0)}</p>
      <p>Finishing: {configEn.finishItem.at(demand.finish ? +demand.finish : 0)}</p>
    </>
  }
  <p>Designer: {demand.designer_user_id ? (designer.name ?? designer.email) : "Arranged by HK Design Pro"} </p>
  <p>Note: {demand?.remark && demand.remark !== "undefined" ? demand.remark : ""} </p>
  <p>Reference Materials: </p>
  {
    JSON.parse(demand.img_list ?? "[]").map(val =>
      <img src={val} style={{ width: "80px" }} />
    )
  }
  {
    loginUrl &&
    <p>
      <button>
        <a href={loginUrl}>Log in directly to the client side to view project details</a>
      </button>
    </p>
  }

  <br />
  <br />

  <p>
    If you have any questions or need further information, please do not hesitate to contact us. We hope our quotation meets your requirements!
  </p>

  <p>
    Best wishes, {demand.platform === 2 ? "HK Design PRO" : "Definertech"}
  </p>
  <p>Date: {dayjs(demand.created_at).format("YYYY-MM-DD")}</p>
</div>
)


export default function ({ template }:
  { demand: Prisma.demandCreateInput, pictures?: string[], designer?: UserProps, loginUrl?: string, template: any }) {
    return template;
}


export const template = {
  cht: templateCht,
  zh: templateZh,
  en: templateEn,
}