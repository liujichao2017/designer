export default function ({ id }: { id: number }) {
  return (
    <div>
      There is a new order that has not been quoted yet （QU-{id}）, please process it as soon as possible
    </div>
  )
}