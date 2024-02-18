import { LoaderArgs, json, redirect } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useLocation, useSearchParams} from "@remix-run/react";
import { useService } from "~/services/services.server";
import { ResultCode } from "~/utils/result";
import { hasRole, isAuthenticated } from "~/utils/sessions.server";
import { Roles } from "~/utils/store";
import {IncomeMonthItems} from '~/components/ui/Incomes'
import { useNavigate } from "@remix-run/react";

export async function loader (args: LoaderArgs) {
  const {
    request,
} = args;
  const user = await isAuthenticated(args)
  if (!user) throw redirect("/auth/signin")
  const { searchParams, pathname } = new URL(request.url)
  const isDesigner = await hasRole(Roles.PRO, args)
  if (!isDesigner) return json({ code: ResultCode.PERMISSION_DENIED, user })
  const page = searchParams?.get('page');
  const status = searchParams?.get('status');
  const sortkey: string =  searchParams?.get('sortkey')!==null ? searchParams?.get('sortkey')?.toString(): ''
  const sort: string =  searchParams?.get('sort')!==null ? searchParams?.get('sort')?.toString(): '';
  let others = {}
  if (sortkey) {
    others = {
      [sortkey]: sort,
    } 
  }
  
  const currentPage = page !=null &&  page != undefined? parseInt(page, 10) : 1;
  const take = 10 as number
  const skip = (currentPage - 1) * take
  const orderPayList = await getPayListByUser(user.id, take, skip, status ?parseInt(status, 10): undefined, others) 
  const totalPage = await getPayListByUserTotalPages(user.id, take, status ?parseInt(status, 10): undefined)
  return json({ orderPayList, totalPage, currentPage, code: ResultCode.OK })
}

async function getPayListByUser(id: number, take: number, skip: number, status?: number, sortitems?: {[key: string]: string}) {
  const service = useService("income");
  const result = await service.getIncomeOrdersListByUser(id, take, skip, status, {...sortitems});
  return result;
}


async function getPayListByUserTotalPages(id: number, take: number, status?:number) {
  const service = useService("income");
  const result = await service.getIncomeOrdersListByUserTotalPages(id, take, status);
  return result;
}

export default function Page () {
  const loadData = useLoaderData<typeof loader>();
  const { pathname } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  return <div><IncomeMonthItems
    data={loadData?.orderPayList}
    currentPage={loadData?.currentPage}
    total={loadData?.totalPage}
    onSortChange={(key: string, sort: string) => {
      const sp = new URLSearchParams(searchParams.toString())
      sp.set('sortkey', key)
      sp.set('sort', sort)
      setSearchParams((pre) => {
        return sp;
      })
    }}
    onItemClick={(item) => {
      navigate(`/dashboard/order/${item.id}/demand`);
    }}
    onPageChange={(pageIndex: number) => {
      const sp = new URLSearchParams(searchParams.toString())
      sp.set("page", pageIndex.toString())
      return `${pathname}?${sp.toString()}`;
    }}/></div>
}