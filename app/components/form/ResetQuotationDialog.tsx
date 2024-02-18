import { useRef } from "react";
import { useTranslation } from "react-i18next";

export default function ResetQuotationDialog ({ callback }: { callback: (n: number) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()

  return (
    <dialog id="resetQuotationDialog" className="modal">
      <div className="modal-box mb-2">
        <h3 className="font-bold text-lg">New Quotation</h3>

        <div className="flex py-3">
          <input type="number" className="input input-sm input-bordered flex-1" placeholder="New Quotation" ref={ref} />
        </div>



        <div className="modal-action">
          <a className="btn" onClick={() => {
            (window as any)?.resetQuotationDialog.close()
          }}>{t("close")}</a>

          <button className="btn btn-primary" onClick={_ => {
            (window as any)?.resetQuotationDialog.close();
            callback(+ref.current!.value)
          }}>{t("OK")}</button>
        </div>
      </div>
    </dialog>
  )
}