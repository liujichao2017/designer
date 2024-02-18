import { useState } from "react"
import { PhotoView } from "react-photo-view";
import { GlassPlusIcon, RemoveIcon } from "~/components/ui/Icons"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/PopoverExt";


export default function PictureItem (
  { id, image, remove }: { id: number, image: string, remove: (id: number) => void }) {
  const [popOpen, setPopOpen] = useState(false)
  return (
    <div className="group card rounded-md image-full w-full md:w-32 md:h-44">

      <figure>
        <img src={image} />
      </figure>

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
                remove && remove(id)
              }}>Delete</button>
            </div>
          </PopoverContent>
        </Popover>

        <PhotoView src={image}>
          <span className="text-secondary cursor-pointer">
            <GlassPlusIcon size={6} />
          </span>
        </PhotoView>
      </div>

    </div>
  )
}