type Props = {
  selected: number[]
}
export default function ({ selected }: Props) {
  return (
    <div className="flex items-center">
      <div>

      </div>
      <span>Selected {selected.length}</span>
    </div>
  )
}