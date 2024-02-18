//@ts-nocheck
import { LoaderArgs, json } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useService } from "~/services/services.server";
import { decrypto } from "~/utils/crypto.server";
import { ResultCode, fault } from "~/utils/result";
import { ProjectCard } from "~/components/ui/Card";
import { OperatorHeader } from "~/components/layout/Header";
import UploaderDialog from "~/components/form/UploaderDialog";
import { FileContent } from "aws-sdk/clients/codecommit";
import { z } from "zod";
import { UploadValidator } from "~/utils/validators";
import { ArrowLeftIcon } from "~/components/ui/Icons";

export async function loader ({ request, params }: LoaderArgs) {
  const { cipher } = params
  const { id, expire } = await decrypto(cipher as string) as { id: number, expire: number }
  // if (expire < Date.now()) {
  //   return fault(ResultCode.EXPIRED)
  // }
  console.log("id,expire", id, expire)
  const books = await useService("project").getProject(id)
  return json({ code: ResultCode.OK, books, v1Url: process.env.V1_END_POINT ,id})
}


export const action = async (args: ActionArgs) => {
  const { id, expire } = await decrypto(args.params.cipher as string) as { id: number, expire: number }
  if (expire < Date.now()) {
    return fault(ResultCode.EXPIRED)
  }
  const form: z.infer<typeof UploadValidator> & { _action: string } = await args.request.json()
  const service = useService("project")
  switch (form._action) {
    case "upload":
      const result = await UploadValidator.safeParseAsync(form)
      if (!result.success) {
        return fault(ResultCode.FORM_INVALID)
      }
      await service.uploadBook(id, 0, result.data.contents)
      return json({ code: ResultCode.OK })
  }
}
export default function () {
  const { code, books, id } = useLoaderData<typeof loader>()
  const natigate = useNavigate()
  const mutation = useFetcher()
  const { t } = useTranslation()

  const upload = useCallback((files: FileContent[]) => {
    mutation.submit(
      { _action: "upload", contents: files.map(d => d.src) },
      { method: "post", encType: "application/json" }
    )
  }, [])
  if (code === ResultCode.EXPIRED) {
    return (
      <div className="flex flex-col justify-center items-center mt-52">
        <b className="text-3xl">
          Share Expired
        </b>

        <button className="btn btn-error" onClick={() => natigate(-1)}>{t("demand.back")}</button>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-6 bg-base-200/50 rounded-2xl p-10">
      <OperatorHeader title={
        <div className="flex items-center">
          <button className="btn btn-sm btn-ghost" onClick={() => natigate(-1)}>
            <ArrowLeftIcon />
          </button>
          <h3>{books.at(0)?.project.project_name ?? ""}</h3>
        </div>
      }>
        <div>
          <button className="btn btn-primary btn-sm" onClick={_ => {
            (window as any)?.uploaderDialog?.showModal()
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Upload file
          </button>
        </div>
      </OperatorHeader>

      <div className="flex flex-wrap gap-4">
        {
          books.map(book => {
            return (
              <ProjectCard key={book.id} {...book}
                cover={book.pages[0]?.litpic_url as string}
                name={book.project_name as string}
                createdAt={book.created_at as string}
                // next={v1Url + "/project/detail?id=" + book.id}
                next={`/project/${id}/detail/${book.id}`}
              />
            )
          })
        }

        <UploaderDialog upload={upload} allowedTypes={["image/png", "image/jpeg", "application/pdf"]} />

      </div>
    </div>
  )
}