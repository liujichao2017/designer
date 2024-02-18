import mailer from "nodemailer"
import { renderToString } from "react-dom/server"
import { UserProps } from "~/utils/store"
import { useService } from "~/services/services.server";
import AcceptDemand, { DesignerAutoTemplate, template } from '~/templates/AcceptDemand'
import { formatMoney } from "~/utils/helpers";
import { prisma } from "./database.server";
import dayjs from "dayjs";
import MessageBoardMail from "~/templates/MessageBoardMail";

const transport = mailer.createTransport({
  service: process.env.MAIL_SERVICE as string,
  host: process.env.MAIL_HOST as string,
  port: parseInt(process.env.MAIL_PORT as string),
  secure: true,
  auth: {
    user: process.env.MAIL_USER as string,
    pass: process.env.MAIL_PASS as string
  },
})
const typeItem = ["Book/Booklet Design",
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
  "Other Design"]
export default ({ user, locale }: { user: UserProps, locale?: string }) => ({
  // 设计师接收后12小时未开始通知(已测试)
  batchSend12NotbeginMail: async () => {
    // 12小时未开始Demand获取基本信息
    const demands = await useService('demand').getOver12hAcceptedDemand();
    demands.forEach((demand) => {
      let _price = demand?.quotation;
      if (demand?.discount!==undefined && demand?.discount!==0 && demand?.quotation!==undefined) {
          _price = demand?.quotation * demand?.discount
      }
      const temp = template?.[locale ?? 'en']({
        demandId: demand.id, endPoint: process.env.END_POINT, designer: null, others: {
          demandType: `[QU-${demand.id}] ${typeItem?.[demand.type || 0]}`,
          demandPrice: `HK$ ${formatMoney(_price ? _price * 0.45 : 0, 2)} - ${formatMoney(_price ?_price * 0.65 : 0, 2)}`
        }
      })?.after12notBegin;
      if (!temp) return
      transport.sendMail({
        from: `Definer <${process.env.MAIL_USER}>`,
        to: demand.designer?.email,
        subject: temp?.title,
        html: renderToString(<DesignerAutoTemplate
          user={{ name: '' }} template={temp} />)
      })
    })
  },
  // 设计师被分配后，结束时间不足2/1小时未接受(已测试)
  batchLeft2NotAcceptMail: async () => {
    // 12小时未开始Demand获取基本信息
    const demands = await useService('demand').getleftxhNotAcceptDemand(2);
    demands.forEach((demand) => {
      let accepted_end_time
      let limitTime = 2;
      if (demand.updated_at) {
        const date = new Date(demand.updated_at)
        const endtime = date.setHours(date.getHours() + 2);
        accepted_end_time = new Date(endtime); //过期时间x小时后
        limitTime = (accepted_end_time - new Date()) / (1000 * 60 * 60)
      }
      if (limitTime <= 2 && limitTime > 1) {
        limitTime = 2
      }
      if (limitTime <= 1 && limitTime > 0) {
        limitTime = 1
      }
      let _price = demand?.quotation;
      if (demand?.discount!==undefined && demand?.discount!==0 && demand?.quotation!==undefined) {
          _price = demand?.quotation * demand?.discount
      }
      const temp = template?.[locale ?? 'en']({
        demandId: demand.id, endPoint: process.env.END_POINT, designer: null, others: {
          demandType: `[QU-${demand.id}] ${typeItem?.[demand.type || 0]}`,
          demandPrice: `HK$ ${formatMoney(_price? _price * 0.45 : 0, 2)} - ${formatMoney(_price ? _price * 0.65 : 0, 2)}`,
          limitTime: limitTime,
          accepted_end_time,
        }
      })?.xLeftNotAccept;
      if (!temp) return
      transport.sendMail({
        from: `Definer <${process.env.MAIL_USER}>`,
        to: demand.designer?.email,
        subject: temp?.title,
        html: renderToString(<DesignerAutoTemplate
          user={{ name: '' }} template={temp} />)
      })
    })
  },
  // 设计师被分配后2小时后未接受自动reject另分配（已测试）
  batchNotAccepttoUnacceptMail: async () => {
    // 12小时未开始Demand获取基本信息
    const demands = await useService('demand').getleft2hNotAcceptTopendingDemand(6);
    demands.forEach((demand) => {
      let accepted_end_time
      if (demand.updated_at) {
        const date = new Date(demand.updated_at)
        const endtime = date.setHours(date.getHours() + 6);
        accepted_end_time = new Date(endtime); //过期时间x小时后
      }
      let _price = demand?.quotation;
      if (demand?.discount!==undefined && demand?.discount!==0 && demand?.quotation!==undefined) {
          _price = demand?.quotation * demand?.discount
      }
      const temp = template?.[locale ?? 'en']({
        demandId: demand.id, endPoint: process.env.END_CUSTOM_POINT, designer: null, others: {
          demandType: `[QU-${demand.id}] ${typeItem?.[demand.type || 0]}`,
          demandPrice: `HK$ ${formatMoney(_price? _price * 0.45 : 0, 2)} - ${formatMoney(_price? _price * 0.65 : 0, 2)}`,
          limitTime: 6,
          accepted_end_time,
        }
      })?.autoPadding;
      if (!temp) return
      // 重新分配
      if (!demand.designer_user_id) return
      useService('demand').rejectJob(demand.id, demand.designer_user_id)
      transport.sendMail({
        from: `Definer <${process.env.MAIL_USER}>`,
        to: demand.designer?.email,
        subject: temp?.title,
        html: renderToString(<DesignerAutoTemplate
          user={{ name: '' }} template={temp} />)
      })
    })
  },
  // 设计师不足48/24/1小时未完成初稿邮件通知(已测试)
  batchSend48NotFinishedMail: async () => {
    const demands = await useService('demand').getOverXhNotEndDemand(48);
    demands.forEach((demand) => {
      let limitTime = 48
      if (!demand.draft_delivery_time) {
        return;
      }
      const delivery_time = new Date(demand.draft_delivery_time)
      const current = new Date(); //过期时间x小时后
      limitTime = (delivery_time - current) / (1000 * 60 * 60)
      if (limitTime <= 48 && limitTime > 24) {
        limitTime = 48
      }
      if (limitTime <= 24 && limitTime > 1) {
        limitTime = 24
      }
      if (limitTime <= 1 && limitTime > 0) {
        limitTime = 1
      }
      let _price = demand?.quotation;
      if (demand?.discount!==undefined && demand?.discount!==0 && demand?.quotation!==undefined) {
          _price = demand?.quotation * demand?.discount
      }
      const demandPrice = `HK$ ${formatMoney(_price ? _price * 0.45 : 0, 2)} - ${formatMoney(_price? _price* 0.65 : 0, 2)}`
      const demandType = `[QU-${demand.id}] ${typeItem?.[demand.type || 0]}`
      const temp = template?.[locale ?? 'en']({ demandId: demand.id, endPoint: process.env.END_POINT,designer: null,
        others: {demandType, demandPrice, draft_time: demand?.draft_delivery_time, limitTime: limitTime} })?.xNotDraftFinished;
      if (!temp) return
      transport.sendMail({
        from: `Definer <${process.env.MAIL_USER}>`,
        to: demand.designer?.email,
        subject: temp?.title,
        html: renderToString(<DesignerAutoTemplate
          user={{ name: '' }} template={temp} />)
      })
    })
  },
  // 设计师剩余不足48/24/1小时未完成终稿邮件通知(已测试)
  batchSend48NotFinalyFinishedMail: async () => {
    const demands = await useService('demand').getOverXhNotFinalDemand(48);
    demands.forEach((demand) => {
      let limitTime = 48
      if (!demand.final_delivery_time) {
        return;
      }
      const delivery_time = new Date(demand.final_delivery_time)
      const current = new Date(); //过期时间x小时后
      limitTime = (delivery_time - current) / (1000 * 60 * 60)
      if (limitTime <= 48 && limitTime > 24) {
        limitTime = 48
      }
      if (limitTime <= 24 && limitTime > 0) {
        limitTime = 24
      }
      if (limitTime <= 1 && limitTime > 0) {
        limitTime = 1
      }
      let _price = demand?.quotation;
      if (demand?.discount!==undefined && demand?.discount!==0 && demand?.quotation!==undefined) {
          _price = demand?.quotation * demand?.discount
      }
      const demandPrice = `HK$ ${formatMoney(_price ? _price * 0.45 : 0, 2)} - ${formatMoney(_price ? _price * 0.65 : 0, 2)}`
      const demandType = typeItem?.[demand.type || 0]
      const temp = template?.[locale ?? 'en']({ demandId: demand.id, endPoint: process.env.END_POINT,designer: null, others: {demandType,demandPrice, draft_time: demand?.draft_delivery_time, limitTime: limitTime} })?.xNotFinallyFinished;
      if (!temp) return
      transport.sendMail({
        from: `Definer <${process.env.MAIL_USER}>`,
        to: demand.designer?.email,
        subject: temp?.title,
        html: renderToString(<DesignerAutoTemplate
          user={{ name: '' }} template={temp} />)
      })
    })
  },

  sendEmailToUnreadMessageClientOrDesigner: async () => {
    const needEmailList = await prisma.user_message.groupBy({
      _max: {
        id: true,
      },
      by: ['project_id'],
      where: {
        created_at: {
          lt: dayjs().subtract(10, 'minute').toISOString(),
        }
      }
    })
    // console.log("needEmailList", needEmailList)
    if (!needEmailList) return
    for (var i = 0; i < needEmailList.length; i++) {
      // console.log("item", needEmailList[i])
      const item = needEmailList[i]

      // console.log("item.project_id", item.project_id)
      // console.log("item._max.id", item._max.id)
      const messageData = await prisma.user_message.findUnique({
        where: {
          id: item._max.id,
        },
        select: {
          user_role: true,
          read_flag: true,
        },
      })
      
      console.log("messageData", messageData)
      if(!messageData || messageData.read_flag == '1'){continue}

      // console.log("messageData", messageData)
      const user_role = messageData.user_role ?? ''
      const demandData = await prisma.demand.findUnique({
        select: {
          email: true,
          name: true,
          designer_user_id: true,
        },
        where: {
          id: item.project_id,
        },

      })
      // console.log("demandData", demandData)
      const designerUserId = (demandData?.designer_user_id) ?? 0

      const designerUserData = await prisma.user.findUnique({
        select: {
          email: true,
          name: true,
        },
        where: {
          id: designerUserId,
        },
      })
      // console.log("designerUserData", designerUserData)
      let toConsumerEmail = ''
      let toDesignerEmail = ''
      let toConsumerName = ''
      let toDesignerName = ''
      let linkConsumerUrl = ''
      let linkDesignerUrl = ''
      
      const orderNo = 'QU-' + item.project_id
      if (demandData && user_role == 'designer') {
        toConsumerEmail = (demandData.email) ?? ''
        toConsumerName = (demandData.name) ?? ''
        linkConsumerUrl = process.env.CONSUMER_END_POINT + '/dashboard/project/message?id=' + item.project_id + '&next=/dashboard/project/message?id=' + item.project_id
        if(!toConsumerEmail || toConsumerEmail == ''){
          continue
        }
      }
      else if (designerUserData && user_role == 'client') {
        toDesignerEmail = (designerUserData.email) ?? ''
        toDesignerName = (designerUserData.name) ?? ''
        linkDesignerUrl = process.env.END_POINT + '/dashboard/order/' + item.project_id + '/message?next=/dashboard/order/' + item.project_id + '/message'
        if(!toDesignerEmail || toDesignerEmail == ''){
          continue
        }
      }
      else {
        if(demandData && designerUserData && user_role == 'backAdmin'){
          toConsumerEmail = (demandData.email) ?? ''
          toConsumerName = (demandData.name) ?? ''
          linkConsumerUrl = process.env.CONSUMER_END_POINT + '/dashboard/project/message?id=' + item.project_id + '&next=/dashboard/project/message?id=' + item.project_id
          
          toDesignerEmail = (designerUserData.email) ?? ''
          toDesignerName = (designerUserData.name) ?? ''
          linkDesignerUrl = process.env.END_POINT + '/dashboard/order/' + item.project_id + '/message?next=/dashboard/order/' + item.project_id + '/message'
        
          if(!toConsumerEmail || toConsumerEmail == '' || !toDesignerEmail || toDesignerEmail == ''){
            continue
          }
        }
      }
      // toEmail = '310948587@qq.com'
      
      //获取最近三条的信息
      const latestMessagelList = await prisma.user_message.findMany({
        skip: 0,
        take: 3,
        select: {
          message_content: true,
          created_at: true,
          user_name: true,
        },
        where : {
          project_id: item.project_id,
        },
        orderBy: {created_at: "desc"},
      })
      // console.log("toConsumerEmail", toConsumerEmail)
      // console.log("toDesignerEmail", toDesignerEmail)
      // console.log("latestMessagelList", latestMessagelList) 

      if(toConsumerEmail != ''){
        await transport.sendMail({
          from: `Definer <${process.env.MAIL_USER}>`,
          to: toConsumerEmail,
          subject: "New Message Notification!",
          html: renderToString(<MessageBoardMail
            userName={toConsumerName}
            orderNo={orderNo} linkUrl={linkConsumerUrl} messageList = {latestMessagelList} />)
        })
      }

      if(toDesignerEmail != ''){
        await transport.sendMail({
          from: `Definer <${process.env.MAIL_USER}>`,
          to: toDesignerEmail,
          subject: "New Message Notification!",
          html: renderToString(<MessageBoardMail
            userName={toDesignerName}
            orderNo={orderNo} linkUrl={linkDesignerUrl} messageList = {latestMessagelList} />)
        })
      }
      

      await prisma.user_message.update(
        {
          where: { id: item._max.id ?? 0 },
          data: {read_flag: '1'}
        }
      )
    }

  }
})