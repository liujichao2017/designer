import { useTranslation } from "react-i18next"
import { useToast } from "../ui/use-toast";
import { useCopyToClipboard } from 'usehooks-ts'
import { useEffect, useRef, ReactNode } from "react";
import { randCode } from "~/utils/helpers";
import { Link } from "@remix-run/react";

type Props = {
  id?: string
  link?: string
  title?: string
  links?: { url: string, name?: string, logo?: string }[]
}

export default function ShareLinkDialog (
  { link = "", title = "", id = "shareLinkDialog", links = [] }:
    Props & { children?: ReactNode }) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [_, copy] = useCopyToClipboard()
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    ref.current && ref.current!.select()
  }, [link])
  return (
    <dialog id={id} className="modal">
      <div className="modal-box flex flex-col gap-3">
        <h3 className="font-bold text-lg pb-3">{title}</h3>
        {
          link &&
          <>
            <input type="text" value={link} className="input input-bordered w-full" readOnly={true} ref={ref} />
            <div className="modal-action">
              <form method="dialog" className="flex gap-3">
                <button className="btn btn-ghost btn-sm">{t("cancel")}</button>
                <button className="btn btn-primary btn-sm" onClick={() => {
                  copy(link)
                  toast({ description: t("copied") })
                }}>{t("copy")}</button>
              </form>
            </div>
          </>
        }

        {
          !!links.length &&
          <div className="flex flex-col gap-4">
            {
              links.map(val => (
                <div className="flex flex-col gap-1" key={randCode()}>
                  {
                    val.name &&
                    <label className="font-bold">{val.name}</label>
                  }
                  <div className="join w-full">
                    <input type="text" value={val.url}
                      className="input input-bordered input-sm flex-1 join-item focus:border-primary active:border-primary active:outline-0 focus:outline-0" readOnly={true} />
                    <form method="dialog">
                      <button className="btn btn-sm join-item btn-secondary" onClick={() => {
                        copy(val.url)
                        toast({ description: t("copied") })
                      }}>{t("copy")}</button>

                      <a href={val.url} target="_blank" className="btn btn-sm join-item btn-primary">{"Open"}</a>
                    </form>
                  </div>
                </div>
              ))
            }
            <div className="modal-action">
              <form method="dialog" className="flex gap-3">
                <button className="btn">{t("cancel")}</button>
              </form>
            </div >
          </div>
        }

      </div >
    </dialog >
  )
}