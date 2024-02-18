import { ActionArgs, json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import Uploader from "~/components/form/PlainUploader";
import { MediumLogo } from "~/components/ui/Logo";
import { prisma } from "~/services/database.server";
import { range } from "~/utils/helpers";


export async function loader () {
  const categories = await prisma.tag.findMany({ where: { prefix: "category" }, select: { name: true, id: true } })
  return json({ categories: categories.map(val => val.name).slice(0, 11) })
}

export default function Page () {
  useEffect(() => {
    const body = JSON.stringify({
      parameters: { candidate_labels: ["panda", "tiger"] },
      inputs: d
    })
    fetch("https://api-inference.huggingface.co/models/openai/clip-vit-large-patch14", {
      method: "POST",
      body,
      headers: {
        "Authorization": "Bearer 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"
      }
    })
  }, [])
  return (
    <div className="flex flex-col justify-center items-center mt-4">
      <div className="w-96 flex flex-col gap-4 items-center">
        <MediumLogo />
        <p>
          Definer tech AI image recognition
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {range(3).map(v => <AI key={Math.random()} id={v} />)}
      </div>
    </div>
  )
}

function AI ({ id }: { id: number }) {
  // const { categories } = useLoaderData<typeof loader>()
  const [scores, setScores] = useState<{ score: number, label: string }[]>([])
  const [remote, setRemote] = useState<{ state?: string, errors?: string[] }>({})
  const [keywords, setKeywords] = useState<string[]>([])
  useEffect(() => {
    const d = localStorage.getItem(`cnn::keywords::${id}`)
    if (d) {
      setKeywords(JSON.parse(d))
    }
  }, [])

  useEffect(() => {
    if (keywords.length) {
      localStorage.setItem(`cnn::keywords::${id}`, JSON.stringify(keywords ?? []))
    }
  }, [keywords])
  return (
    <div className="flex flex-col items-center mt-4">
      <div className="w-96 flex flex-col gap-4 items-center">

        <Uploader onFile={data => {
          setScores([]);
          if (!keywords) return;
          (async function () {
            const [_, image] = data.split("base64,")
            setRemote(prev => ({ errors: [], state: "loading..." }))
            const body = JSON.stringify({
              parameters: { candidate_labels: keywords.slice(0, 10) },
              inputs: image
            })
            const result = await fetch("https://api-inference.huggingface.co/models/openai/clip-vit-large-patch14-336", {
              method: "POST",
              body,
              headers: {
                "Authorization": "Bearer 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"
              }
            })
            const r = await result.json()
            if (r.length) {
              setScores(r)
              setRemote(prev => ({ ...prev, state: "" }))
            } else {
              // r.error && setRemote(prev => ({ state: "", errors: r.error }))
            }
          })()
        }} />

        <input type="text" className="input input-bordered input-sm w-full" placeholder="Keywords, separated by commas" value={keywords.join(",")} onChange={event => {
          const val = event.currentTarget.value.split(",")
          if (val.length)
            setKeywords(val)
        }} />

        <div className="text-sm text-base-content/70">
          {
            remote.state && <b>{remote.state}</b>
          }
          {
            remote.errors && remote.errors.map(err => <b key={Math.random()} className="text-error">{err}</b>)
          }
        </div>

        <div className="flex flex-col gap-1 items-center">
          {
            scores.map((val: { score: number, label: string }) => (
              <div id={val.label} className="flex flex-col" key={val.score}>
                <b>{val.label}:</b>
                <progress className="progress progress-primary w-96" value={val.score * 100} max="100"></progress>
                <i>
                  {(val.score * 100).toFixed(2)}%
                </i>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}