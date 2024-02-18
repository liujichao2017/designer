import { json, type LinksFunction, type LoaderArgs } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration, useLoaderData
} from "@remix-run/react";

import stylesheet from "~/globals.css";
import cropper from "cropperjs/dist/cropper.css";
import reactPhotoView from 'react-photo-view/dist/react-photo-view.css';
import reactDatepicker from "react-datepicker/dist/react-datepicker.css";
import reactPdfTextLayer from 'react-pdf/dist/Page/TextLayer.css';
import nprogressStyles from 'nprogress/nprogress.css';
import type { langs } from "./utils/store";
import { useAppearanceState, useAppearanceStore } from "./utils/store";
import i18next from "~/i18next.server";
import { useTranslation } from "react-i18next";
import { useChangeLanguage } from "remix-i18next";
import { useProgress, useThemeListener } from "./utils/hooks";
import { Toaster } from "~/components/ui/toaster";
import { SubmissionLoading } from "./components/ui/Loading";
import { useEffect, useState } from "react";


(BigInt as any).prototype.toJSON = function () {
  const int = Number.parseInt(this.toString())
  return int ?? this.toString()
}

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  { rel: "stylesheet", href: cropper },
  { rel: "stylesheet", href: reactPhotoView },
  { rel: "stylesheet", href: reactDatepicker },
  { rel: "stylesheet", href: nprogressStyles },
  { rel: "stylesheet", href: reactPdfTextLayer },
  // { rel: "stylesheet", href: "https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css" },
]

// export const ErrorBoundary = () => {
//   const error = useRouteError()

//   if (isRouteErrorResponse(error)) {
//     return (
//       <div className="w-full h-full">
//         <NotFoundError />
//       </div>
//     )
//   }

//   console.error(error)
//   return (
//     <div className="w-full h-full flex flex-col gap-3">
//       <UnknownError reason="Something went wrong" />
//     </div>
//   )
// }

export async function loader ({ request }: LoaderArgs) {
  let locale = await i18next.getLocale(request)
  return json({ locale })
}

export let handle = {
  i18n: "common",
}

export default function App () {
  const theme = useAppearanceStore(state => state.theme)
  const changeLang = useAppearanceState(s => s.changeLang)
  const { locale } = useLoaderData<typeof loader>()
  const { i18n } = useTranslation()
  useChangeLanguage(locale as langs)
  // useThemeListener()
  useProgress()
  useEffect(() => {
    changeLang(locale as langs)
  }, [])
  return (
    <html data-theme={theme === "dark" ? "light" : "light"} lang={locale} dir={i18n.dir()}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover" />
        {/* 预解析oss域名dns */}
        <link rel="dns-prefetch" href="https://defineross.s3.amazonaws.com/" />
        <link rel="dns-prefetch" href="https://defineross.s3.ap-southeast-1.amazonaws.com/" />
        <>
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=AW-10844213598`}
          />
          <script
            async
            id="gtag-init"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());

                gtag('config', 'AW-10844213598', {
                  page_path: window.location.pathname,
                });
              `,
            }}
          />
          <script async dangerouslySetInnerHTML={{
            __html: `window.addEventListener('load', function(event){
              if (window.location.href.includes('/confirm')) {
              document.querySelectorAll('[class="btn w-1/2 rounded-full btn-primary"]').forEach(function(e){
              e.addEventListener('click',function(){
              
              var email = document.querySelector('[class="link link-primary"]').innerText;
              var mailformat = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/;
              
              if (email.match(mailformat)) {
              gtag('set', 'user_data', {"email": email})
              gtag('event', 'conversion', {'send_to': 'AW-10844213598/qYSLCIiEm_AYEN6i9rIo'});
              };
              });
              });
              }
              })`
          }}>
          </script>
        </>
        <Meta />
        <Links />
      </head>
      <body suppressHydrationWarning={true}>
        {/* <GlobalLoadingBar /> */}
        <SubmissionLoading />
        {/* <LoaderLoading /> */}
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
        <Toaster />
      </body>
    </html>
  );
}
