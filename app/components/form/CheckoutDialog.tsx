import dayjs from "dayjs"
import { useTranslation } from "react-i18next"

type Order = {
  id: number,
  deliveryAt?: string,
  score?: number,
  amount: number,
  reason?: string
}

type Props = {
  orders: Order[],
}

export default function CheckoutDialog ({ orders }: Props) {
  const { t } = useTranslation()
  return (
    <dialog id="checkoutDialog" className="modal">
      <div className="modal-box">
        <div className="flex justify-center font-semibold text-lg">
          {t("salary.result")}
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>{t("salary.orderno")}</th>
              <th>{t("salary.deliveryDate")}</th>
              <th>{t("salary.score")}</th>
              <th>{t("salary.amount")}</th>
            </tr>
          </thead>
          <tbody>
            {
              orders.map(val => {
                return (
                  !val.reason ?
                    <tr>
                      <td>QU-{val.id}</td>
                      <td>{dayjs(val.deliveryAt).format("YYYY-MM-DD")}</td>
                      <td>{val.score?.toFixed(1)}</td>
                      <td>{val.amount}</td>
                    </tr> :
                    <tr>
                      <td>QU-{val.id}</td>
                      <td>
                        <span className="text-error">{val.reason}</span>
                      </td>
                    </tr>
                )
              })
            }
          </tbody>
        </table>

        <form method="dialog" className="modal-action justify-center">
          <button className="btn btn-primary">{t("ok")}</button>
        </form>
      </div>

    </dialog>
  )
}