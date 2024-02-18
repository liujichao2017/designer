import { Outlet , useLocation} from "@remix-run/react";
import { DashboardHeader } from "~/components/layout/Header";
import { SubmissionLoading } from "~/components/ui/Loading";

export default function Page () {
  const { pathname } = useLocation()
  // console.log('pathname', pathname)
  let bgclass = 'bg-base-100';
  
  if (pathname === '/portfolio/main/project' || pathname === '/portfolio/main/work') {
    bgclass= ''
  }
  if (/.*portfolio\/main*/.test(pathname)) {
    bgclass= ''
  }
  return (
    <main className="flex flex-col md:gap-4 bg-base-200">
      <SubmissionLoading />
      <DashboardHeader needLogo={true} className="px-6 py-3 bg-base-100/70 shadow-sm" />
      <section className="min-h-screen flex flex-col w-full items-center">
        <div className={`flex flex-col gap-20 md:rounded-md w-full md:w-9/12 p-4 ${bgclass}`}>
          <Outlet />
        </div>
      </section>
    </main>
  )
}