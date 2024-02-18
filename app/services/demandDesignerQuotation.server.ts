import { UserProps } from "~/utils/store"
import {ResultCode} from "~/utils/result"
import {uploadImages} from "~/utils/upload.server"
import { z } from "zod";
import { DemandDesignerQuotationPayValidator, DemandDesignerQuotationValidator } from "~/utils/validators";
import { prisma } from "./database.server";

export default ({ user }: { user: UserProps }) => ({
  
  uploadMessageImage: async (contents: string[], names: string[],
    sizes: string[], types: string[], uploadScene: string) => {
    const images = await uploadImages(contents)
    // console.log("images", images)
    // console.log("names", names)
    // console.log("sizes", sizes)
    // console.log("types", types)
    if (!images) return {code: ResultCode.AWS_ERROR}
    // await Promise.all(images.map(({url, thumbnailUrl}) =>
    //     prisma.picture.create({
    //         data: {user_id: user.id, litpic_url: thumbnailUrl, img_url: url, status: PictureStatus.PENDING}
    //     })
    // ))
    const imageInfo = {
      fileThumbnailUrl: images[0].thumbnailUrl,
      fileUrl: images[0].url,
      fileSize: sizes[0],
      fileType: types[0],
      fileName: names[0],
      uploadScene: uploadScene
    }
    return {code: ResultCode.OK, data: imageInfo , msg: 'uploadImageSuccess'}
  },

  createDemandDesignerQuotation: async(designerQuotation: z.infer<typeof DemandDesignerQuotationValidator>) => {
    let res = await prisma.demand_designer_quotation.findFirst({
      where: { demand_id: designerQuotation.demand_id },
    })
    if(res){
      const designerQuotatioData =  await prisma.demand_designer_quotation.update(
        { 
          where: { id: res.id }, 
          data: { ...res, ...designerQuotation } }
      )
      return {code: ResultCode.OK, data: designerQuotatioData , msg: 'updateDesignerQuotationSuccess'}
    }
    else{
      const designerQuotatioData =  await prisma.demand_designer_quotation.create({
        data: { ...designerQuotation, payment_flag: '0' }
      })
      return {code: ResultCode.OK, data: designerQuotatioData , msg: 'saveDesignerQuotationSuccess'}
    }
    
  },

  updateDemandDesignerPayment: async(designerQuotationPayment: z.infer<typeof DemandDesignerQuotationPayValidator>) => {
    let res = await prisma.demand_designer_quotation.findFirst({
      where: { demand_id: designerQuotationPayment.demand_id },
    })
    if(res){
      const designerQuotatioData =  await prisma.demand_designer_quotation.update(
        { 
          where: { id: res.id }, 
          data: { ...res, ...designerQuotationPayment, payment_flag:'1' } }
      )
      return {code: ResultCode.OK, data: designerQuotatioData , msg: 'updateDesignerQuotationSuccess'}
    }
    else{
      
      return ""
    }
    
  },

  getDemandDesignerQuotation: async (demandId: number) => {
    return await prisma.demand_designer_quotation.findFirst({
      where: { demand_id: demandId },
    })

    
  }
})