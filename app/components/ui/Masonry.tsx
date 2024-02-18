//@ts-nocheck
import { useEffect, useState } from "react"
import { chunk } from "~/utils/helpers"
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry"


export type MasonryProps = {
  images: { src: string, thumb: string }[],
  cols?: number,
  mobileCols?: number,
  largeCols?: number
}

export const PlainMasonry = ({ images, cols = 4, mobileCols = 2, largeCols = 6 }: MasonryProps) => {
  const [data, setData] = useState<string[][]>([])
  useEffect(() => {
    setData(chunk(images, cols))
  }, [])
  return (
    <div className={`grid grid-cols-${mobileCols} md:grid-cols-${cols} xl:grid-cols-${largeCols} gap-4`}>
      {
        data.map(row => (
          <div className="grid gap-4" key={Math.random()}>
            {
              row.map(image => (
                <div className="hover:shadow-lg hover:scale-110 ease-in-out duration-300" key={Math.random()}>
                  <img className="rounded-lg h-auto max-w-full" src={image} />
                </div>
              ))
            }
          </div>
        ))
      }
    </div>

  )
}

export default ({ images }: MasonryProps) => {
  return (
    <ResponsiveMasonry
      columnsCountBreakPoints={{ 200: 1, 600: 2, 1000: 4, 1600: 6 }}
    >
      <Masonry>
        {
          images.map(image => (
            <div className="hover:scale-[1.03] ease-in-out duration-300" key={Math.random()}>
              <img className="h-auto max-w-full" src={image.thumb} />
            </div>
          ))
        }
      </Masonry>
    </ResponsiveMasonry>
  )
}