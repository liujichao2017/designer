//@ts-nocheck
import mailer from "nodemailer"
import { renderToString } from "react-dom/server"
import { UserProps } from "~/utils/store"
import { TimelineStatus } from '@/utils/definition'
import ActiveMail from "../templates/ActiveMail"
import { randCode } from "~/utils/helpers"
import { DBStatusCode, prisma } from "./database.server"
import DemandMail, { template as demandTemplate } from "~/templates/DemandMail"
import ResetPasswordMail from "~/templates/ResetPasswordMail"
import { encrypto } from "~/utils/crypto.server"
import QuotationUpgradeMail from "~/templates/QuotationUpgradeMail"
import SigninMail from "~/templates/SigninMail"
import ActivedMail from "~/templates/ActivedMail"
import DesignerConfirmMail from "~/templates/DesignerConfirmMail"
import AcceptOfferMail from "~/templates/AcceptOfferMail"
import AcceptDemand, { DesignerTemplate, template } from '~/templates/AcceptDemand'
import UnquotedAdminMail from "~/templates/UnquotedAdminMail"

export const transport = mailer.createTransport({
  service: process.env.MAIL_SERVICE as string,
  host: process.env.MAIL_HOST as string,
  port: parseInt(process.env.MAIL_PORT as string),
  secure: true,
  auth: {
    user: process.env.MAIL_USER as string,
    pass: process.env.MAIL_PASS as string
  },
})


export default ({ user, locale }: { user: UserProps, locale?: string }) => ({
  sendGreetingMail: async () => {
    if (!user) return
    await transport.sendMail({
      from: `Definer <${process.env.MAIL_USER}>`,
      to: user.email,
      subject: "Welcome to Definer tech",
      html: renderToString(
        <SigninMail name={user.name} />
      )
    })
  },
  sendActiveMail: async () => {
    const code = randCode(6)
    await prisma.code.create({ data: { code, email: user.email, status: DBStatusCode.VALID } })
    await transport.sendMail({
      from: `Definer <${process.env.MAIL_USER}>`,
      to: user.email,
      subject: "Active definer account",
      html: renderToString(<ActiveMail
        user={user} endPoint={process.env.END_POINT as string} code={code} />)
    })
  },
  sendActivedMail: async () => {
    if (!user) return
    await transport.sendMail({
      from: `Definer <${process.env.MAIL_USER}>`,
      to: user.email,
      subject: "Account actived",
      html: renderToString(
        <ActivedMail name={user.name} />
      )
    })
  },

  sendDesignerConfirmMail: async (demandId: number, designerId: number) => {
    const demand = await prisma.demand.findFirst({ where: { id: demandId }, select: { email: true, name: true } })
    if (!demand) return
    const designer = await prisma.user.findFirst({ where: { id: designerId } })
    if (!designer) return

    const consumer = demand.name ?? demand.email.split("@").at(0)
    await transport.sendMail({
      from: `Definer <${process.env.MAIL_USER}>`,
      to: user.email,
      subject: "You received a job invitation",
      html: renderToString(
        <DesignerConfirmMail name={designer.name} consumer={consumer} />
      )
    })
  },

  sendAcceptOfferMail: async (demandId: number, designerId: number) => {
    const demand = await prisma.demand.findFirst({ where: { id: demandId }, select: { email: true, name: true } })
    if (!demand) return
    const designer = await prisma.user.findFirst({ where: { id: designerId } })
    if (!designer) return

    const consumer = demand.name ?? demand.email.split("@").at(0)
    await transport.sendMail({
      from: `Definer <${process.env.MAIL_USER}>`,
      to: user.email,
      subject: "Job Confirmation",
      html: renderToString(
        <AcceptOfferMail name={designer.name} consumer={consumer} />
      )
    })
  },

  sendResetPasswordMail: async (email: string) => {
    const code = encrypto({ expire: Date.now() + 1000 * 60 * 30, email })
    await transport.sendMail({
      from: `Definer <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Reset definer account password",
      html: renderToString(
        <ResetPasswordMail email={email} code={code} endPoint={process.env.END_POINT as string} />
      )
    })
  },

  sendUpgradeQuotationMail: async (id: number) => {
    const demand = await prisma.demand.findFirst({
      where: { id }
    })
    if (!demand) return
    const name = demand?.email.split("@").at(0)
    const platform = demand?.platform === 1 ? "Definer tech" : "HK Design Pro"
    await transport.sendMail({
      from: `Definer <${process.env.MAIL_USER}>`,
      to: demand?.email,
      subject: "Quotation changed",
      html: renderToString(
        <QuotationUpgradeMail name={name} platform={platform} />
      )
    })
  },

  sendUnquotedAdminMail: async (id: number) => {
    await transport.sendMail({
      from: `Definer <${process.env.MAIL_USER}>`,
      to: "operation@hkdesignpro.com",
      subject: "Quote as soon as possible",
      html: renderToString(
        <UnquotedAdminMail id={id} />
      )
    })
  },

  sendDemandMail: async (id: number) => {
    const demand = await prisma.demand.findFirst({ where: { id } })
    if (!demand || !demand.email) return
    const picIds = JSON.parse(demand?.picture_id ?? "[]")
    const pictures = await prisma.picture.findMany({
      where: { id: { in: picIds } },
    })
    const designer = demand?.designer_user_id ? await prisma.user.findFirst({
      where: { id: demand.designer_user_id },
      select: { name: true, id: true, email: true }
    }) : undefined
    let attachments = []
    let loginUrl = ""
    let subjectName = "Requirement Confirmation Email"
    if (demand.form_designer_flag && demand.form_designer_flag == 'y') {
      if ((demand.type === 0 && [0, 1].includes(demand.size ?? -1)) || demand.type === 3) {
        const quotation = await fetch(`${process.env.END_POINT}/quotation/pdf/${demand.id}`).then(res => res.blob()).then(b => b.arrayBuffer())
        attachments = [
          {
            filename: "quotation.pdf",
            content: Buffer.from(quotation),
            contentType: "application/pdf"
          }
        ]
      }

      try {
        const json = await fetch(`${process.env.CONSUMER_END_POINT}/api/v1?_loader=getLoginLink&email=${demand.email}`).then(resp => resp.json())
        if (json.code === 0) {
          loginUrl = json.data.link
        }
      } catch (err) {

      }

      subjectName = "Quotation Confirmation Email"
    }
    else {
      const domainUrl = process.env.NODE_ENV == 'development' ? process.env.END_CUSTOM_CONSUMER_POINT : process.env.CONSUMER_END_POINT
      const cipher = encrypto({ demandId: id })
      loginUrl = domainUrl + "/share/project/designer/" + cipher
    }

    const currentTemplate = demandTemplate?.[locale ?? 'en']({ loginUrl, demand, pictures: pictures.map(val => val.litpic_url ?? val.img_url), designer })
    await transport.sendMail({
      from: `Definer <${process.env.MAIL_USER}>`,
      to: demand.email,
      subject: subjectName,
      attachments,
      html: renderToString(
        <DemandMail
          template={currentTemplate} />
      )
    })
  },
  sendAcceptMail: async (id: number, mail: string) => {
    if (!mail) {
      return;
    }
    const temp = template?.[locale ?? 'en']({ demandId: id, endPoint: process.env.END_CUSTOM_POINT, designer: user.name })?.accept;
    await transport.sendMail({
      from: `Definer <${process.env.MAIL_USER}>`,
      to: mail,
      subject: temp.title,
      html: renderToString(<DesignerTemplate
        user={{ name: '' }} template={temp} />)
    })
  },
  sendBeginMail: async (id: number, mail: string) => {
    if (!mail) {
      return;
    }
    const temp = template?.[locale ?? 'en']({ demandId: id, endPoint: process.env.END_CUSTOM_POINT })?.start;
    await transport.sendMail({
      from: `Definer <${process.env.MAIL_USER}>`,
      to: mail,
      subject: temp.title,
      html: renderToString(<DesignerTemplate
        user={{ name: '' }} template={temp} />)
    })
  },
  sendDraftMail: async (id: number, mail: string) => {
    if (!mail) {
      return;
    }
    const temp = template?.[locale ?? 'en']({ demandId: id, endPoint: process.env.END_CUSTOM_POINT, designer: user.name })?.draft;
    await transport.sendMail({
      from: `Definer <${process.env.MAIL_USER}>`,
      to: mail,
      subject: temp.title,
      html: renderToString(<DesignerTemplate
        user={{ name: '' }} template={temp} />)
    })
  },
  sendFinallyMail: async (id: number, mail: string) => {
    if (!mail) {
      return;
    }
    const temp = template?.[locale ?? 'en']({ demandId: id, endPoint: process.env.END_CUSTOM_POINT, designer: user.name })?.finally;
    await transport.sendMail({
      from: `Definer <${process.env.MAIL_USER}>`,
      to: mail,
      subject: temp.title,
      html: renderToString(<DesignerTemplate
        user={{ name: '' }} template={temp} />)
    })
  },
  sendComplateMail: async (id: number, mail: string, status: number) => {
    if (!mail) {
      return;
    }
    let temp = {};
    if (status == TimelineStatus.FINISHEDDAFT) {
      temp = template?.[locale ?? 'en']({ demandId: id, endPoint: process.env.END_CUSTOM_POINT, designer: user.name })?.finishedDraft;
    }

    if (status == TimelineStatus.FINISHEDFULL) {
      temp = template?.[locale ?? 'en']({ demandId: id, endPoint: process.env.END_CUSTOM_POINT, designer: user.name })?.finishedFull;
    }
    await transport.sendMail({
      from: `Definer <${process.env.MAIL_USER}>`,
      to: mail,
      subject: temp.title,
      html: renderToString(<DesignerTemplate
        user={{ name: '' }} template={temp} />)
    })
  },

})