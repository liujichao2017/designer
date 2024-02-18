import { Link, Outlet, useLoaderData, useLocation } from "@remix-run/react";
import { isAuthenticated } from "~/utils/sessions.server";
import { json, LoaderArgs, redirect } from "@remix-run/node";
import { useRef, useState } from "react";
import { useService } from "~/services/services.server"
import copy from 'copy-to-clipboard';
import { useToast } from "~/components/ui/use-toast";
import { useTranslation } from "react-i18next";
import {
  ChevronDownIcon,
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
import { Button } from "@/components/ui/button"
export async function loader (args: LoaderArgs) {
  const user = await isAuthenticated(args)
  if (!user) throw redirect("/auth/signin")
  const {
    request
  } = args
  const userAgent = request.headers.get('User-Agent') ?? '';
  const isMobile = /Mobi|Android/i.test(userAgent);

  return json({ code: 200, isMobile, cipher: await useService("designer").getShareLink(user.id) })
}

export default function Page () {
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const active = useRef("text-primary border-b-2 border-primary font-semibold p-2 text-xs truncate")
  const normal = useRef("text-opacity-60 font-semibold p-2 text-xs truncate")

  const { code, cipher, isMobile } = useLoaderData<typeof loader>()

  const [showShareDialog, setShowShareDialog] = useState<boolean>(false)
  const shareLink = () => {
    setShowShareDialog(true)
  }

  const copyLink = () => {
    copy(cipher)
    toast({
      title: t('demandorder.detail.prompt'),
      description: t('demandorder.detail.copyLink'),
    })
  }

  const { toast } = useToast();

  const closeTip = () => {
    setShowShareDialog(false)
  }

  return (
    <>
      <div className="block md:hidden text-xs">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-18 p-0 text-primary">
              {(() => {
                let label = t("demandorder.detail.demandStatusAll")
                if (pathname.endsWith("all")) {
                  label = t("demandorder.detail.demandStatusAll")
                }
                if (pathname.endsWith("pending")) {
                  label = t("demandorder.detail.demandStatusList.3")
                }
                if (pathname.endsWith("processing")) {
                  label = t("demandorder.detail.demandStatusList.4")
                }
                if (pathname.endsWith("finished")) {
                  label = t("demandorder.detail.demandStatusList.7")
                }
                if (pathname.endsWith("evaluated")) {
                  label = t("demandorder.detail.demandStatusList.6")
                }
                if (pathname.endsWith("voided")) {
                  label = t("demandorder.detail.demandStatusList.5")
                }
                return <div className="flex mx-2 text-xs"><span>{label}</span><ChevronDownIcon className="h-4 w-4" /></div>
              })()}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="bg-base-100 w-20">
            <DropdownMenuItem className="text-xs">
              <Link to="/dashboard/designer/orders/all"
                className={pathname.endsWith("all") ? `${active.current} w-full` : `${normal.current} w-full`}>
                {t("demandorder.detail.demandStatusAll")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs">
              <Link to="/dashboard/designer/orders/pending"
                className={pathname.endsWith("pending") ? `${active.current} w-full` : `${normal.current} w-full`}>
                {t("demandorder.detail.demandStatusList.3")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs">
              <Link to="/dashboard/designer/orders/processing"
                className={pathname.endsWith("processing") ? `${active.current} w-full` : `${normal.current} w-full`}>
                {t("demandorder.detail.demandStatusList.4")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs">
              <Link to="/dashboard/designer/orders/finished"
                className={pathname.endsWith("finished") ? `${active.current} w-full` : `${normal.current} w-full`}>
                {t("demandorder.detail.demandStatusList.7")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs">
              <Link to="/dashboard/designer/orders/evaluated"
                className={pathname.endsWith("evaluated") ? `${active.current} w-full` : `${normal.current} w-full`}>
                {t("demandorder.detail.demandStatusList.6")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs">
              <Link to="/dashboard/designer/orders/voided"
                className={pathname.endsWith("voided") ? `${active.current} w-full` : `${normal.current} w-full`}>
                {t("demandorder.detail.demandStatusList.5")}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex flex-col gap-4">
        <div className="hidden md:flex gap-4 justify-left lg:justify-start positive">
          <Link to="/dashboard/designer/orders/all"
            className={pathname.endsWith("all") ? active.current : normal.current}>
            {t("demandorder.detail.demandStatusAll")}
          </Link>
          <Link to="/dashboard/designer/orders/pending"
            className={pathname.endsWith("pending") ? active.current : normal.current}>
            {t("demandorder.detail.demandStatusList.3")}
          </Link>
          <Link to="/dashboard/designer/orders/processing"
            className={pathname.endsWith("processing") ? active.current : normal.current}>
            {t("demandorder.detail.demandStatusList.4")}
          </Link>
          <Link to="/dashboard/designer/orders/finished"
            className={pathname.endsWith("finished") ? active.current : normal.current}>
            {t("demandorder.detail.demandStatusList.7")}
          </Link>
          <Link to="/dashboard/designer/orders/evaluated"
            className={pathname.endsWith("evaluated") ? active.current : normal.current}>
            {t("demandorder.detail.demandStatusList.6")}
          </Link>
          <Link to="/dashboard/designer/orders/voided"
            className={pathname.endsWith("voided") ? active.current : normal.current}>
            {t("demandorder.detail.demandStatusList.5")}
          </Link>
          {/* ${isMobile ? "invisible": "visible"} */}
          <div className={`absolute right-12 bg-[#2F4CDD] rounded flex items-center cursor-pointer ${isMobile ? "invisible" : "visible"}`} onClick={shareLink}>
            <span className="text-xs text-white px-4 py-2">{t('share')}</span>
          </div>
          {!isMobile && showShareDialog ? (
            <div className="absolute border-2 border-slate-400 bg-white flex top-36 right-12 px-4 py-2  rounded flex items-center z-[999]">
              <input className="input input-bordered w-[400px] h-8 text-sm"
                type="text"
                readOnly
                value={cipher}>
              </input>

              <span className="text-sm rounded cursor-pointer ml-4" onClick={copyLink}>{t('copy')}</span>
              <span className="text-sm rounded cursor-pointer ml-4" onClick={closeTip}>{t('close')}</span>
            </div>
          ) : ''}
        </div>
        {
          isMobile && (
            <div className="bg-[#2F4CDD] w-1/3 justify-center rounded flex items-center cursor-pointer" onClick={shareLink}>
              <span className="text-xs text-white px-4 py-2">{t('share')}</span>
            </div>
          )
        }

        {isMobile && showShareDialog ? (
          <div className="border-2 border-slate-400 bg-white flex flex-col px-4 py-2 rounded items-center z-[999]">
            <input className="input input-bordered w-full h-8 text-sm"
              type="text"
              readOnly
              value={cipher}>
            </input>

            <span className="text-sm rounded cursor-pointer mt-2.5" onClick={copyLink}>{t('copy')}</span>
            <span className="text-sm rounded cursor-pointer mt-2.5" onClick={closeTip}>{t('close')}</span>
          </div>
        ) : ''}

        <div className="rounded-xl bg-base-100">
          <Outlet />
        </div>
      </div>
    </>
  )
}

