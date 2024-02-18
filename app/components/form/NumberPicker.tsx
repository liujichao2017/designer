import { useEffect, useState } from "react";
import { MinusIcon, PlusIcon } from "~/components/ui/Icons";

type Props = {
  initValue?: number,
  step?: number,
  size?: string,
  min?: number,
  max?: number,
  change?: (val: number) => void
}

export default function ({ initValue = 1, step = 1, size = "md", min = 1, max = 65535, change }: Props) {
  const [count, setCount] = useState(initValue)
  const [error, setError] = useState("")
  useEffect(() => {
    change && change(count)
  }, [count])
  return (
    <div className="join w-full">
      <button
        className={`btn btn-${size} btn-base-300 join-item rounded-full`}
        onClick={(e) => {
          e.preventDefault()
          setCount(prev => prev <= min ? min : prev - step)
        }}>
        <MinusIcon />
      </button>

      <input type="text"
        className={`input input-${size} input-bordered join-item text-center flex-1 ${error ? "text-error input-error" : ""}`}
        value={count} onChange={event => {
          const val = parseInt(event.currentTarget.value)
          if (isNaN(val)) {
            setError("NaN")
            setCount(0)
            return
          }
          setError("")
          setCount(val)
        }} />

      <button
        className={`btn btn-${size} btn-base-300 join-item rounded-full`}
        onClick={(e) => {
          e.preventDefault()
          setCount(prev => prev >= max ? max : prev + step)
        }}>
        <PlusIcon />
      </button>
    </div>
  )
}