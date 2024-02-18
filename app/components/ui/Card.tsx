import { Link } from "@remix-run/react"
import dayjs from "dayjs"
import relativeTime from 'dayjs/plugin/relativeTime'
import { cn } from "~/lib/utils"

type CardProps = {
  id: number | string
  name: string
  cover: string
  author?: string
  createdAt: string
  next?: string
}

type CardActions = {
  edit?: () => void
  shared?: () => void
  delete?: () => void
}

dayjs.extend(relativeTime)

export function PainCard ({ id, name, cover, author, createdAt, next, ...actions }: CardProps & CardActions) {
  return (
    <div className="flex flex-col gap-2 mb-4 w-full md:w-72">
      <div className={cn("bg-center rounded-lg relative flex flex-col group h-48", !cover ? "bg-base-content/10" : "")}
        style={{ backgroundImage: `url(${cover})` }}>
        <Link to={next ?? ""} className="flex justify-center items-center w-full h-full backdrop-blur-sm bg-white/10">
          {
            cover?.startsWith("http") ?
              <img src={cover} alt={name} className="w-auto h-40 aspect-auto" /> :
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 self-center">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
          }
        </Link>
        <div className="flex justify-end gap-2 absolute bottom-2 right-2 z-20 ">
          {
            actions.shared &&
            <button className="w-6 h-6 rounded-full bg-base-100 flex justify-center items-center opacity-0 group-hover:opacity-100 ease-in-out duration-200 shadow-md" onClick={e => {
              e.preventDefault()
              e.stopPropagation();
              actions.shared && actions.shared()
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
            </button>
          }
          {
            actions.edit &&
            <button className="w-6 h-6 rounded-full bg-base-100 flex justify-center items-center opacity-0 group-hover:opacity-100 ease-in-out duration-200 shadow-md" onClick={e => {
              e.preventDefault()
              e.stopPropagation();
              actions.edit && actions.edit()
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </button>
          }
          {
            actions.delete &&
            <button className="w-6 h-6 rounded-full bg-base-100 flex justify-center items-center opacity-0 group-hover:opacity-100 ease-in-out duration-200 shadow-md" onClick={e => {
              e.preventDefault()
              e.stopPropagation();
              actions.delete && actions.delete()
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          }
        </div>
      </div>

      <div className="flex flex-col">
        <h3>{name}</h3>
        <div className="flex justify-between text-xs text-base-content/60">
          <Link to={`/portfolio/main/project`} className="text-xs">{author}</Link>
          <span className="text-xs">{dayjs(createdAt).format("MMM/DD")}</span>
        </div>
      </div>
    </div>
  )
}

export const ProjectCard = ({ id, name, cover, author, createdAt, next, ...actions }: CardProps & CardActions) => {
  return (
    <div className="card w-full md:w-48 bg-base-200 shadow-md hover:shadow-lg ease-in-out duration-200">
      <figure>
        {
          next && next.startsWith("http") &&
          <a href={next} target="_blank" rel="noreferrer" className="w-full">
            <div className={`flex justify-center items-center rounded-none object-cover md:h-52 ${!cover?.startsWith("http") && "bg-base-100"}`}>
              {
                cover?.startsWith("http") ?
                  <img src={cover} /> :
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 self-center">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
              }
            </div>
          </a> ||
          <Link to={next as string} className="w-full">
            <div className={`flex justify-center items-center rounded-none md:h-52 ${!cover?.startsWith("http") && "bg-base-100"}`}>
              <div className="flex justify-center items-center w-[90%] h-[90%] object-cover">
                {
                  cover?.startsWith("http") ?
                    <img src={cover} className="max-h-[90%] max-w-[90%]" /> :
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 self-center">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                }
              </div>
            </div>
          </Link>
        }
      </figure>

      <div className="flex flex-col gap-1 py-1 px-4">
        <h2 className="card-title w-full text-base whitespace-nowrap overflow-hidden text-ellipsis">{name}</h2>
        <p className="flex gap-3 justify-between items-end">
          <Link to="/portfolio" className="text-xs">{author}</Link>
          <span className="text-xs">{dayjs(createdAt).format("MMM/DD")}</span>
        </p>

        <div className="card-actions justify-end gap-[0.1rem]">

          {
            actions.shared &&
            <button className="btn btn-ghost btn-xs" onClick={_ => actions.shared && actions.shared()}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
            </button>
          }
          {
            actions.edit &&
            <button className="btn btn-ghost btn-xs" onClick={_ => actions.edit && actions.edit()}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </button>
          }
          {
            actions.delete &&
            <button className="btn btn-ghost btn-xs" onClick={_ => actions.delete && actions.delete()}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          }
        </div>
      </div>
    </div>
  )
}