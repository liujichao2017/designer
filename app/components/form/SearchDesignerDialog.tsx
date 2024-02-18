import { useFetcher } from "@remix-run/react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { UserProps } from "~/utils/store";
import Avatar from "../ui/Avatar";
import { ResultCode } from "~/utils/result";

export default function SearchDesignerDialog ({ id }: { id: number }) {
  const { t } = useTranslation()
  const keywordRef = useRef<HTMLInputElement>(null)
  const query = useFetcher()
  const fetcher = useFetcher()
  const recommedQuery = useFetcher()
  useEffect(() => {
    recommedQuery.load("/api/admin/demand?_loader=" + "recommend")
  }, [])
  return (
    <dialog id="selectModal" className="modal">
      <div className="modal-box mb-2">
        <h3 className="font-bold text-lg">{t('tip.title')}</h3>
        <div className="flex flex-col gap-4">
          <div className="mt-2.5">
            <input type="text" placeholder={t('demand.selectDesigner')} ref={keywordRef} className="input input-bordered input-sm w-full" onKeyDown={(e) => {
              if (e.key == 'Enter') {
                query.load('/api/admin/demand?_loader=search&keyword=' + keywordRef.current?.value);
                keywordRef.current!.value = ""
              }
            }} />
          </div>
          {
            query.data && query.data.designerList && query.data.designerList.length > 0 &&
            <div className="flex flex-col gap-2">
              <div className="text-sm text-base-content/70">{t('demand.searchResult')}</div>
              <div className="grid grid-cols-2 gap-x-2.5 gap-y-4 text-sm">
                {
                  query.data.designerList.map((value: UserProps) =>
                    <div key={value.id} className="flex cursor-pointer gap-2 items-center" onClick={() => {
                      fetcher.submit({ _action: 'edit', id, designerUserId: value.id }, { method: 'POST', encType: 'application/json' });
                      (window as any)?.selectModal.close()
                    }}>
                      <Avatar user={value} size="sm" />
                      <p>{value.name}</p>
                    </div>
                  )
                }
              </div>
            </div>
          }

          <div className="flex flex-col gap-2">
            <div className="text-sm text-base-content/70">{t('demand.recommandDesigner')}</div>
            <div className="grid grid-cols-2 gap-x-2.5 gap-y-4 text-sm">
              {
                recommedQuery.state === "idle" && recommedQuery.data?.code === ResultCode.OK &&
                recommedQuery.data.recommends.map((value?: UserProps) =>
                  value &&
                  <div className="flex cursor-pointer gap-2 items-center" key={value.id} onClick={() => {
                    fetcher.submit({ _action: 'edit', id, designerUserId: value.id }, { method: 'POST', encType: 'application/json' });
                    (window as any)?.selectModal.close()
                  }}>
                    <Avatar user={value} size="sm" />
                    <p>{value.name}</p>
                  </div>
                )
              }
            </div>
          </div>
        </div>

        <div className="modal-action">
          <a className="btn" onClick={() => {
            (window as any)?.selectModal.close()
          }}>{t("close")}</a>
        </div>
      </div>
    </dialog>
  )
}