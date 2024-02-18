import { Outlet } from "@remix-run/react";

export default function () {
  return (
    <section className="flex flex-col">
      <div className="flex">Header</div>
      <div>
        <Outlet />
      </div>
      <div className="flex">Footer</div>
    </section>
  )
}