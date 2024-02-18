import React from 'react'
import { useCallback, forwardRef, useImperativeHandle } from "react"
import relativeTime from 'dayjs/plugin/relativeTime'
import { CashValidator, CashBankValidator } from "~/utils/validators";
import Pagination from "~/components/ui/Pagination"
import { numDiv, numMulti } from "~/utils/helpers";
import dayjs from 'dayjs';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getFilteredRowModel,
  VisibilityState,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { t } from "i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from 'react-hook-form';

dayjs.extend(relativeTime)

type Props = {
  name: string;
  defaultData: any;
  onOk?: (data: any) => void;
  onCancel?: () => {}
}
export type ValueHandler = {
  reset: (data: any) => void
}

export type Payment = {
  demand_id: string;
  date: number
  status: string
  totalScore: string
  amount: number
}
export const columns = (cb: (val: number, checked: boolean, demand_id: number) => void, callcb: (checked: boolean) => void) => {
  const col: ColumnDef<Payment>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value)
            callcb(!!value)
          }}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => {
            row.toggleSelected(!!value)
            cb(row.getValue("amount"), !!value, row.getValue("demand_id"))
          }}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "demand_id",
      header: "订单号",
      cell: ({ row }) => (
        <div className="capitalize">{`QU-${row.getValue("demand_id")}`}</div>
      ),
    },
    {
      accessorKey: "status",
      header: "状态",
      cell: ({ row }) => {
        return <div className="lowercase">{row.getValue("status")}</div>
      },
    },
    {
      accessorKey: "date",
      header: () => "项目交付日期",
      cell: ({ row }) => {
        return <div className="lowercase">{row.getValue("date") ? dayjs(row.getValue("date")).format('YYYY-MM-DD') : '--'}</div>
      },
    },
    {
      accessorKey: "totalScore",
      header: () => "评分",
      cell: ({ row }) => {
        return <div className="lowercase">{row.getValue("totalScore")}</div>
      },
    },
    {
      accessorKey: "amount",
      header: () => "金额",
      cell: ({ row }) => {
        return <div className="lowercase">{row.getValue("amount")}</div>
      },
    },
  ]
  return col;
}

export let data: any = [];

export const setData = (d: any[]) => {
  data = d;
}
export default forwardRef<ValueHandler, Props>((props: Props, ref) => {
  const {
    name = 'cashDialog',
    defaultData,
    onOk,
    onCancel,
  } = props;
  // const {
  //   data = []
  // } = defaultData;
  // useImperativeHandle(ref, () => ({
  //     reset (data: any) {
  //         setValues(data)
  //     }
  // }))
  // const setValues = (item: any) => {
  //     setValue("id", item.id)
  // }
  const { register, handleSubmit, formState: { errors }, setValue, clearErrors } = useForm({ resolver: zodResolver(defaultData.account ? CashValidator : CashBankValidator), mode: "onChange" })

  const onSourceSubmit = useCallback(handleSubmit(data => {
    onOk?.({
      ...data,
    });
    (window as any)[name]?.close();
  }), [])

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [totalAmount, setAmount] = React.useState(0);
  const [selectedDemandIds, setSelectedDemandIds] = React.useState([] as number[]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  console.log('errors', errors)
  const setTotalAmount = (amount: number, checked: boolean, demand_id: number) => {
    let indexToRemove = selectedDemandIds.findIndex(val => val == demand_id)
    setAmount((pre: number) => {
      if (checked) {
        setValue("price", (pre + parseFloat(amount)).toString())
        return pre + parseFloat(amount);
      } else {
        setValue("price", (pre - parseFloat(amount)).toString())
        return pre - parseFloat(amount);
      }
    })

    setSelectedDemandIds((pre: number[]) => {
      if (!checked && indexToRemove > -1) {
        pre.splice(indexToRemove, 1);
      }
      if (checked) {
        pre.push(demand_id)
      }
      setValue("demand_ids", pre.join(","))
      return pre;
    })
  }
  const setALLTotalAmount = (checked: boolean) => {
    if (checked) {
      const total = data.reduce((acc: number, cur: Payment) => {
        return acc + parseFloat(cur.amount)
      }, 0)
      setAmount(total)
      setValue("price", total.toString())
    } else {
      setAmount(0)
      setValue("price", "0")
    }

    setSelectedDemandIds((pre: number[]) => {
      if (checked) {
        const v = data.map((item: any) => item.demand_id)
        setValue("demand_ids", v.join(","))
        return v;
      } else {
        setValue("demand_ids", '')
        return []
      }
    })
  }
  const table = useReactTable({
    data,
    columns: columns(setTotalAmount, setALLTotalAmount),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })
  return (
    <dialog id={name} autoFocus={false} className="modal">
      <form method="dialog" className="modal-box relative w-[1120px] max-w-[1120px]" onSubmit={onSourceSubmit}>
        <h3 className="font-bold text-lg text-center">提现</h3>
        <div className="h-[20px]"></div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns(setTotalAmount, setALLTotalAmount).length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-center mt-8">
          <Pagination
            totalPages={0}
            showDirection={true}
            currentPage={1}
            linkGenerator={(page: number) => {
              // return onPageChange(page)
              return ''
            }}
          />
        </div>
        <div className="py-4 form-control w-full flex flex-row">
          <label className="label">合计金额：</label>
          <label id="balance" className="label">{totalAmount}</label>
          <input type="text" {...register("price")} id="price" style={{ display: 'none' }} />
          <input type="text" {...register("demand_ids")} id="demand_ids" style={{ display: 'none' }} />
        </div>
        <div className='flex'>
          {defaultData.account && <div className="py-4 form-control w-full flex flex-row">
            <label className="label whitespace-nowrap">提现银行卡：</label>
            <label className="label">{`${defaultData.bank} ${defaultData.account.replace(/(?<=\d{4})\d+(?=\d{4})/, " **** **** ")}`}</label>
          </div>}
          {
            !defaultData.account && <div className="py-4 form-control w-full flex flex-row">
              <label className="label whitespace-nowrap">银行账户：</label>
              <input type="text" {...register("account")} id="account" className={`w-4/5 input input-sm ${errors.account && "input-error"}`} />
            </div>
          }
          {
            !defaultData.account && <div className="py-4 form-control w-full flex flex-row">
              <label className="label whitespace-nowrap">银行：</label>
              <input type="text" {...register("bank")} id="bank" className={`w-4/5 input input-sm ${errors.bank && "input-error"}`} />
            </div>
          }
          <div className="py-4 form-control w-full flex flex-row">
            <label className="label whitespace-nowrap">到账时间：</label>
            <label className="label">预计次月1日之前到账</label>
          </div>
        </div>
        <div className="modal-action">
          <a className="btn" onClick={() => {
            (window as any)[name]?.close();
            onCancel?.()
          }}>{t("cancel")}</a>
          <button type="submit" className="btn btn-primary">{t("ok")}</button>
        </div>
      </form>
    </dialog>
  )
})