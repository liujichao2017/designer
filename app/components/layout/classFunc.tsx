const active = "flex items-end md:items-center rounded-lg md:base-100 md:bg-base-200 py-4 text-base-content md:p-2 gap-2 duration-200 ease-in-out"
const normal = "flex items-end md:items-center rounded-lg md:base-100 py-4 md:p-2 gap-2 text-base-content md:hover:bg-base-focus opacity-50 duration-200 ease-in-out"
// const pending = "flex items-end md:items-center rounded-lg md:base-100 md:bg-primary-focus py-4 text-base-content md:p-2 gap-2 opacity-80 duration-200 ease-in-out"
export default ({ isActive, isPending }: { isActive: boolean, isPending: boolean }) => {
  return isPending ? active : isActive ? active : normal
}