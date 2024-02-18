import { useTranslation } from "react-i18next"
import Logo from "~/components/ui/Logo"

export default function () {
  const { t } = useTranslation()
  return (
    <dialog id="customerServiceDialog" className="modal">
      <div className="modal-box flex flex-col gap-3 justify-center items-center">
        <h3 className="font-bold text-lg py-4">
          <Logo />
        </h3>
        <p>
          Whatsapp: 6754 8453 <a href="https://wa.me/85267548453" className="link link-primary">(https://wa.me/85267548453)</a>
        </p>
        <p>
          {t("demand.email")}: <a href="mailto:operation@hkdesignpro.com" className="link link-primary">operation@hkdesignpro.com</a>
        </p>
        <p>
          {t("demand.contactMsg")}
        </p>
        <div className="modal-action justify-center">
          <form method="dialog">
            <button className="btn btn-primary btn-wide">
              {t("ok")}
            </button>
          </form>
        </div>
      </div>
    </dialog>
  )
}