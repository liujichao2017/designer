
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { cn } from "~/lib/utils"

type ItemData = {
  id: string
  label?: string
}

type Props = {
  label: string,
  items: string[] | ItemData[]
  change: (item: string) => void
  className?: string
  defaultValue?: string
}

export default function ({ label, items, className = "", change, defaultValue = "" }: Props) {
  return (
    <Select onValueChange={change} defaultValue={defaultValue || undefined}>
      <SelectTrigger className={cn("bg-base-100", className, "")}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent className="bg-base-100 shadow-lg rounded-lg">
        <SelectGroup>
          {/* <SelectLabel>{label}</SelectLabel> */}
          {items.map((it, i) => (
            <SelectItem
              value={typeof it === "object" ? it.id + "" : i + ""}
              key={`${it}${i}${Math.random()}`}
              className="py-1.5">
              {typeof it === "object" ? it.label : it}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
