import { Outlet } from "@remix-run/react";
import { ShareHeader } from "~/components/layout/Header";
import { LoaderLoading, SubmissionLoading } from "~/components/ui/Loading";

export default function () {
  return (
    <main className="bg-base-200/20">
      <section className="h-screen flex flex-col w-full items-center overflow-y-scroll">
        <ShareHeader />
        <div className="flex flex-col gap-9 lg:rounded-md w-full lg:w-[78rem] my-7">
          <Outlet />
        </div>
      </section>
    </main>
  )
}