import dayjs from 'dayjs';
import { useId, useState } from 'react';
import { UserProps, useAppearanceStore } from '~/utils/store';
import Avatar from './Avatar';
import { Link } from '@remix-run/react';
import { PhotoView } from 'react-photo-view';
import { useTranslation } from 'react-i18next';

const sizeMap = {
  "sm": "md:w-28 min-h-[12rem]",
  "md": "md:w-48 min-h-[15rem]"
} as const

type Props = {
  id: number,
  name: string,
  owner?: UserProps
  src: string,
  thumbnail: string,
  level?: number,
  tags?: { id: number, name: string, zh: string, cht: string, prefix: string }[]
  createdAt: string,
  size?: keyof typeof sizeMap,
  selectable?: boolean
  selected?: boolean
  select?: (id: number, checked: boolean) => void,
  remove?: (id: number) => void
  removeTag?: (id: number, tagId: number) => void
}


export default function PictureItem (
  { id, name, src, thumbnail, createdAt, select, remove, removeTag, owner, size = "md", selectable = true, selected = false, level = 0, tags = [] }: Props
) {
  const lang = useAppearanceStore(s => s.lang)
  const { t } = useTranslation()
  const boxId = useId()
  return (
    <div className={`card w-full md:w-44 h-[13rem] bg-base-100 shadow-lg rounded-lg outline-primary image-full group ${selected && "outline outline-8"}`}>
      <div className="relative content-none w-full h-full
      bg-base-content opacity-0 rounded-lg group-hover:opacity-80 ease-in-out duration-300">
      </div>
      <figure>
        <img src={thumbnail} alt={name} />
      </figure>

      {
        (tags.length || level) &&
        <div className="relative flex flex-col h-full justify-end">
          <div className="bg-base-content/50 rounded-b-lg">
            <div className="px-2 py-1 text-xs font-semibold flex justify-end gap-1 flex-wrap w-full">
              {
                tags.map(tag => (
                  <span key={tag.id} className="text-base-100 bg-secondary/80 rounded-md px-1 py-0.5 flex gap-1 items-center">
                    {lang === "cht" ? tag.cht ?? tag.name : lang === "zh" ? tag.zh ?? tag.name : tag.name}
                    {
                      removeTag &&
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 cursor-point z-50" onClick={_ => removeTag(id, tag.id)}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>

                    }
                  </span>
                ))
              }
              {
                level &&
                <span className="text-base-100 bg-primary/80 rounded-md px-1 py-0.5">{t("level")}{level}</span> || <></>
              }
            </div>
          </div>
        </div> || <></>
      }

      <label htmlFor={boxId} className="relative h-full hidden group-hover:flex flex-col justify-evenly items-center cursor-pointer">
        <div className="card-title text-center flex-col">
          {
            owner?.id &&
            <Link to={`/portfolio/${owner.id}`}>
              <Avatar user={owner} size="sm" />
            </Link>
          }
          <span className="text-xs font-light text-secondary-focus">{dayjs(createdAt).format("YY-MM-DD")}</span>
        </div>

        <div className="flex flex-col gap-1 items-center">
          {
            select &&
            <input id={boxId} type="checkbox" checked={selected} className="checkbox w-8 h-8 checkbox-secondary" onChange={e => {
              select(id, e.target.checked)
            }} disabled={!selectable} />
          }
        </div>
        <div className="card-actions justify-center gap-3 items-center">
          <PhotoView src={src}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 cursor-pointer text-secondary" onClick={event => {
              event.stopPropagation()
              event.preventDefault()
            }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
            </svg>
          </PhotoView>

          {remove &&
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 cursor-pointer text-secondary" onClick={(event) => {
              event.stopPropagation()
              event.preventDefault()
              remove(id)
            }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          }
        </div>
      </label>
    </div>
  )
}