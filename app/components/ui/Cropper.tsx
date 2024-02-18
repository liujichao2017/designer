import { ChangeEvent, DragEvent, useCallback, useRef, useState } from "react"
import Cropper, { ReactCropperElement } from "react-cropper"

type ImageCropperProps = {
  title: string
  raw?: string
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  maxDataSize?: number
  quality?: number,
  cancel: () => void
  upload: (base64Data: string) => void
}

const CropperSize = {
  xs: { width: "50%", height: 60 },
  sm: { width: "50%", height: 100 },
  md: { width: "75%", height: 280 },
  lg: { width: "90%", height: 500 },
  xl: { width: "100%", height: 650 },
}

export const ImageCropper = ({ raw, cancel, upload, title, size = "md", quality = 0.18, maxDataSize = 1024 * 1024 * 2 }: ImageCropperProps) => {
  const [image, setImage] = useState(raw)
  const cropperRef = useRef<ReactCropperElement>(null)
  const [error, setError] = useState("")
  const onChange = useCallback((event: ChangeEvent<HTMLInputElement> & DragEvent<HTMLInputElement>) => {
    event.preventDefault()
    const files = event.dataTransfer?.files || event.target.files
    const reader = new FileReader()
    reader.onload = () => {
      setImage(reader.result as any)
    };
    reader.readAsDataURL(files[0])
  }, [])


  const handleUpload = () => {
    if (typeof cropperRef.current?.cropper !== "undefined") {
      const data = cropperRef.current?.cropper.getCroppedCanvas().toDataURL("image/jpeg", quality)
      if (data.length <= maxDataSize) {
        return upload(data)
      }
      setError("File size is too large, Please resize your image.")
    }
  }

  return (
    <div>
      <div className="w-full flex flex-col gap-5 items-center">
        <h2 className="text-xl font-semibold">{title}</h2>
        <input type="file" onChange={onChange} className="file-input file-input-bordered w-full max-w-xs" />
        <Cropper
          ref={cropperRef}
          style={{ ...CropperSize[size] }}
          zoomTo={0.5}
          initialAspectRatio={1}
          preview=".preview"
          src={image}
          viewMode={1}
          minCropBoxHeight={10}
          minCropBoxWidth={10}
          background={true}
          responsive={true}
          autoCropArea={1}
          checkOrientation={false}
          guides={true}
          crop={() => {
            setError("")
          }}
        />

        <div className="flex flex-col gap-2 items-center">
          {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
          <a onClick={handleUpload} className="btn btn-primary btn-wide">Upload</a>
          <a onClick={cancel} className="btn btn-ghost btn-wide">Cancel</a>
        </div>
      </div>
    </div>
  )
}