import { redirect, type LoaderArgs, type V2_MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { isAuthenticated } from "~/utils/sessions.server";

export const meta: V2_MetaFunction = () => {
  return [
    { title: "Definer tech" },
    { name: "description", content: "Welcome to Definer tech" },
  ];
};

export const loader = async (args: LoaderArgs) => {
  const user = await isAuthenticated(args)
  if (user) {
    return redirect('/dashboard/project')
  }
  return redirect("auth/signin")
}


export default function Index () {
  useLoaderData()
  return (
    <div>
    </div>
  );
}
