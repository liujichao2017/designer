import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { useEffect, useRef, useState } from "react"
import { t } from "i18next";
import QuestionIcon from "~/images/question.png"
import UploaderDialog from "~/components/form/UploaderDialog";
import { DemandDesignerQuotationPayValidator, DemandDesignerQuotationValidator, UploadValidator } from "~/utils/validators";
import { fault, ResultCode } from "~/utils/result";
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod";
import { useService } from "~/services/services.server";
import { Link, useParams, useLocation, Outlet , useSearchParams, 
  useOutletContext, useFetcher, useLoaderData, useNavigate} from "@remix-run/react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import { isAuthenticated } from "~/utils/sessions.server";

export async function loader (args: LoaderArgs) {
  const {
    request,
    params,
  } = args;

  const user = await isAuthenticated(args)
  if (!user) throw redirect("/auth/signin")
  
  const {
    id
  } =  params;
  if(!id) return;
  const designerQuotation = await useService('designerQuotation').getDemandDesignerQuotation(parseInt(id));
  console.log("designerQuotation", designerQuotation)
  return json({designerQuotation, demandId:id, })
}

export const action = async (args: ActionArgs) => {
  // const form: z.infer<typeof UploadValidator> & {
  //   _action: string
  // } = await args.request.json()
  // console.log(args.request.json())
  const form = await args.request.json()
  const { _action } = form
  switch (_action) {
    case "upload":
      {
      
        const fileType = form.types[0]
        if(fileType == "image/png" || fileType == "image/jpeg"){
          const result = await UploadValidator.safeParseAsync(form)
          // console.log("UploadValidator", result)
          if (!result.success) {
            return fault(ResultCode.FORM_INVALID)
          }
          return json(await useService("designerQuotation").uploadMessageImage(result.data.contents, form.names,
            form.sizes, form.types, form.uploadScene ))
        }
        
        // return json({})
      }
      case "edit":
        console.log("form", form)
        const formData = {...form, demand_id: parseInt(form.demand_id), currency_num: parseInt(form.currency_num)}
        const editResult = DemandDesignerQuotationValidator.safeParse(formData)
        console.log("editResult", editResult);
        if (!editResult) return fault(ResultCode.FORM_INVALID)
        if (editResult.success) {
          return json(await useService("designerQuotation").createDemandDesignerQuotation(
            editResult.data
          ))
        }
      
      case "pay":
        console.log("form-pay", form)
        const formDataPay = {...form, demand_id: parseInt(form.demand_id),}
        const editResultPay = DemandDesignerQuotationPayValidator.safeParse(formDataPay)
        console.log("editeditResultPayResult", editResultPay);
        if (!editResultPay) return fault(ResultCode.FORM_INVALID)
        if (editResultPay.success) {
          return json(await useService("designerQuotation").updateDemandDesignerPayment(
            editResultPay.data
          ))
        }
    }
}

export default function Page () {
  const {  designerQuotation, demandId,} = useLoaderData()
  const mutation = useFetcher()
  const [isEdit, setIsEdit] = useState<boolean>(true)
  let uploadScene = useRef<string>('1')//1-收款上传，2-付款上传
  // const [paymentTypeUrl, setPaymentTypeUrl] = useState<string>('')
  const [showTip, setShowTip] = useState<boolean>(false)

  const [currencyValue, setCurrencyValue] = useState(designerQuotation ? 
    (designerQuotation.currency_num) : '')
  const [currencyType, setCurrencyType] = useState(designerQuotation ? 
    (designerQuotation.currency_type) : '')
  
    // const [paymentInformation, setPaymentInformation] = useState<string>('')
  // const [designerContent, setDesignerContent] = useState<string>('')
  const [imageFileList, setImageFileList] = useState(designerQuotation ? 
    JSON.parse(designerQuotation.payment_type_url) : [])

  const [paymentFileList, setPaymentFileList] = useState( (designerQuotation && designerQuotation.payment_finish_url) ? 
    JSON.parse(designerQuotation.payment_finish_url) : [])

  const { register, handleSubmit, formState: { errors } } = useForm({
    // resolver: zodResolver(DemandQuotationValidator),
    mode: "onChange"
  })

  const upload = (files: FileContent[]) => {
    console.log("files",files )
    
    
    mutation.submit(
      { _action: "upload", contents: files.map(d => d.src),names: files.map(d => d.name),
        sizes: files.map(d => d.size) , types: files.map(d => d.type), uploadScene: uploadScene.current  },
      { method: "post", encType: "application/json" }
    )
  }

  useEffect(() => {
    if (mutation.state === "idle" && mutation.data && mutation.data?.code === ResultCode.OK && mutation.data.msg == 'uploadImageSuccess') {
      console.log("uploadImageSuccess", mutation.data)
      const imageInfo = mutation.data.data
      console.log("imageInfo", imageInfo)
      let temp = []
      temp.push({ fileType: imageInfo.fileType, fileThumbnailUrl: imageInfo.fileThumbnailUrl, 
        fileName: imageInfo.fileName, fileUrl: imageInfo.fileUrl ,fileSize: imageInfo.fileSize, 
        uploadScene: imageInfo.uploadScene })
      // console.log("imageFileList", imageFileList)
      if(imageInfo.uploadScene == '1'){
        setImageFileList(temp)
      }
      if(imageInfo.uploadScene == '2'){
        setPaymentFileList(temp)
      }
      
    }
    if (mutation.state === "idle" && mutation.data && mutation.data?.code === ResultCode.OK && mutation.data.msg == 'saveDesignerQuotationSuccess') {
      console.log("saveDesignerQuotationSuccess", mutation.data)
      setIsEdit(false);
    }
    if (mutation.state === "idle" && mutation.data && mutation.data?.code === ResultCode.OK && mutation.data.msg == 'updateDesignerQuotationSuccess') {
      console.log("updateDesignerQuotationSuccess", mutation.data)
      setIsEdit(false);
    }

    
  }, [mutation])

  return (<div className="pb-[6.75rem]">
    <div className="bg-white rounded-lg p-5 ">
      {(!designerQuotation || isEdit) ? (
        <form id="quotationform" onSubmit={handleSubmit(data => {
          // console.log("form", data)
          // return
          mutation.submit({ ...data, payment_type_url: JSON.stringify(imageFileList), _action: 'edit' }, { method: 'POST', encType: 'application/json' })
          
        })}>
          <span className="text-sm font-bold">填写报价单</span>
          <input type="hidden" {...register("demand_id")} defaultValue={parseInt(demandId)} />
          {/* <input type="hidden" {...register("payment_type_url")} value={JSON.stringify(imageFileList)} /> */}
          <div className="flex w-full mt-2.5">
            {/* 左边部分 开始 */}
            <div className="flex flex-col w-1/2">
              {/* 收款信息 开始 */}
              <div className="flex flex-col text-sm">
                <span className="mb-2.5 font-bold">收款信息</span>
                <textarea {...register("payment_information")} className="textarea textarea-bordered textarea-xl w-[80%] h-32" 
                   placeholder='请填写收款信息(户名，开户行，账号)'
                   defaultValue={ designerQuotation?.payment_information ?? ''}
                  ></textarea>
              </div>
              {/* 收款信息 结束 */}

              {/* 设计费 开始 */}
              <div className="flex flex-col mt-2.5 text-sm">
                <span className="mb-2.5 font-bold">设计费</span>
                <div className="flex w-[80%] h-8">
                  <select {...register("currency_type")} defaultValue={designerQuotation?.currency_type ?? ''} className="select select-bordered w-[40%] max-w-xs select-sm" onChange={(e) => {
                    // console.log(e.target.value)
                    setCurrencyType(e.target.value)
                  }}>
                    <option className="leading-8">HKD</option>
                    <option className="leading-8">USD</option>
                    <option className="leading-8">RMB</option>
                    <option className="leading-8">MYR</option>
                  </select>
                  <input defaultValue={designerQuotation?.currency_num ?? 0} {...register("currency_num")} type="number" placeholder="" className="input input-bordered w-full max-w-xs h-8 ml-2" onChange={(e)=>{
                    //  console.log(e.target.value)
                     setCurrencyValue(e.target.value)
                  }} />
                </div>
              </div>
              {/* 设计费 结束 */}

              {/* 设计师提供内容 开始 */}
              <div className="flex flex-col mt-2.5 text-sm">
                <span className="mb-2.5 font-bold">设计师提供内容</span>
                <textarea defaultValue={designerQuotation?.designer_service_content ?? ''} {...register("designer_service_content")} className="textarea textarea-bordered textarea-xl w-[80%] h-32" 
                   placeholder='请填写设计师提供内容'
                 ></textarea>
              </div>
              {/* 设计师提供内容 结束 */}
            </div>
            {/* 左边部分 结束 */}

            {/* 右边部分 开始 */}
            <div className="flex flex-col w-1/2">
              {/* 上传收款截图 开始 */}
              <div className="flex flex-col text-sm">
                <span className="mb-2.5 font-bold">收款截图</span>
                { 
                  
                  imageFileList.length > 0 ? 
                (
                  imageFileList.map((item, index) => {
                    return (
                      <div key={index} className="w-24 h-24 flex content-center mt-2.5 relative">
                        <PhotoProvider>
                          <PhotoView src={item.fileUrl}>
                            <img src={item.fileThumbnailUrl} className="box-border border-2 border-[#eeeeee] w-24 h-24 cursor-pointer rounded"></img>
                          </PhotoView>  
                        </PhotoProvider>
                        <div className="-top-2 -right-2 box-border border-2 border-black absolute w-4 h-4 rounded-full text-sm 
                          bg-white text-black cursor-pointer flex items-center justify-center" onClick={() => {
                            setImageFileList([]);
                          }}>
                          <span>x</span>
                        </div>
                    </div>
                    )
                  }
                )) : 
                (
                  <div className="w-24 h-24 flex flex-col cursor-pointer justify-center items-center rounded border-2 border-[#EBEBEB] text-[#98A1B0]" onClick={() => {
                    // document.getElementById("file_payment")?.click()
                    uploadScene.current = '1';
                    (window as any).uploaderDialog?.showModal()
                  }}>
                    <p>+</p>
                    <p>选取文件</p>
                    {/* <input type="file" id='file_payment' accept=".png,.jpg" style={{display: 'none'}} onChange={(e) => 
                      console.log("upload", e.target.files[0])
                      }/> */}
                  </div>
                )}
                
                
                
              </div>
              {/* 上传收款截图 结束 */}

              {/* 支付总费用 开始 */}
              <div className="flex flex-col text-sm mt-5">
                <div className="flex items-end h-8 relative">
                  <span className="w-28">客户需支付总费用</span>
                      {showTip ? (
                        <div className="ml-2 w-64 flex flex-col items-center absolute -left-2">
                        {/* <div className="flex flex-col items-center"> */}
                          <p className="bg-[#020202] w-64 rounded text-white px-4 py-2 opacity-80">含服务费：0，客户支付的所有费用归设计师</p>
                          {/* <div className="w-4 overflow-hidden inline-block">
                            <div className="h-2 w-2qs bg-[#020202] opacity-80 -rotate-45 transform origin-top-left"></div>
                          </div> */}
                          <img src={QuestionIcon} className="w-4 h-4 mt-2.5 cursor-pointer mb-1" onClick={()=>{
                            setShowTip(!showTip)
                          }}></img>
                        {/* </div> */}
                        </div>
                      ) : (
                        <div className="ml-2 flex flex-col items-center">
                        <img src={QuestionIcon} className="w-4 h-4 cursor-pointer mb-1" onClick={()=>{
                                                setShowTip(!showTip)
                       }}></img> 
                       </div>
                      )}
  
                </div>
                
                {
                  currencyValue && currencyType ? (
                    <span className="mt-2.5">{currencyType}: {currencyValue}</span>
                  ): (
                    <span className="mt-2.5">--</span>
                  )
                }
                
              </div>
              {/* 支付总费用 结束 */}

            </div>
            {/* 右边部分 结束 */}
          </div>

          
          
          <div className="rounded mt-5 h-8 text-sm flex items-center">
            <button type="submit" className="rounded mt-5 bg-[#2F4CDD] w-24 h-8 text-sm text-white cursor-pointer">确定</button>
            <span className="rounded mt-5 bg-[#ececec] w-24 h-8 leading-8 text-sm text-center text-black cursor-pointer ml-2" onClick={ ()=>{
              setIsEdit(false)
            }}>取消</span>
          </div>
        </form>
        
      ) : (
        <div className="text-sm">
          <div className="flex justify-between text-sm">
            <span className="font-bold">报价单</span>
            <span className="cursor-pointer" onClick={ () => setIsEdit(true)}>修改</span>
          </div>
          <div className="flex w-full mt-2.5">
            <div className="flex flex-col w-1/2">
                {/* 收款信息 开始 */}
                <div className="flex flex-col text-sm">
                  <span className="mb-2.5 font-bold">收款信息</span>
                  <p className="w-[80%] whitespace-pre">{designerQuotation.payment_information}</p>
                  
                </div>
                {/* 收款信息 结束 */}

                {/* 设计费 开始 */}
                <div className="flex flex-col mt-2.5 text-sm">
                  <span className="mb-2.5 font-bold">设计费</span>
                  <div className="flex w-[80%] h-8">
                    <p>{designerQuotation.currency_type}</p>
                    <p className="ml-2">{designerQuotation.currency_num}</p>
                  </div>
                </div>
                {/* 设计费 结束 */}

                {/* 设计师提供内容 开始 */}
                <div className="flex flex-col mt-2.5 text-sm">
                  <span className="mb-2.5 font-bold">设计师提供内容</span>
                  <p className="w-[80%] whitespace-pre">{designerQuotation.designer_service_content}</p>
                </div>
                {/* 设计师提供内容 结束 */}
              </div>

              <div className="flex flex-col w-1/2">
              {/* 上传收款截图 开始 */}
              <div className="flex flex-col text-sm">
                <span className="mb-2.5 font-bold">收款截图</span>
                { 
                  
                  imageFileList.length > 0 ? 
                (
                  imageFileList.map((item, index) => {
                    return (
                      <div key={index} className="w-24 h-24 flex content-center mt-2.5 relative">
                        <PhotoProvider>
                          <PhotoView src={item.fileUrl}>
                            <img src={item.fileThumbnailUrl} className="box-border border-2 border-[#eeeeee] w-24 h-24 cursor-pointer rounded"></img>
                          </PhotoView>  
                        </PhotoProvider>
                    </div>
                    )
                  }
                )) : 
                (
                  <div className="w-24 h-24 flex flex-col cursor-pointer justify-center items-center rounded border-2 border-[#EBEBEB] text-[#98A1B0]" onClick={() => {
                    // document.getElementById("file_payment")?.click()
                    // (window as any).uploaderDialog?.showModal()
                  }}>
                    <p>+</p>
                    <p>选取文件</p>
                    {/* <input type="file" id='file_payment' accept=".png,.jpg" style={{display: 'none'}} onChange={(e) => 
                      console.log("upload", e.target.files[0])
                      }/> */}
                  </div>
                )}
                
                
                
              </div>
              {/* 上传收款截图 结束 */}

              {/* 支付总费用 开始 */}
              <div className="flex flex-col text-sm mt-5">
                <div className="flex items-end h-8 relative">
                    <span className="w-28">客户需支付总费用</span>
                        {showTip ? (
                          <div className="ml-2 w-64 flex flex-col items-center absolute -left-2">
                          {/* <div className="flex flex-col items-center"> */}
                            <p className="bg-[#020202] w-64 rounded text-white px-4 py-2 opacity-80">含服务费：0，客户支付的所有费用归设计师</p>
                            {/* <div className="w-4 overflow-hidden inline-block">
                              <div className="h-2 w-2qs bg-[#020202] opacity-80 -rotate-45 transform origin-top-left"></div>
                            </div> */}
                            <img src={QuestionIcon} className="w-4 h-4 mt-2.5 cursor-pointer mb-1" onClick={()=>{
                              setShowTip(!showTip)
                            }}></img>
                          {/* </div> */}
                          </div>
                        ) : (
                          <div className="ml-2 flex flex-col items-center">
                          <img src={QuestionIcon} className="w-4 h-4 cursor-pointer mb-1" onClick={()=>{
                                                  setShowTip(!showTip)
                        }}></img> 
                        </div>
                        )}
    
                  </div>
                
                {
                  designerQuotation ? (
                    <span className="mt-2.5">{designerQuotation.currency_type}: {designerQuotation. currency_num}</span>
                  ): (
                    <span className="mt-2.5">--</span>
                  )
                }
              </div>
              {/* 支付总费用 结束 */}

            </div>

          </div>
        </div>
      )
      }

      {
        (designerQuotation && !isEdit) ? (
          <div className="flex w-full mt-5 flex-col text-sm">
            <span className="text-sm font-bold text-black">付款情况</span>
            {
              designerQuotation.payment_flag == '1' ? (
                <div className="w-16 h-7 my-2.5 bg-[#4BC087] bg-opacity-20 text-[#4BC087]
                  flex justify-center font-bold items-center rounded">
                    <span>已付款</span>
                  </div>
              ) :
              (
                <div className="w-16 h-7 my-2.5 bg-[#D66154] bg-opacity-20 text-[#D66154]
                flex justify-center font-bold items-center rounded">
                  <span>未付款</span>
                </div>
              )
            }
            

            <span className="text-sm font-bold text-black">代客户提交付款信息</span>
            <span className="text-sm font-bold text-black mt-2.5">付款截图</span>
            <form id="payform" onSubmit={handleSubmit(data => {
              // console.log("form", data)
              mutation.submit({ ...data, payment_upload_side: 'designer', payment_finish_url: JSON.stringify(paymentFileList), _action: 'pay' }, { method: 'POST', encType: 'application/json' })
              
            })}>
              <input type="hidden" {...register("demand_id")} defaultValue={parseInt(demandId)} />
            { 
                      
                      paymentFileList.length > 0 ? 
                    (
                      paymentFileList.map((item, index) => {
                        return (
                          <div key={index} className="w-32 h-32 mt-2.5 flex content-center mt-2.5 relative">
                            <PhotoProvider>
                              <PhotoView src={item.fileUrl}>
                                <img src={item.fileThumbnailUrl} className="box-border border-2 border-[#eeeeee] w-32 h-32 cursor-pointer rounded"></img>
                              </PhotoView>  
                            </PhotoProvider>
                            <div className="-top-2 -right-2 box-border border-2 border-black absolute w-4 h-4 rounded-full text-sm 
                              bg-white text-black cursor-pointer flex items-center justify-center" onClick={() => {
                                setPaymentFileList([]);
                              }}>
                              <span>x</span>
                            </div>
                        </div>
                        )
                      }
                    )) : 
                    (
                      <div className="w-32 h-32 mt-2.5 flex flex-col cursor-pointer justify-center items-center rounded border-2 border-[#EBEBEB] text-[#98A1B0]" onClick={() => {
                        // document.getElementById("file_payment")?.click()
                        uploadScene.current = '2';
                        (window as any).uploaderDialog?.showModal()
                      }}>
                        <p>+</p>
                        <p>选取文件</p>
                        {/* <input type="file" id='file_payment' accept=".png,.jpg" style={{display: 'none'}} onChange={(e) => 
                          console.log("upload", e.target.files[0])
                          }/> */}
                      </div>
                    )}
            
            
            <button type="submit" className="rounded mt-5 bg-[#2F4CDD] px-4 py-2 w-36 text-sm text-white">提交付款信息</button>
            
            <p className="text-sm mt-2.5">提交即代表同意<span className="cursor-pointer text-[#2F4CDD]">《服务条款》</span>，若有疑问请致电8120 5300</p>
            </form>
                  
          </div>
        ) :''
      }
      
      <UploaderDialog upload={upload} allowedTypes={["image/png", "image/jpeg"]} multiple={false} maxItemCount={1} maxItemSize={1024 * 1024 * 5} />
    </div>
  </div>)
}