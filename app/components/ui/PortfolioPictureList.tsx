import { Prisma } from "@prisma/client"
import { GlassPlusIcon, PlusIcon, RemoveIcon } from "./Icons"
import { PhotoProvider, PhotoView } from "react-photo-view"
import { Popover, PopoverContent, PopoverTrigger } from "./PopoverExt";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type PortfolioProps = Prisma.portfolioCreateInput & {
  id: number
}

type Props = {
  pictures: PortfolioProps[]
  remove?: (id: number) => void
  add?: () => void
  editable?: boolean
}

export default function PortfolioPictureList ({ pictures, remove = () => { }, add = () => { }, editable = true }: Props) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      <div className="text-base font-semibold">
        {t("apply.portfolio")}
      </div>
      <div className="flex flex-wrap gap-4">

        <PhotoProvider>
          {
            pictures?.map(val => <PortfolioPictureItem key={val.id} picture={val} remove={remove} editable={editable} />)
          }
        </PhotoProvider>
      </div>

      {
        editable &&
        <div className="flex justify-center">
          <button className="btn btn-sm btn-wide" onClick={add}>
            <PlusIcon size={4} />
            {t("apply.addPortfolio")}
          </button>
        </div>
      }
    </div>
  )
}

export function PortfolioPictureList2 ({ pictures, remove = () => { }, add = () => { }, editable = true }: Props) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap">
        <PhotoProvider>
          {
            pictures?.map(val => <PortfolioPictureItem2 key={val.id} picture={val} remove={remove} editable={editable} />)
          }
          {
            editable &&
            <div className="rounded-md bg-base-100 border-dashed border w-1/3">
                  <span className="flex items-center justify-center flex-col h-full cursor-pointer" onClick={add}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                          <path fillRule="evenodd" d="M10.5 3.75a6 6 0 00-5.98 6.496A5.25 5.25 0 006.75 20.25H18a4.5 4.5 0 002.206-8.423 3.75 3.75 0 00-4.133-4.303A6.001 6.001 0 0010.5 3.75zm2.03 5.47a.75.75 0 00-1.06 0l-3 3a.75.75 0 101.06 1.06l1.72-1.72v4.94a.75.75 0 001.5 0v-4.94l1.72 1.72a.75.75 0 101.06-1.06l-3-3z" clipRule="evenodd" />
                      </svg>
                      <div>上传设计图</div>
                  </span>
              </div>
          }
        </PhotoProvider>
      </div>

      
    </div>
  )
}

export function PortfolioPictureItem2 (
  { picture, remove, editable = true }: { picture: PortfolioProps, remove: Props['remove'], editable?: boolean }) {
  const [popOpen, setPopOpen] = useState(false)
  return (
    <div className="group card rounded-md image-full w-1/3 p-2 md:h-52">

      <figure>
        <img src={picture.thumbnail_url ?? picture.img_url}/>
      </figure>
        <>

          <div className="relative content-none w-full h-full
      bg-base-content opacity-0 rounded-lg group-hover:opacity-80 ease-in-out duration-300">
          </div>

          <div className="relative h-full w-full flex justify-center items-center opacity-0 group-hover:opacity-100 gap-2">

            <Popover open={popOpen} onOpenChange={setPopOpen}>
              {editable && <PopoverTrigger>
                <span className="text-secondary cursor-pointer" onClick={() => setPopOpen(prev => !prev)}>
                  <RemoveIcon size={6} />
                </span>
              </PopoverTrigger>}

              <PopoverContent className="bg-base-100 shadow-md rounded-md p-4 flex flex-col gap-2 text-sm">
                <h3>Are you sure delete the picture?</h3>
                <div className="flex gap-2 justify-end">
                  <button className="btn btn-xs" onClick={() => setPopOpen(false)}>Cancel</button>
                  <button className="btn btn-xs btn-error" onClick={() => {
                    setPopOpen(false)
                    remove && remove(picture.id)
                  }}>Delete</button>
                </div>
              </PopoverContent>
            </Popover>

            <PhotoView src={picture.img_url}>
              <span className="text-secondary cursor-pointer">
                <GlassPlusIcon size={6} />
              </span>
            </PhotoView>
          </div>
        </>
    </div>
  )
}

export function PortfolioPictureItem (
  { picture, remove, editable = true }: { picture: PortfolioProps, remove: Props['remove'], editable?: boolean }) {
  const [popOpen, setPopOpen] = useState(false)
  return (
    <div className="group card rounded-md image-full w-40">

      <figure>
        <img src={picture.thumbnail_url ?? picture.img_url} />
      </figure>
      {
        editable &&
        <>

          <div className="relative content-none w-full h-full
      bg-base-content opacity-0 rounded-lg group-hover:opacity-80 ease-in-out duration-300">
          </div>

          <div className="relative h-full w-full flex justify-center items-center opacity-0 group-hover:opacity-100 gap-2">

            <Popover open={popOpen} onOpenChange={setPopOpen}>
              <PopoverTrigger>
                <span className="text-secondary cursor-pointer" onClick={() => setPopOpen(prev => !prev)}>
                  <RemoveIcon size={6} />
                </span>
              </PopoverTrigger>

              <PopoverContent className="bg-base-100 shadow-md rounded-md p-4 flex flex-col gap-2 text-sm">
                <h3>Are you sure delete the picture?</h3>
                <div className="flex gap-2 justify-end">
                  <button className="btn btn-xs" onClick={() => setPopOpen(false)}>Cancel</button>
                  <button className="btn btn-xs btn-error" onClick={() => {
                    setPopOpen(false)
                    remove && remove(picture.id)
                  }}>Delete</button>
                </div>
              </PopoverContent>
            </Popover>

            <PhotoView src={picture.img_url}>
              <span className="text-secondary cursor-pointer">
                <GlassPlusIcon size={6} />
              </span>
            </PhotoView>
          </div>
        </>
      }
    </div>
  )
}