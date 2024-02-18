import { PhotoView } from "react-photo-view"
import { PlusCicleIcon } from "./Icons"

type Props = {
  id: number,
  thumbnail: string,
  image?: string
  index: number,
  selected?: boolean
  change?: (id: number, checked: boolean) => void
}
export default function ({ id, thumbnail, image, selected = false, index, change = () => { } }: Props) {
  return (
    <div className={`relative ease-in-out duration-300 hover:scale-[1.02] hover:shadow-lg w-[48%] lg:w-44 lg:h-56 rounded-md lg:rounded-xl p-3 lg:p-4 ${selected ? "bg-primary" : "bg-base-100"}`} onClick={() => change(id, !selected)}>
      <img className="w-full h-auto lg:w-36 lg:h-48 object-cover" src={thumbnail} />
      <div className="absolute content-none w-full h-full top-0 left-0 flex flex-col items-end justify-between py-8 lg:px-8 px-2">
        <span className="flex justify-center items-center rounded-lg bg-primary w-10 h-10 text-base-100 font-bold text-lg">
          {index}
        </span>

        <PhotoView src={image ?? thumbnail}>
          <span className="flex items-center justify-center text-primary cursor-pointer w-10 h-10 rounded-full bg-base-100" onClick={e => e.preventDefault()}>
            <PlusCicleIcon size={8} />
          </span>
        </PhotoView>

      </div>
    </div>
  )
}