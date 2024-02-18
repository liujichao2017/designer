import { useRef } from "react"
import { useDemandState, validLangs } from "~/utils/store"
import { FileContent } from "../Uploader"
import UploaderDialog from "../UploaderDialog"
import { PhotoProvider } from "react-photo-view"
import PictureItem from "./PictureItem"
import { useNavigate, useSearchParams } from "@remix-run/react"
import { useTranslation } from "react-i18next"

const categoriesMapper = {
  0: 1,
  1: 4,
  3: 8,
  99: -1,
}

export default function () {
  const { t } = useTranslation()
  const [attach, setAttach, design, service, bussiness] = useDemandState(state => [state.attachment, state.setAttachmentOption, state.design, state.service, state.bussiness])
  const ref = useRef<HTMLTextAreaElement>(null)

  const [searchParams,] = useSearchParams()
  const navigate = useNavigate()

  const handleSubmit = () => {
    if (service === 2) {
      navigate("/demand/confirm?" + searchParams.toString())
      return
    }
    //@ts-ignore
    // const category = categoriesMapper[design?.type ?? 99]
    const category = design?.type === 3 ? "card" : ""
    navigate("/demand/style?" + searchParams.toString() + "&category=" + (category ?? ""))
  }

  const selectedImages = (contents: FileContent[]) => {
    if (attach?.images?.length && attach?.images?.length >= 5) return
    setAttach({ images: contents.map(val => val.src) })
  }

  const removePicture = (index: number) => {
    if (!attach?.images) return
    attach.images.splice(index, 1)
    setAttach({ images: attach?.images })
  }

  return (
    <>
      <form className="flex flex-col gap-6" onSubmit={e => {
        e.preventDefault()
        handleSubmit()
      }}>

        <div className="flex flex-col gap-2 w-full">
          <label className="flex justify-between items-end">
            <span className="flex items-center">
              {t("demand.remark")}
            </span>
          </label>
          <textarea ref={ref} rows={12} placeholder={t("demand.remark")} className="textarea textarea-bordered rounded-lg"
            onBlur={e => setAttach({ remark: e.target.value })} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <button className="btn btn-primary rounded-full w-full" onClick={e => {
            e.preventDefault();
            (window as any).uploaderDialog.showModal()
          }}>{t("demand.uploadDocument")}</button>
          <div className="flex flex-wrap gap-4">
            <PhotoProvider>
              {
                attach?.images?.map((val, i) =>
                  <PictureItem id={i} image={val} key={Math.random()} remove={removePicture} />
                )
              }
            </PhotoProvider>
          </div>
        </div>

        <div className="flex gap-2 w-full">
          <button className="btn rounded-full w-1/2" onClick={e => {
            e.preventDefault()
            navigate("/demand/requirement/1?" + searchParams.toString())
          }}>{t("demand.back")}</button>
          <button className="btn btn-primary rounded-full w-1/2" type="submit">{t("demand.next")}</button>
        </div>
      </form>

      <UploaderDialog upload={selectedImages} totalSize={1024 * 1024 * 3 * 2} maxItemSize={1024 * 1024 * 3} maxItemCount={2} />
    </>
  )
}