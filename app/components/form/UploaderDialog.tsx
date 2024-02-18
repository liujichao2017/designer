import { useRef } from "react"
import Uploader, { FileContent, UploaderHandler } from "./Uploader"
import { useTranslation } from "react-i18next"


type uploadHandler = (files: FileContent[]) => void
type Props = Record<string, unknown> & {
  upload: uploadHandler
  name?: string
}

export default function ({ upload, name = "uploaderDialog", ...props }: Props) {
  const uploadRef = useRef<UploaderHandler>(null)
  const { t } = useTranslation()
  let uploadData = useRef<FileContent[]>([])

  const uploaderChange = (files: FileContent[]) => {
    uploadData.current = files
  }

  return (
    <dialog id={name} className="modal modal-top md:modal-middle">
      <form method="dialog" className="modal-box shadow-none" onSubmit={_ => {
        upload(uploadData.current)
        uploadRef.current!.reset()
      }}>
        <h3 className="font-bold text-lg">{t('uploader.title')}</h3>

        <div className="pt-4 flex h-full justify-center items-center">
          <div className="w-full flex flex-col gap-3">
            <Uploader
              change={uploaderChange}
              ref={uploadRef}
              previewOpen={() => {
                //@ts-ignore
                (window as any)[name]?.close()
              }}
              previewClose={() => {
                //@ts-ignore
                (window as any)[name]?.showModal()
              }}
              {...props} />
          </div>
        </div>

        <div className="modal-action">
          <a className="btn" onClick={() => uploadRef.current?.reset()}>
            {t("reset")}
          </a>
          <a className="btn" onClick={() => {
            //@ts-ignore
            (window as any)[name]?.close();
            uploadRef.current?.reset();
          }}>{t("cancel")}</a>
          <button className="btn btn-primary">{t("uploader.uploadAll")}</button>
        </div>
      </form>
    </dialog>
  )
}