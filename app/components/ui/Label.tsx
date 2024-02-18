import { CloseIcon } from "./Icons"

type Props = {
  close?: () => void
  tap?: () => void
  children: React.ReactNode
}
export default function (props: Props) {
  if (props.tap) {
    return (
      <div className="bg-base-400 text-base-100 rounded-lg rounded-lg text-sm leading-7 badge badge-info gap-1 py-3 w-28 max-w-28 overflow-hidden whitespace-nowrap overflow-ellipsis cursor-pointer hidden sm:flex" onClick={props.tap}>
        {props.children ?? ""}
        {
          props.close &&
          <span className="cursor-pointer" onClick={props.close}>
            <CloseIcon size={4} />
          </span>
        }
      </div>
    )
  }
  return (
    <div className="bg-base-400 text-base-100 rounded-lg rounded-lg text-sm leading-7 badge badge-info gap-1 py-3 w-28 max-w-28 overflow-hidden whitespace-nowrap overflow-ellipsis hidden sm:flex">
      {props.children ?? ""}
      {
        props.close &&
        <span className="cursor-pointer" onClick={props.close}>
          <CloseIcon size={4} />
        </span>
      }
    </div>
  )
}