import { ActionArgs, LoaderArgs, json, redirect } from "@remix-run/node";

import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";

import { useService } from "~/services/services.server";
import { ResultCode, fault } from "~/utils/result";
import { isAuthenticated } from "~/utils/sessions.server";
import { UploadValidator } from "~/utils/validators";

import { useTranslation } from "react-i18next";
import { useToast } from "~/components/ui/use-toast";
import { PhotoProvider } from "react-photo-view";

export async function loader (args: LoaderArgs) {
  
  const {
    request,
    params,
  } = args;

  const user = await isAuthenticated(args)
  
  const { searchParams } = new URL(request.url)
  console.log("searchParams", searchParams.get('id'))

  if (!user) throw redirect("/auth/signin")
  let designerId = null
  if(params.id){
    designerId = params.id
  }
  else{
    designerId = user.id
  }
  console.log("params", params.id)
  return json({designerId, })
}

export const action = async (args: ActionArgs) => {
  const user = await isAuthenticated(args)
  if (!user) {
      throw redirect("/auth/signin")
  }
  const form = await args.request.json()
  const { _action } = form
  // console.log("form", form)
  
  
}

export default function Page () {
  const {  designerId, } = useLoaderData()
  const { t } = useTranslation()
  const { toast } = useToast();

  const [currentTab, setCurrentTab] = useState('Work')
  
  return (
    <main className="bg-base-200/20">
      <section className="h-screen flex flex-col w-full items-center overflow-y-scroll overflow-x-hidden">
      <div className="grid grid-cols-2">
        <div>
          123
        </div>
        <div>
          456
        </div>
      </div>

      <div className="flex text-black lg:px-[10rem]">
        <span className={`"rounded px-6 cursor-pointer " ${currentTab == 'Work' ? 'bg-[#EAF0F0] text-black' : 'text-[#62646A]'}`} onClick={
          () =>{
            if(currentTab != 'Work'){
              setCurrentTab('Work')
            }
          }
        }>Work</span>
        <span className={`"rounded px-6 cursor-pointer " ${currentTab == 'About' ? 'bg-[#EAF0F0] text-black' : 'text-[#62646A]'}`} onClick={
          () =>{
            if(currentTab != 'About'){
              setCurrentTab('About')
            }
          }
        }>About</span>
      </div>
      <hr />

      <div className="w-full grid grid-cols-4 gap-4 lg:px-[10rem]">
        <div>
          <img src="" className="w-full bg-black h-[270px]">

          </img>
        </div>

      </div>

      <div className="lg:px-[10rem] px-2 mt-2.5 pb-20 w-full">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 xxl:grid-cols-6 gap-x-4 gap-y-4 pb-4">
            <PhotoProvider>
              {
                pictureList?.map((image) =>
                  <NewSelectableImage
                    key={image.id} thumbnail={image.litpic_url} id={image.id}
                    level={image.level || 0} tags={image.tags} image={image.img_url ?? ""}
                    index={
                      selectedImages.map(val => val.id).includes(image.id) ?
                        selectedImages.map(val => val.id).indexOf(image.id) + 1 :
                        0
                    }
                    selected={selectedImages?.map(val => val.id).includes(image.id)}
                    change={selectImage}
                  />
                )
              }
            </PhotoProvider>
          </div>
        </div>

      <div className="grid grid-cols-2">
        <div>
          
        </div>

        <div>
          <div className="bg-[#FAFAFB]">
            
          </div>
        </div>

      </div>
      
      </section>
    </main>
      
    
  )
}