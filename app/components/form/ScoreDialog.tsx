import React, { useEffect, useState } from 'react'
import { useCallback, forwardRef, useImperativeHandle } from "react"
import relativeTime from 'dayjs/plugin/relativeTime'
import { CashValidator, CashBankValidator } from "~/utils/validators";
import Pagination from "~/components/ui/Pagination"
import { numDiv, numMulti } from "~/utils/helpers";
import dayjs from 'dayjs';
import {
    ColumnDef,
    ColumnFiltersState,
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

dayjs.extend(relativeTime)

type Props = {
    name: string;
    defaultData: any;
    onOk?: (data: any) => void;
    onCancel?: ()=>{}
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
export const columns: ColumnDef<any>[] = [
        {
          accessorKey: "demand_id",
          header: () =>t('demandorder.order.no'),
          cell: ({ row }) => (
            <div className="capitalize">{`QU-${row.getValue("demand_id")}`}</div>
          ),
        },
        {
          accessorKey: "name",
          header: () =>t('demandorder.order.target'),
          cell: ({ row }) => {
           return <div className="lowercase">{row.getValue("name")}</div>
          },
        },
        {
          accessorKey: "satisfaction",
          header: () => t('demandorder.order.satisfaction'),
          cell: ({ row }) => {
            return <div className="lowercase">{row.getValue("satisfaction")}</div>
           },
        },
        {
          accessorKey: "totalScore",
          header: () => t('demandorder.order.score'),
          cell: ({ row }) => {
            return <div className="lowercase">{row.getValue("totalScore")}</div>
          },
        },
        {
          accessorKey: "content",
          header: () => t('demandorder.order.content'),
          cell: ({ row }) => {
            return <div className="lowercase">{row.getValue("content")}</div>
          },
        },
      ];
// export let data: any = [];

// export const setData = (d: any[]) => {
//   data = d;
// }


export default forwardRef<ValueHandler, Props>((props: Props, ref) => {
    const {
        name = 'scoreDialog',
        defaultData,
        onOk,
        onCancel,
    } = props;

    const [data, setData] = useState([])
   
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
      []
    )

    useEffect(() => {
        setData(defaultData)
    }, [defaultData])
    const [columnVisibility, setColumnVisibility] =
      React.useState<VisibilityState>({})
  
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        state: {
          columnFilters,
          columnVisibility,
        },
      })
    return (
    <dialog id={name} autoFocus={false} className="modal">
        <div className="modal-box relative w-[1120px] max-w-[1120px] bg-base-100">
            <h3 className="font-bold text-lg text-center">评分</h3>
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
                            colSpan={columns.length}
                            className="h-24 text-center"
                            >
                            No results.
                            </TableCell>
                        </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {/* <div className="flex justify-center mt-8">
                    <Pagination
                        totalPages={0}
                        showDirection={true}
                        currentPage={1}
                        linkGenerator={(page: number) => {
                            // return onPageChange(page)
                            return ''
                        }}
                    />
                </div> */}
            <div className="modal-action">
                {/* <a className="btn" onClick={() => {
                    (window as any)[name]?.close();
                    onCancel?.()
                }}>{t("ok")}</a> */}
                <button onClick={() => {
                    (window as any)[name]?.close();
                    onCancel?.()
                }} className="btn btn-primary">{t("ok")}</button>
            </div>
        </div>
    </dialog>
    )
})