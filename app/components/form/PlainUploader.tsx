import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

export default function Uploader ({ onFile }: { onFile: (src: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [image, setImage] = useState("")
  const { t } = useTranslation()
  const allowedTypes = ["image/png", "image/jpeg"]


  const onChange = (event: ChangeEvent<HTMLInputElement> & DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    let files = event.dataTransfer?.files ?? event.target.files
    Array.from(files).forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        return
      }
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => setImage(reader.result as string)
    })
    inputRef.current!.value = ""
  }

  useEffect(() => {
    if (image) onFile(image)
  }, [image])
  return (
    <label
      className="flex justify-center items-center w-full h-28 transition border-2 border-base-content/20 border-dashed rounded-lg appearance-none cursor-pointer hover:bg-base-300/20 hover:text-base-content/80 focus:outline-none text-base-content/40"
      onDrop={onChange}
      onDragEnter={e => {
        e.preventDefault()
      }}
      onDragOver={e => {
        e.preventDefault()
      }}>

      {
        image &&
        <img src={image} className="w-auto h-24 object-cover" /> ||
        <span className="flex flex-col items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="font-medium ">
            {t("upload")}
          </span>
        </span>
      }
      <input type="file" className="hidden" ref={inputRef} onChange={onChange} multiple={false} />
    </label>
  )
}