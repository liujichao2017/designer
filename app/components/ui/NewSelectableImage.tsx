import { PhotoView } from "react-photo-view"
import { GlassPlusIcon, PlusCicleIcon } from "./Icons"
import { t } from "i18next";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

type Props = {
  id: number,
  thumbnail: string,
  image?: string
  level?: number,
  index: number,
  tags?: { name: string }[],
  selected?: boolean
  change?: (id: number, checked: boolean) => void
}
export default function ({
  id, thumbnail, image, selected = false, index, level, tags, change = () => {
  }
}: Props) {

  let tag = tags?.map(val => val.name) ?? []
  if (level) tag.push(t("level") + level)
  // if (tags) {
  //   tags.map((value) => {
  //     tag.push(value.name)
  //   })
  // }
  // if (level && level > 0) {
  //   tag.push(t(`level`) + level)
  // }

  return (
    <div className={"relative border-2 group border-[#E5E6EB] rounded-lg overflow-hidden"}>
      <div className="flex flex-col border-2 border-[#E5E6EB] overflow-hidden"
        onClick={() => change(id, !selected)}>
        <img className="w-full h-36 object-cover" src={thumbnail} />
      </div>
      {/*<div className="tooltip"  data-tip="hello">asd</div>*/}

      <p className="leading-6 text-center text-[#86868B] cursor-pointer px-2.5 overflow-hidden text-xs hidden">
        <Tooltip>
          <TooltipTrigger>
            <span
              className="overflow-hidden whitespace-nowrap text-overflow-ellipsis">
              {tag && tag.length > 0 ? tag.join('、') : t("unsorted")}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <span className="bg-base-content/70 text-base-100 rounded-md shadow-md px-3 py-1.5">
              {tag && tag.length > 0 ? tag.join('、') : t("unsorted")}
            </span>
          </TooltipContent>
        </Tooltip>
      </p>

      {
        !!index &&
        <div
          className="absolute left-0 top-0 bg-[#3251D5] text-white rounded-br-lg w-10 h-10 text-center leading-10 text-lg z-10">{index}</div>
      }

      <div
        onClick={() => change(id, !selected)}
        className="absolute left-0 right-0 top-0 bottom-0 bg-black opacity-0 group-hover:opacity-10 cursor-pointer"></div>


      <div className="flex absolute justify-end z-20 right-2 top-2">
        <div className="flex flex-col gap-3 items-center">

          <div className={`rounded-full w-8 h-8 bg-base-100 flex justify-center items-center opacity-0 ease-in-out duration-200 shadow-md group-hover:opacity-100`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" stroke={selected ? "#3251D5" : "#dedede"} strokeWidth="3" />
            </svg>
          </div>

          <PhotoView src={image ?? thumbnail}>
            <button className="rounded-full w-8 h-8 bg-base-100 flex justify-center items-center opacity-0 ease-in-out duration-200 shadow-md group-hover:opacity-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" stroke="#3251D5" strokeWidth="2" />
              </svg>
            </button>
          </PhotoView>

        </div>
      </div>
    </div>
  )
}