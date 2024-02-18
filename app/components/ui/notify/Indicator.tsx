import { ReactNode } from "react"
import { PopoverTrigger, Popover, PopoverContent } from "../Popover"

export default function Indicator ({ children, unreadCount = 0 }: {
  children: ReactNode,
  unreadCount?: number
}) {
  return (
    <Popover>
      <PopoverTrigger>
        <div className="flex">
          <button className="flex w-11 h-11 hover:shadow-lg hover:bg-base-200 justify-center items-center rounded-full cursor-pointer duration-150 ease-in-out">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </button>
          {
            unreadCount > 0 &&
            <span className="relative right-[1.2rem] top-[0.6rem] w-2 h-2 bg-error rounded-full"></span>
            ||
            <span className="relative right-[1.2rem] top-[0.6rem] w-2 h-2 bg-error rounded-full opacity-0"></span>
          }
        </div>
      </PopoverTrigger>
      <PopoverContent>
        <div className="w-screen md:w-[22rem] max-h-[38rem] overflow-y-scroll overflow-x-hidden">
          {children}
        </div>
      </PopoverContent>
    </Popover>
  )
}