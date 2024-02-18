import { ChangeEvent, useRef, DragEvent, useState, forwardRef, useImperativeHandle, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { AnimatePresence, motion } from "framer-motion"
import { getFileType } from '@/utils/helpers'
import FileItem from "../ui/FileItem"
import { formatBytes } from "~/utils/helpers"
import { PhotoProvider, PhotoView } from "react-photo-view"

export type FileContent = {
  id: string,
  name: string
  src: string
  size: number
  type: string
}

type Props = {
  className?: string | undefined;
  multiple?: boolean
  allowedTypes?: string[]
  maxItemCount?: number
  maxItemSize?: number
  totalSize?: number
  change?: (data: FileContent[]) => void
  asyncChange?: (data: FileContent[]) => void
  uploadAll?: (files: FileContent[]) => void
  uploadSingle?: (f: FileContent) => void
  previewOpen?: () => void
  previewClose?: () => void
  sync?: boolean // 是否立即上传true为立即上传，默认false，如果为立即上传模式，则不展示item项目，item详情将在自己业务逻辑中处理
  // syncUploadData?: FileContent[] // 只有sync 为true时生效
}


export type UploaderHandler = {
  reset: () => void
}

const validateType = (allows: string[], type: string) =>
  allows.includes(type)


export default forwardRef<UploaderHandler, Props>(({
  className = '',
  change = () => { },
  multiple = true,
  asyncChange = () => {},
  maxItemCount = 5, maxItemSize = 1024 * 1024 * 28, totalSize = 1024 * 1024 * 28 * 5,
  allowedTypes = ["image/png", "image/jpeg"],
  previewClose = () => { }, previewOpen = () => { },
  sync = false,
  // syncUploadData = []
}, ref) => {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploadData, setUploadData] = useState<FileContent[]>([])
  const [error, setError] = useState("")

  const onChange = (event: ChangeEvent<HTMLInputElement> & DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setError("")
    if (sync) {
      setUploadData([])
    }
    let files = event.dataTransfer?.files ?? event.target.files
    let backFiles:  FileContent[] = []
    Array.from(files).forEach((file) => {
      if (!validateType(allowedTypes, file.type)) {
        return
      }
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        console.log('文件读取完成:', file.name);
        const f: FileContent = {
          id: `${Date.now()}${Math.random()}`, name: file.name,
          src: reader.result as string,
          size: file.size, type: file.type
        }
        setUploadData(prev => {
          if (f.size > maxItemSize) {
            setError(`File size is too large, file max size is ${formatBytes(maxItemSize)}`)
            return prev
          }
          if (prev.reduce((prev, f) => prev + f.size, 0) > totalSize) {
            setError(`Total files size is too large, max size is ${formatBytes(totalSize)}`)
            return prev
          }
          if (prev.length >= maxItemCount) {
            setError(`Total files count is too more, max files count is ${maxItemCount}`)
            return prev
          }
          return [f, ...prev]
        })
        backFiles.push(f);
        if (backFiles.length === files.length && sync) {
          // 文件读取完毕
          asyncChange(backFiles)
        }
      }
    })
  }

  const onRemove = (id: string) => {
    setUploadData(prev => {
      const now = prev.filter(p => p.id != id)
      return now
    })
  }

  useEffect(() => {
    if (!sync) {
      change(uploadData)
    }
  }, [uploadData])

  useImperativeHandle(ref, () => ({
    reset () {
      setUploadData([])
    }
  }))

  return (
    <>
      <label
        className={`flex justify-center w-full h-32 transition border-2 border-base-300 border-dashed rounded-md appearance-none cursor-pointer hover:bg-base-300/30 hover:text-base-content/80 focus:outline-none text-base-content/60 bg-base-300/10 ${className}`}
        onDrop={onChange}
        onDragEnter={e => {
          e.preventDefault()
        }}
        onDragOver={e => {
          e.preventDefault()
        }}>
        <span className="flex flex-col items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="font-medium ">
            {!sync ? `Browse files to attach,allow ${allowedTypes.map((t, i) => 
              {
                var initialName = t.split("/").at(1)
                if(initialName == 'vnd.openxmlformats-officedocument.wordprocessingml.document'){
                  return 'docx'
                }
                if(initialName == 'msword'){
                  return 'doc'
                }
                if(initialName == 'vnd.openxmlformats-officedocument.spreadsheetml.sheet'){
                  return 'xlsx'
                }
                if(initialName == 'vnd.ms-excel'){
                  return 'xls'
                }
                return initialName
              }
              ).join(", ")}` : t('drag')}
              
          </span>
        </span>
        <input type="file" className="hidden" ref={inputRef} onChange={onChange} multiple={multiple} />
      </label>

      {
        error &&
        <span className="text-error text-sm">{error}</span>
      }
      <PhotoProvider onVisibleChange={(visible) => visible ? previewOpen() : previewClose()}>
        <AnimatePresence>
          {
          !sync &&  uploadData.map((d, i) => (
              <motion.div
                key={`file_${i}`}
                transition={{ delay: 0.1 * i }}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <FileItem {...d} remove={() => onRemove(d.id)} />
              </motion.div>
            ))
          }
        </AnimatePresence>
      </PhotoProvider>
    </>
  )
})