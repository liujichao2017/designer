import { LoaderArgs, defer, json, redirect } from "@remix-run/node";
import mailer from "nodemailer"

import { Await, useLoaderData } from "@remix-run/react";
import { Suspense, useEffect } from "react";
import { getObject, uploadImage, uploadImageContent } from "~/services/aws.server";
import { cipherPassword, cryptoPassword, decipherPassword, decrypto, encrypto } from "~/utils/crypto.server";
import { Roles, useAppearanceStore } from "~/utils/store";
import Masonry from "~/components/ui/Masonry";
import { chunk, shuffle } from "~/utils/helpers";
import { prisma } from "~/services/database.server";
import { useEventSourceExt } from "~/utils/eventsource";
import { useService } from "~/services/services.server";
import { isAuthenticated } from "~/utils/sessions.server";
import { DemandStatus } from "~/services/status.server";

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { getDesignersByPictures } from "~/services/logic.server";
import { transport } from "~/services/mail.server";
import { log } from "console";


const filepath = "/Users/alan/Pictures/DSC02922.jpg"

export const loader = async ({ request, context, params }: LoaderArgs) => {
  // const users: Promise<string[]> = new Promise(r => setTimeout(() => r(["Alan", "Ida"]), 3000))
  // const pw = cipherPassword("asdas3312ds")
  // const data = encrypto({ id: 7, ts: Date.now() })
  // const pictures = await prisma.picture.findMany({
  //   select: { litpic_url: true, id: true, img_url: true }
  // })
  // // const user = await isAuthenticated({ request, context, params })
  // // if (!user) throw redirect("/auth/signin")
  // // await useService("mail").sendDemandMail(162)
  // // useService("notify", { user }).rejectJob(12, "报价太低，时间太短")
  // // useService("demand").rejectJob(12, user.id)
  // const dd = await useService("picture").getDesignerByPicture([244, 389])
  // const demand = await useService("demand").getDemand(125)
  // //@ts-ignore
  // const level = await useService("demand").getQuotationLevel(demand)
  // console.log(level, "level", typeof level)

  // // console.log(await useService("demand").getQuotationLevelPlain([80, 81, 82, 87, 88]), "plain level")

  // //@ts-ignore
  // console.log(useService("demand").getQuotations(demand, level), "quotation")

  // const result = await prisma.demand.findMany({
  //   where: { status: DemandStatus.settled },
  //   select: {
  //     demand_pay: {
  //       select: {
  //         user_income: true
  //       }
  //     }
  //   }
  // })
  // const designers = await useService("picture").getDesignerByPicture([
  //   781,
  //   775,
  //   732
  // ])

  // // console.log(await useService("admin", { user }).checkout(3, 0.6))
  // return defer({
  //   users, pictures, password: decipherPassword(pw),
  //   data: encodeURIComponent(data), designers,
  //   clientId: process.env.PAYPAL_CLIENT_ID
  // })
  // const buf = await fetch(`${process.env.END_POINT}/quotation/pdf/${}`).then(resp => resp.arrayBuffer())
  // const service = useService("demand")
  // const pictures = [85, 86, 87, 94, 93]
  // const lv = await service.getQuotationLevelPlain(pictures)
  // // console.log(lv)
  // console.log(await prisma.user.findMany({
  //   where: {
  //     roles: { some: { role: { name: Roles.PRO } } },
  //     pictures: {
  //       some: {
  //         tags: {
  //           some: {
  //             id: 27
  //           }
  //         }
  //       }
  //     }
  //   },
  //   select: {
  //     id: true, name: true, email: true,
  //     _count: {
  //       select: { pictures: true }
  //     }
  //   },
  // }))

  // console.log(await prisma.user.findMany({
  //   where: {
  //     roles: { some: { role: { name: Roles.PRO } } },
  //     pictures: {
  //       some: {
  //         level: lv
  //       }
  //     }
  //   },
  //   select: {
  //     id: true, name: true, email: true,
  //     _count: {
  //       select: { pictures: true }
  //     }
  //   }
  // }))

  // console.log(await getDesignersByPictures(pictures))

  // console.log(cryptoPassword("111111"));
  const transport = mailer.createTransport({
    service: process.env.MAIL_SERVICE as string,
    host: process.env.MAIL_HOST as string,
    port: parseInt(process.env.MAIL_PORT as string),
    secure: false,
    auth: {
      user: process.env.MAIL_USER as string,
      pass: process.env.MAIL_PASS as string
    },
  })
  console.log(process.env.MAIL_HOST as string)
  console.log("Start send mail")
  const d = await transport.sendMail({
    from: `Definer <${process.env.MAIL_USER}>`,
    to: "knift@qq.com",
    subject: "  Definer Smtp test",
    html: "<h1>test</h1>"
  })
  console.log(d)
  return json({})
}

export default () => {
  useLoaderData()
  return (
    <h1>test</h1>
  )
}

function Timer () {
  const { data, ctrl } = useEventSourceExt("/api/notify", {
    event: "time",
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: "Alan"
    })
  })

  return (
    <>
      {data && <h3>{data}</h3>}
      <button onClick={() => ctrl.abort()}>Abort</button>
    </>
  )
}
