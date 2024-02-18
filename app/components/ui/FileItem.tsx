import { PhotoView } from "react-photo-view"
import { formatBytes } from "~/utils/helpers"
type Props = {
  name: string,
  size: number,
  src: string,
  type: string,
  id: string,
  remove: (id: string) => void
  upload?: () => void
}

export default ({ name, size, src, type, id, remove, upload }: Props) => {
  return (
    <div className="flex justify-between items-center group py-1">
      <div className="flex items-center gap-2">
        {
          type.startsWith("image") &&
          <PhotoView src={src}>
            <img src={src} className="w-16 rounded-md object-cover cursor-pointer" />
          </PhotoView>
        }
        {
          type.startsWith("application/pdf") &&
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 object-cover">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        }
        <div className="flex flex-col gap-1 text-sm">
          <span>{name.length > 20 ? `${name.slice(0, 20)}...` : name}</span>
          <span>{formatBytes(size)}</span>
        </div>
      </div>

      <div className="flex gap-2 group-hover:opacity-100 opacity-0 cursor-pointer ease-in-out duration-200" onClick={() => remove(id)}>
        {
          upload &&
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg> || <></>
        }
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      </div>
    </div>
  )
}