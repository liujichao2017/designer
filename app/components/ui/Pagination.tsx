import { Link } from "@remix-run/react"
import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { range } from "~/utils/helpers"

type Props = {
  itemsCount?: number
  showDirection?: boolean
  totalPages: number
  currentPage: number
  linkGenerator: (page: number) => string
}

export default function (
  { totalPages, currentPage, linkGenerator, itemsCount = 5, showDirection = true }: Props
) {
  itemsCount = itemsCount > totalPages && totalPages || itemsCount
  const left = range(Math.floor(itemsCount / 2), currentPage - 1, -1).filter(val => val > 0).reverse()
  const right = range(Math.floor(itemsCount / 2), currentPage + 1, 1).filter(val => val <= totalPages)
  // console.log(right, left, currentPage, itemsCount / 2)
  const { t } = useTranslation()
  return (
    <div className="join">
      {
        showDirection &&
        <Link to={linkGenerator(currentPage - 1)}
          className={`join-item btn ${currentPage <= 1 && "btn-disabled" || ""}`}>{t("previous")}</Link>
      }
      {
        left.map((val, index) =>
          <Link key={index} to={linkGenerator(val)} className="join-item btn">{val}</Link>
        )
      }
      <Link to={linkGenerator(currentPage)} className="join-item btn btn-active btn-disabled">{currentPage}</Link>
      {
        right.map((val, index) =>
          <Link key={index} to={linkGenerator(val)} className="join-item btn">{val}</Link>
        )
      }
      {
        showDirection &&
        <Link to={linkGenerator(currentPage + 1)}
          className={`join-item btn ${(currentPage === totalPages || totalPages == 0)&& "btn-disabled" || ""}`}>{t("next")}</Link>
      }
    </div >
  )
}