//@ts-nocheck
import { LoaderArgs, redirect } from "@remix-run/node";
import * as html2pdf from "html-pdf-node"
import dayjs from "dayjs";
import { useService } from "~/services/services.server";

export async function loader ({ params }: LoaderArgs) {
  const { id } = params
  const demand = await useService("demand", {}).getDemand(+id)
  if (demand?.quotation && demand?.quotation_pdf) {
    // throw redirect(demand?.quotation_pdf)
  }
  const options = {
    format: "A4",
    displayHeaderFooter: true,
    footerTemplate: `
    <span style="color: #999 !important; width:100% !important;font-size:8px !important; margin-left: 25px !important;">
    HK Design Pro 盡心盡力為您服務
    </span>
    `,
    headerTemplate: `
    <span style="color: #999 !important; width:100% !important;font-size:8px !important; margin-left: 25px !important;">
    ${dayjs(demand.created_at ?? Date.now()).format("DD/MMM/YYYY")}
    </span>
    `,
    margin: {
      top: 50,
      bottom: 50,
      left: 15,
      right: 15
    }
  }
  const file = { url: process.env.END_POINT + "/quotation/" + id }
  const pdf = await html2pdf.generatePdf(file, options)
  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
    }
  })
}