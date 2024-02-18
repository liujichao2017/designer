"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover"

type Props = {
  categories: { id: number, name: string }[]
  onChange?: (id: number) => void
  selected?: number
}

export default function CategoriesComboBox ({ categories, onChange = () => { }, selected = -1 }: Props) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState(categories.find(val => val.id === selected)?.name ?? "")
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          size="sm"
          className="w-[230px] justify-between capitalize"
        >
          {value || "Select category..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[230px] p-0">
        <Command>
          <CommandInput placeholder="Search category..." />
          <CommandEmpty>No Category found.</CommandEmpty>
          <CommandGroup>
            {categories.map((category) => (
              <CommandItem
                key={category.id}
                onSelect={(currentValue) => {
                  const val = currentValue === value ? "" : currentValue
                  setValue(val)
                  if (val) {
                    onChange(category.id)
                  }
                  setOpen(false)
                  console.log(val, category.name)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value.toUpperCase() === category.name.toUpperCase() ? "opacity-100" : "opacity-0"
                  )}
                />
                {category.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
