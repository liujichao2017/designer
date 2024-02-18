import { UserProps } from "~/utils/store"
import logo from "~/images/logo-md.png"
import { useTranslation } from "react-i18next";
import { encrypto } from "~/utils/crypto.server";


export default (
  { user, endPoint, demandId }:
    { user: UserProps, endPoint: string, demandId: number }
) => {
  const href = `${endPoint}/auth/signin?next=/dashboard/project/design/g?id=${demandId}`
  return (
    <div>

      <h3>The designer has accepted your order</h3>
      <p>Hi {user.name}:</p>
      <p>We are pleased to inform you that a senior designer has officially accepted your design project! If you have any materials to provide to the designer, please upload them promptly.</p>
      <h5>
        <a href={href}>Go to Upload</a>
      </h5>
    </div>
  )
}


export const DesignerTemplate = ({user, template}: {user: {name: string}, template: {title: string; context: string, footer: string} }) => {
  const { t } = useTranslation()

  return <div>
    <h3>{template.title}</h3>
    <p>{`${t('mail.welcome')}`}</p>
    <HtmlContent html={template.context} />
    <HtmlContent html={template.footer}/>
  </div>
}

export const DesignerAutoTemplate = ({user, template}: {user: {name: string}, template: {title: string; context: string, footer: string} }) => {

  return <div>
    <h3>{template.title}</h3>
    <p>Hi </p>
    <HtmlContent html={template.context} />
    <HtmlContent html={template.footer}/>
  </div>
}

const HtmlContent = ({ html }: {html: string}) => {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

const footerContextZh =  `<h1>需要帮助？</h1>
<p>我们的客户服务团队随时准备帮助您解决问题。如果您有任何问题或需要帮助，请随时与我们联系。</p>
<h2>联系方式：</h2>
<p>任意页面：点击小图标；</p>
<p>邮箱：<a href="mailto:info@definertech.com">info@definertech.com</a>；</p>
<p>电话：6754 8453</p>
<p>再次感谢您选择Definer。我们期待着与您一起创造美好的技术作品！</p>

<footer>
    <p>Definer</p>
    <p>全方位咨询设计服务</p>
    <p>满足您的所有咨询需求</p>
</footer>`

const footerContextCht = `<h3>需要幫助？</h3>
<p>我們的客戶服務團隊隨時準備為您提供幫助。如果您有任何疑問或需要幫助，請隨時與我們聯繫。</p>
<h3>聯繫方式：</h3>
<p>任意頁面：點擊小客服；</p>
<p>郵箱：<a href="mailto:info@definertech.com">info@definertech.com</a>；</p>
<p>電話：6754 8453</p>
<p>再次感謝您使用Definer。我們期待著與您一起創造美妙的設計作品！</p>

<footer>
    <p>Definer</p>
    <p>全方位覆蓋設計場景</p>
    <p>滿足您的所有設計需求</p>
</footer>
`;

const footerContextEn = `<h1>Need Help?</h1>
<p>Our customer service team is always ready to assist you. If you have any questions or need help, please feel free to contact us at any time.</p>
<h2>Contact Information:</h2>
<p>On any page: Click the small customer service icon;</p>
<p>Email: <a href="mailto:info@definertech.com">info@definertech.com</a>;</p>
<p>Phone: 6754 8453</p>
<p>Thank you again for choosing Definer. We look forward to creating wonderful design works with you!</p>

<footer>
    <p>Definer</p>
    <p>Comprehensive coverage for design scenarios</p>
    <p>Meeting all your design needs</p>
</footer>`;


const templatesCht = ({ demandId, endPoint, designer, others }: {demandId: number, endPoint: string, designer?: string,
  others: {demandType?: string; demandPrice?: string; draft_time?: string; full_time?: string;limitTime?: number , accepted_end_time?: string }
}) => {
  const {
    draft_time,
    full_time,
    limitTime,
    demandType,
    demandPrice,
    accepted_end_time
  } = others || {};
  const id = demandId
  if (!demandId) return ""
  const cipher = encrypto({ expire: Date.now() + 60 * 60 * 1000, id })
  return {
    // 設計師接受訂單
    'accept': {
      title: `[QU-${demandId}]設計師已接受您的訂單`,
      context: `<p>我們很高興地通知您，一位資深設計師已正式接受了您的設計項目！如您有資料需要提供給設計師，請及時上傳。</p>
      <p>您可以通過以下連接上傳所需資料:<a href=${`${endPoint}/share/dashboard/project/${cipher}`}}>連接</a></p>
      <p>一旦我們收到所有必要資料，設計師將立即開始工作，並致力於按時提交高質量的設計初稿</p>
      `,
      footer: footerContextCht,
    },
    'start': {
      title: `[QU-${demandId}]設計師已接受您的訂單`,
      context: `<p>我們很高興地通知您，設計師已收到您的設計資料，並開始了認真細致的設計！請您耐心等待設計結果</p>
      <p>您可以通過以下連接快速查看項目<a href=${`${endPoint}/share/dashboard/project/${cipher}`}}>連接</a></p>
      `,
      footer: footerContextCht,
    },
    'draft': {
      title: `[QU-${demandId}]您的項目初稿已準備就緒-請確認(如有尾款未支付請及時處理)`,
      context: `<p>我們很高興地通知您，您的項目設計師 [${designer}] 已成功上傳了設計初稿。為了讓您項目 能夠繼續進行，如有尾款未支付我們需要您先完成剩余尾款的支付，如已支付請忽略。</p>
      <p>您可以通過以下連接直接查看設計初稿：<a href=${`${endPoint}/share/dashboard/project/${cipher}`}}>連接</a></p>
      `,
      footer: footerContextCht,
    },
    'finishedDraft': {
      title: `[QU-${demandId}]您的項目初稿已確認 - 項目進入下一階段`,
      context: `<p>我們很高興地通知您，您的項目初稿已經確認。</p>
      <p>您可以通過以下連接直接查看：<a href=${`${endPoint}/share/dashboard/project/${cipher}`}}>連接</a></p>
      `,
      footer: footerContextCht,
    },
    'finally': {
      title: `[QU-${demandId}]您的項目全稿已準備就緒-請確認`,
      context: `<p>我們很高興地通知您，您的項目設計師 [${designer}] 已完成全稿，並已在我們的平臺上進行了上傳。</p>
      <p>您可以通過以下連接直接查看設計全稿：<a href=${`${endPoint}/share/dashboard/project/${cipher}`}}>連接</a></p>
      `,
      footer: footerContextCht,
    },
    'finishedFull': {
      title: `[QU-${demandId}]終稿已準備就緒 - 請及時查看`,
      context: `<p>我們很高興地通知您，您的項目設計師 [${designer}] 已完成終稿，並已在我們的平臺上進行了上傳。</p>
      <p>您可以通過以下連接直接查看設計終稿：<a href=${`${endPoint}/share/dashboard/project/${cipher}`}}>連接</a></p>`,
      footer: footerContextCht,
    },
    // 已经废弃，不需要自动确认
    '12hourConfirm': {
      title: `[QU-${demandId}]初稿/全稿，還有12h自動確認`,
      context: `<p>您的項目設計師 [${designer}]已上傳初稿/全稿，請及時查看，12小時後將自動確認。</p>
      <p>您可以通過以下連接直接查看設計全稿：<a href=${`${endPoint}/share/dashboard/project/${cipher}`}}>連接</a></p>`,
      footer: footerContextCht,
    },
    "after12notBegin": {
      title: `訂單已被接受12h-請及時開始您的設計`,
      context: `<p>距您接受設計項目[QU-${demandId}]已經12小時，請及時确認幷開始您的設計。若已開始，請忽略。</p>
      <p>需求名稱：[${demandType}]</p>
      <p>預計收入：[${demandPrice}]</p>
      <p>去開始訂單：<a href=${`${endPoint}/auth/signin?next=/dashboard/order/${demandId}/demand`}>連接</a></p>`,
      footer: footerContextCht,
    },
    "xNotDraftFinished": {
      title: `距離設計初稿交付還有不足${limitTime} hours,請及時交付`,
      context: `<p>您負責的項目 [QU-${demandId}]初稿交付時間還賸48小時，請及時上傳您的設計文件。若已上傳，請忽略。</p>
      <p>初稿上傳截止日期：[${draft_time}]</p>
      <p>需求名稱：[${demandType}]</p>
      <p>預計收入：[${demandPrice}]</p>
      <p>去上傳：<a href=${`${endPoint}/auth/signin?next=/dashboard/order/${demandId}/demand`}>連接</a></p>`,
      footer: footerContextCht,
    },
    "xNotFinallyFinished": {
      title: `距離設計終稿交付還有不足${limitTime} hours,請及時交付`,
      context: `<p>您負責的項目 [QU-${demandId}]初稿交付時間還賸${limitTime}小時，請及時上傳您的設計文件。若已上傳，請忽略。</p>
      <p>終稿上傳截止日期：[${draft_time}]</p>
      <p>需求名稱：[${demandType}]</p>
      <p>預計收入：[${demandPrice}]</p>
      <p>去上傳：<a href=${`${endPoint}/auth/signin?next=/dashboard/order/${demandId}/demand`}>連接</a></p>`,
      footer: footerContextCht,
    },
    xLeftNotAccept: {
      title: `訂單邀請`,
      context: `<p>我們很高興地通知您，您已被選中為一項新的設計項目提供您的專業技能。距離接受接單時間還有不足${limitTime}h，過期將自動拒絶該訂單。</p>
      <p>需求名稱：[${demandType}]</p>
      <p>預計收入：[${demandPrice}]</p>
      <p>接受截止日期：[${accepted_end_time}]</p>
      <p>去上傳：<a href=${`${endPoint}/auth/signin?next=/dashboard/order/${demandId}/demand`}>連接</a></p>`,
      footer: footerContextCht,
    },
    autoPadding: {
      title: `訂單自動拒絶`,
      context: `<p>我們很遺憾地通知您，由於未及時點擊接受，訂單已被自動拒絶。</p>
      <p>需求名稱：[${demandType}]</p>
      <p>預計收入：[${demandPrice}]</p>
      <p>接受截止日期：[${accepted_end_time}]</p>`,
      footer: footerContextCht,
    }
  }
}
const templatesEn = ({ demandId, endPoint, designer, others}: { demandId: number, endPoint: string, designer?: string,demandType?: string, demandPrice?: string,
  others: {demandType?: string; demandPrice?: string; draft_time?: string; full_time?: string;limitTime?: number,accepted_end_time?: string  }}) => {
  const {
    draft_time,
    full_time,
    limitTime,
    demandType,
    demandPrice,
    accepted_end_time
  } = others || {};
  const id = demandId
  if (!demandId) return ""
  const cipher = encrypto({ expire: Date.now() + 60 * 60 * 1000, id })
  return {
    // Designer accepts the order
    'accept': {
      title: `[QU-${demandId}] The designer has accepted your order`,
      context: `<p>We are pleased to inform you that a senior designer has formally accepted your design project! If you have any materials to provide to the designer, please upload them promptly.</p>
      <p>You can upload the necessary materials through the following link:<a href=${`${endPoint}/share/dashboard/project/${cipher}`}>Link</a></p>
      <p>Once we have received all the necessary materials, the designer will begin work immediately and will commit to submitting a high-quality initial design draft on time.</p>
      `,
      footer: footerContextEn, 
    },
    'start': {
      title: `[QU-${demandId}] The designer has started on your order`,
      context: `<p>We are excited to inform you that the designer has received your design materials and has begun the meticulous design process! Please wait patiently for the design outcome.</p>
      <p>You can quickly check the project status through the following link:<a href=${`${endPoint}/share/dashboard/project/${cipher}`}>Link</a></p>
      `,
      footer: footerContextEn, 
    },
    'draft': {
      title: `[QU-${demandId}] Your project draft is ready - please confirm (and promptly handle any outstanding final payments if necessary)`,
      context: `<p>We are delighted to inform you that your project designer [${designer}] has successfully uploaded the initial design draft. To enable your project to continue, if there is any final payment outstanding, we need you to complete the payment of the remaining balance, if it has not already been paid.</p>
      <p>You can view the initial design draft directly through the following link:<a href=${`${endPoint}/share/dashboard/project/${cipher}`}>Link</a></p>
      `,
      footer: footerContextEn, 
    },
    'finishedDraft': {
      title: `[QU-${demandId}] Your project draft has been confirmed - moving to the next phase`,
      context: `<p>We are pleased to inform you that your project draft has been confirmed.</p>
      <p>You can directly view it through the following link:<a href=${`${endPoint}/share/dashboard/project/${cipher}`}>Link</a></p>
      `,
      footer: footerContextEn,
    },
    'finally': {
      title: `[QU-${demandId}] Your full project draft is ready - please confirm`,
      context: `<p>We are happy to inform you that your project designer [${designer}] has completed the full draft, which has been uploaded to our platform.</p>
      <p>You can directly view the full design draft through the following link:<a href=${`${endPoint}/share/dashboard/project/${cipher}`}>Link</a></p>
      `,
      footer: footerContextEn,
    },
    'finishedFull': {
      title: `[QU-${demandId}] Your final draft is ready - please review in a timely manner`,
      context: `<p>We are thrilled to inform you that your project designer [${designer}] has completed the final draft, which has been uploaded to our platform.</p>
      <p>You can directly view the final design through the following link:<a href=${`${endPoint}/share/dashboard/project/${cipher}`}>Link</a></p>`,
      footer: footerContextEn,
    },
    // 已经废弃，不需要自动确认
    '12hourConfirm': {
      title: `[QU-${demandId}] Initial/full draft ready, with 12h automatic confirmation`,
      context: `<p>Your project designer [${designer}] has uploaded the initial/full draft, please review promptly, as it will be automatically confirmed after 12 hours.</p>
      <p>You can directly review the design through the following link:<a href=${`${endPoint}/share/dashboard/project/${cipher}`}>Link</a></p>`,
      footer: footerContextEn,
    },
    "after12notBegin": {
      title: "Order Accepted for Over 12h - Please Begin Your Design Promptly",
      context: `<p>It has been 12 hours since you accepted the design project [QU-${demandId}]. Please confirm and begin your design as soon as possible. If you have already started, please disregard this message.</p>
      <p>Demand Name: [${demandType}]</p>
      <p>Estimated Income: [${demandPrice}]</p>
      <p>To Start the Order: <a href=${`${endPoint}/auth/signin?next=/dashboard/order/${demandId}/demand`}>Link</a></p>`,
      footer: footerContextEn,
    },
    "xNotDraftFinished": {
      title: `You have ${limitTime} hours left until the design initial draft delivery. Please deliver on time.`,
      context: `<p>The initial draft delivery for the project [QU-${demandId}] is due in 48 hours. Please upload your design documents on time. If already uploaded, please disregard this message.</p>
      <p>Initial draft upload deadline: [${draft_time}]</p>
      <p>Demand name: [${demandType}]</p>
      <p>Estimated income: [${demandPrice}]</p>
      <p>Go to upload: <a href=${`${endPoint}/auth/signin?next=/dashboard/order/${demandId}/demand`}>Link</a></p>`,
      footer: footerContextEn,
    },
    "xNotFinallyFinished": {
      title: `You have ${limitTime} hours left until the design final draft delivery. Please deliver on time.`,
      context: `<p>The initial draft delivery for the project [QU-${demandId}] is due in ${limitTime} hours. Please upload your design documents on time. If already uploaded, please disregard this message.</p>
      <p>Final draft upload deadline: [${draft_time}]</p>
      <p>Demand name: [${demandType}]</p>
      <p>Estimated income: [${demandPrice}]</p>
      <p>Go to upload: <a href=${`${endPoint}/auth/signin?next=/dashboard/order/${demandId}/demand`}>Link</a></p>`,
      footer: footerContextEn,
    },
    "xLeftNotAccept": {
      title: `Order Invitation`,
      context: `<p>We are delighted to inform you that you have been selected to provide your professional skills for a new design project. There are less than ${limitTime} hours left to accept the order, and it will be automatically declined after expiration.</p>
      <p>Demand name: [${demandType}]</p>
      <p>Estimated income: [${demandPrice}]</p>
      <p>Acceptance deadline: [${accepted_end_time}]</p>
      <p>Go to upload: <a href=${`${endPoint}/auth/signin?next=/dashboard/order/${demandId}/demand`}>Link</a></p>`,
      footer: footerContextEn,
    },
    "autoPadding": {
      title: `Order Auto-Rejection`,
      context: `<p>We regret to inform you that the order has been automatically rejected due to failure to accept it in a timely manner.</p>
      <p>Demand name: [${demandType}]</p>
      <p>Estimated income: [${demandPrice}]</p>
      <p>Acceptance deadline: [${accepted_end_time}]</p>`,
      footer: footerContextEn,
    }
  }
}    
const templatesZh = ({ demandId, endPoint, designer,others }: {demandId: number, endPoint: string, designer?: string,
  others: {demandType?: string; demandPrice?: string; draft_time?: string; full_time?: string;limitTime?: number, accepted_end_time?: string } }) => {
  const {
    draft_time,
    full_time,
    limitTime,
    demandType,
    demandPrice,
    accepted_end_time,
  } = others || {};
  const id = demandId
  if (!demandId) return ""
  const cipher = encrypto({ expire: Date.now() + 60 * 60 * 1000, id })
  return {
    // 设计师接受订单
    'accept': {
      title: `[QU-${demandId}]设计师已接受您的订单`,
      context: `<p>我们很高兴地通知您，一位资深设计师已正式接受了您的设计项目！如您有资料需要提供给设计师，请及时上传。</p>
      <p>您可以通过以下连接上传所需资料:<a href=${`${endPoint}/share/dashboard/project/${cipher}`}}>连接</a></p>
      <p>一旦我们收到所有必要资料，设计师将立即开始工作，并致力于按时提交高质量的设计初稿</p>
      `,
      footer: footerContextZh,
    },
    'start': {
      title: `[QU-${demandId}]设计师已接受您的订单`,
      context: `<p>我们很高兴地通知您，设计师已收到您的设计资料，并开始了认真细致的设计！请您耐心等待设计结果</p>
      <p>您可以通过以下连接快速查看项目<a href=${`${endPoint}/share/dashboard/project/${cipher}`}}>连接</a></p>
      `,
      footer: footerContextZh,
    },
    'draft': {
      title: `[QU-${demandId}]您的项目初稿已准备就绪-请确认(如有尾款未支付请及时处理)`,
      context: `<p>我们很高兴地通知您，您的项目设计师 [${designer}] 已成功上传了设计初稿。为了让您项目 能够继续进行，如有尾款未支付我们需要您先完成剩余尾款的支付，如已支付请忽略。</p>
      <p>您可以通过以下连接直接查看设计初稿：<a href=${`${endPoint}/share/dashboard/project/${cipher}`}}>连接</a></p>
      `,
      footer: footerContextZh,
    },
    'finishedDraft': {
      title: `[QU-${demandId}]您的项目初稿已确认 - 项目进入下一阶段`,
      context: `<p>我们很高兴地通知您，您的项目初稿已经确认。</p>
      <p>您可以通过以下连接直接查看：<a href=${`${endPoint}/share/dashboard/project/${cipher}`}}>连接</a></p>
      `,
      footer: footerContextZh,
    },
    'finally': {
      title: `[QU-${demandId}]您的项目全稿已准备就绪-请确认`,
      context: `<p>我们很高兴地通知您，您的项目设计师 [${designer}] 已完成全稿，并已在我们的平台上进行了上传。</p>
      <p>您可以通过以下连接直接查看设计全稿：<a href=${`${endPoint}/share/dashboard/project/${cipher}`}}>连接</a></p>
      `,
      footer: footerContextZh,
    },
    'finishedFull': {
      title: `[QU-${demandId}]终稿已准备就绪 - 请及时查看`,
      context: `<p>我们很高兴地通知您，您的项目设计师 [${designer}] 已完成终稿，并已在我们的平台上进行了上传。</p>
      <p>您可以通过以下连接直接查看设计终稿：<a href=${`${endPoint}/share/dashboard/project/${cipher}`}>连接</a></p>`,
      footer: footerContextZh,
    },
    // 已经废弃，不需要自动确认
    '12hourConfirm': {
      title: `[QU-${demandId}]初稿/全稿，还有12h自动确认`,
      context: `<p>您的项目设计师 [${designer}]已上传初稿/全稿，请及时查看，12小时后将自动确认。</p>
      <p>您可以通过以下连接直接查看设计全稿：<a href=${`${endPoint}/share/dashboard/project/${cipher}`}}>连接</a></p>`,
      footer: footerContextZh,
    },
    "after12notBegin": {
      title: `订单已被接受12h-请及时开始您的设计`,
      context: `<p>距您接受设计项目[QU-${demandId}]已经12小时，请及时确认并开始您的设计。若已开始，请忽略。</p>
      <p>需求名称：[QU-${demandId} ${demandType}]</p>
      <p>预计收入：[${demandPrice}]</p>
      <p>去开始订单：<a href=${`${endPoint}/auth/signin?next=/dashboard/order/${demandId}/demand`}>连接</a></p>`,
      footer: footerContextZh,
    },
    "xNotDraftFinished": {
      title: `距离设计初稿交付还有${limitTime} hours,请及时交付`,
      context: `<p>您负责的项目 [QU-${demandId}]初稿交付时间还剩${limitTime}小时，请及时上传您的设计文件。若已上传，请忽略。</p>
      <p>初稿上传截止日期：[${draft_time}]</p>
      <p>需求名称：[QU-${demandId} ${demandType}]</p>
      <p>预计收入：[${demandPrice}]</p>
      <p>去上传：<a href=${`${endPoint}/auth/signin?next=/dashboard/order/${demandId}/demand`}>连接</a></p>`,
      footer: footerContextZh,
    },
    "xNotFinallyFinished": {
      title: `距离设计终稿交付还有${limitTime} hours,请及时交付`,
      context: `<p>您负责的项目 [QU-${demandId}]初稿交付时间还剩${limitTime}小时，请及时上传您的设计文件。若已上传，请忽略。</p>
      <p>终稿上传截止日期：[${draft_time}]</p>
      <p>需求名称：[${demandType}]</p>
      <p>预计收入：[${demandPrice}]</p>
      <p>去上传：<a href=${`${endPoint}/auth/signin?next=/dashboard/order/${demandId}/demand`}>连接</a></p>`,
      footer: footerContextZh,
    },
    xLeftNotAccept: {
      title: `订单邀请`,
      context: `<p>我们很高兴地通知您，您已被选中为一项新的设计项目提供您的专业技能。距离接受接单时间还有不足${limitTime}h，过期将自动拒绝该订单。</p>
      <p>需求名稱：[QU-${demandId} ${demandType}]</p>
      <p>預計收入：[${demandPrice}]</p>
      <p>接受截止日期：[${accepted_end_time}]</p>
      <p>去上傳：<a href=${`${endPoint}/auth/signin?next=/dashboard/order/${demandId}/demand`}>連接</a></p>`,
      footer: footerContextZh,
    },
    autoPadding: {
      title: `订单自动拒绝`,
      context: `<p>我们很遗憾地通知您，由于未及时点击接受，订单已被自动拒绝。</p>
      <p>需求名稱：[QU-${demandId} ${demandType}]</p>
      <p>預計收入：[${demandPrice}]</p>
      <p>接受截止日期：[${accepted_end_time}]</p>`,
      footer: footerContextZh,
    }
  }
}

export const template = {
  cht: templatesCht,
  zh: templatesZh,
  en: templatesEn,
}