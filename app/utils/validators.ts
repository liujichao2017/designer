import { z } from "zod"
import dayjs from 'dayjs';

export const LocalSigninValidator = z.object({
  email: z.string().email(),
  provider: z.union([z.literal("local"), z.literal("google")]).optional(),
  password: z.string().min(6)
})


export const SignupValidator =
  LocalSigninValidator.extend({
    name: z.string().min(2).max(24),
    agreement: z.union([z.literal(true), z.literal("true")])
  })


export const RenameValidator = z.object({
  id: z.union([z.string().transform(id => parseInt(id)), z.number()]),
  name: z.string().min(1).max(36)
})

export const RenameExtValidator = RenameValidator.extend({
  zh: z.string().min(1).max(36),
  cht: z.string().min(1).max(36)
})

export const EmailValidator = z.object({
  email: z.string().email()
})

export const IdValidator = z.object({
  id: z.coerce.number()
    .refine(n => n >= 0)
})

export const ContentValidator = IdValidator.extend({
  content: z.string().max(65535)
})

export const RejectValidator = IdValidator.extend({
  reason: z.string().max(128).optional()
})

export const QuotationValidator = IdValidator.extend({
  quotation: z.coerce.number().optional(),
})

export const PaidSnapValidator = IdValidator.extend({
  snap: z.string().refine(val => val.startsWith("data:image")),
  amount: z.coerce.number(),
  type: z.coerce.number().refine(val => [0, 1, 2, 3, 4].includes(val))
})

export const changeDesignerValidator = z.object({
  id: z.coerce.number().refine(n => n >= 0),
  designerUserId: z.coerce.number().refine(n => n >= 0)
})

export const IdsValidator = z.object({
  ids: z.union([
    z.string().transform(val => val.split(",").filter(val => /\d+/.test(val)).map(Number)),
    z.array(z.coerce.number().refine(val => val > 0))
  ]).optional()
})

export const IdsWithCategoryValidator = IdsValidator.extend({
  category: z.coerce.number().optional()
})

export const BindTagValidator = IdsValidator.extend({
  tagId: z.coerce.number().refine(n => n >= 0)
})

export const BindCategoryValidator = IdsValidator.extend({
  categoryId: z.coerce.number().refine(n => n >= 0)
})

export const BindLevelValidator = IdsValidator.extend({
  level: z.coerce.number().refine(n => n >= 0)
})

export const CreateProjectValidator =
  z.object({
    name: z.string().min(1).max(64),
    zh: z.string().min(1).max(64).optional(),
    cht: z.string().min(1).max(64).optional()
  })

export const NameValidator = CreateProjectValidator
export const NameWithPrefixValidator = NameValidator.extend({
  prefix: z.string().min(1).max(64)
})

const phoneReg = /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
const accountReg = /^[0-9]{16,19}$/
const priceReg = /(^[1-9]([0-9]+)?(\.[0-9]{1,2})?$)|(^(0){1}$)|(^[0-9]\.[0-9]([0-9])?$)/;
export const EditProfileValidator =
  z.object({
    name: z.string().min(1).max(24).optional(),
    email: z.string().email().optional(),
    country: z.string().max(48).optional(),
    city: z.string().max(24).optional(),
    title: z.string().max(48).optional(),
    phone: z.union([z.string().optional(), z.string().max(24).regex(phoneReg, "Invalid phone"), z.undefined()]),
    sex: z.string().optional(),
    bank: z.string().optional(),
    account: z.union([z.string().optional(), z.string().max(19).regex(accountReg, "Invalid account"), z.undefined()]),
    language: z.string().optional(),
  })
export const EditProfileValidator2 =
  z.object({
    email: z.string().email().optional(),
    city: z.string().max(24).optional(),
    title: z.string().max(48).optional(),
    phone: z.union([z.string().optional(), z.string().max(24).regex(phoneReg, "Invalid phone"), z.undefined()]),
    gender: z.string().optional(),
    bank: z.string().optional(),
    account: z.union([z.string().optional(), z.string().max(19).regex(accountReg, "Invalid account"), z.undefined()]),
    language: z.string().optional(),
  })

export const ImageDataValidator =
  z.object({
    content: z.string().max(1024 * 1024 * 13).refine(value => value.startsWith("data:image"))
  })

// const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
export const UploadValidator =
  z.object({
    contents: z.array(
      z.string().refine(val => val.startsWith("data:image") || val.startsWith("data:application/pdf"), "Unsupport type")
    ).refine(val => {
      return val.every(it =>
        (it.startsWith("data:image") && it.length < 1024 * 1024 * 28) ||
        (it.startsWith("data:application/pdf") && it.length < 1024 * 1024 * 228)
      )
    }, "File size too large"),
  })

export const UploadWithIdValidator = UploadValidator.extend({
  id: z.coerce.number().refine(n => n >= 0),
})

export const ChangePasswordValidator =
  z.object({
    oldPassword: z.union([z.string().min(6), z.undefined()]),
    newPassword: z.string().min(6),
    repeatPassword: z.string().min(6)
  }).refine(schema => {
    return schema.newPassword && schema.newPassword === schema.repeatPassword
  }, { message: "The two password inputs are inconsistent", path: ["password"] })

export const PaginationValidator = z.object({
  page: z.coerce.number().optional()
})

export const PaginationWithStatusValidator = PaginationValidator.extend({
  status: z.string().optional().default("-1")
    .transform(val => parseInt(val)).refine(val => [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8].includes(val))
})

export const DemandValidator = z.object({
  share_user_id: z.coerce.number().optional(),
  designer_user_id: z.coerce.number().optional(),
  services: z.coerce.number(),
  type: z.coerce.number().optional(),
  platform: z.coerce.number().default(0),
  from_designer_flag: z.string(),
  name: z.string().max(64),
  email: z.string().email(),
  contact_number: z.string().max(64), //whatsapp

  final_delivery_time: z.string(),

  size: z.coerce.number().optional(),
  page: z.coerce.number().optional(),
  category: z.coerce.number().optional(),
  logo_design: z.string().max(1024 * 5).optional(),
  folding: z.coerce.number().optional(),

  printing_number: z.coerce.number().optional(), //quality
  printing_page: z.coerce.number().optional(),
  printing_size: z.coerce.number().optional(),
  cover_paper: z.coerce.number().optional(),
  inner_paper: z.coerce.number().optional(),
  staple: z.coerce.number().optional(),
  finish: z.string().max(128).optional(),

  remark: z.string().max(1024 * 10).optional(),
  img_list: z.string().max(1024 * 1024 * 3 * 5).optional(),
  attach_link: z.string().max(1024).optional(),

  logo_type: z.coerce.number().optional(),

  picture_id: z.string().max(1024).optional(),

  bussiness_card: z.string().max(1024 * 1024 * 5 * 2).optional(),
  level: z.coerce.number().optional(),
  suite: z.coerce.number().optional(),
  discount: z.coerce.number().optional()
})

export const DemandDesignerQuotationValidator = z.object({
  payment_information: z.string().optional(),
  demand_id: z.number(),
  currency_type: z.string(),
  currency_num: z.number(),
  designer_service_content: z.string().optional(),
  payment_type_url: z.string().optional()
})

export const DemandDesignerQuotationPayValidator = z.object({
 
  demand_id: z.number(),
  payment_upload_side: z.string().optional(),
  payment_finish_url: z.string().optional()
})

export const ExperienceValidator = z.object({
  company: z.string().min(3).max(128),
  title: z.string().min(3).max(128),
  description: z.string().min(12).max(1024 * 5),
  country: z.string().min(2).max(64),
  city: z.string().min(2).max(32),
  // start_at: z.string().regex(/^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/).optional(),
  // end_at: z.string().regex(/^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/).optional(),
  start_at: z.string().datetime().optional(),
  end_at: z.string().datetime().optional(),
  active: z.boolean().optional(),
})

export const ProfileBaseValidator = z.object({
  name: z.string().min(3).max(24),
  description: z.string().max(4096).optional(),
  phone: z.union([z.string().length(0), z.string().regex(/^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/)]).optional(),
  gender: z.union([z.literal("0"), z.literal("1"), z.literal(0), z.literal(1)]).optional(),
  country: z.string().max(48).optional(),
})


export const ContactValidator = z.object({
  email: z.string().email(),
  name: z.string().min(3).max(32),
  whatsapp: z.string().min(3).max(32),
})

export const ChangeUserValidator = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(24).optional(),
  email: z.string().email().optional(),
  password: z.union([z.string().length(0), z.string().min(6)]),
  prime: z.string().optional(),
  isPro: z.union([z.string().optional(), z.boolean()]),
  isTag: z.union([z.string().optional(), z.boolean()]),
  isBackAdmin: z.union([z.string().optional(), z.boolean()]),
  isConsumer: z.union([z.string().optional(), z.boolean()]),
  score: z.coerce.number().min(0).max(10)
})

export const PicturePassValidator = z.object({
  ids: z.string().optional(),
  _action: z.string().optional(),
  picturePublicTagId: z.coerce.number().optional(),
  level: z.coerce.number().optional(),
})

export const PictureRejectValidator = z.object({
  ids: z.string().optional(),
  _action: z.string().optional(),
  userId: z.string().optional(),
  content: z.string().min(1)
})

export const NotifyPassValidator = z.object({
  userId: z.string().optional(),
  _action: z.string().optional(),
  level: z.coerce.number().optional(),
})

export const NotifyRejectValidator = z.object({
  userId: z.string().optional(),
  _action: z.string().optional()
})

export const AddUserValidator = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  active: z.coerce.number().default(1),
  // roles: z.array(z.string()).optional()
})

export const DemandSearchValidator = z.object({
  keyword: z.string().optional()
})

export const DemandAttachmentValidator = z.object({
  name: z.string(),
  link: z.string(),
  id: z.number(),
}).refine(schema => {
  return schema.name
}, { message: "Required", path: ["name"] })
  .refine(schema => {
    return schema.link
  }, { message: "Required", path: ["link"] })

export const DemandEditAttachmentValidator = z.object({
  name: z.string(),
  link: z.string(),
  id: z.number(),
})
export const DemandDocumentValidator = z.object({
  name: z.string(),
  id: z.number(),
}).refine(schema => {
  return schema.name
}, { message: "Required", path: ["name"] })


export const DemandDelValidator = z.object({
  name: z.string().optional(),
  id: z.number(),
})

export const DemandStatusValidator = z.object({
  id: z.number(),
  status: z.number(),
  designer_user_id: z.number().optional(),
  toUser: z.number().optional(),
  // finalTime: z.string().optional(),
  // complatelTime: z.string().optional(),
  // draftTime: z.string().optional(),
})

export const DemandStatusChangeValidator = z.object({
  id: z.number(),
  status: z.number(),
})

export const TimeLineValidator = z.object({
  // draftTime: z.date(),
  // complatelTime:  z.date(),
  // finalTime:  z.date(),
  id: z.number(),
  toUser: z.number().optional()
})
export const CashBankValidator = z.object({
  price: z.string().regex(priceReg, "Invalid price"),
  bank: z.string(),
  account: z.union([z.string().regex(accountReg, "Invalid account"), z.undefined()]),
  demand_ids: z.string().optional()
}).refine(schema => {
  return schema.price
}, { message: "Required", path: ["price"] })

export const CashValidator = z.object({
  price: z.string().regex(priceReg, "Invalid price"),
}).refine(schema => {
  return schema.price
}, { message: "Required", path: ["price"] })


export const Profilealidator = z.object({
  phone: z.union([z.string().length(0), z.string().regex(/^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/)]).optional(),
  email: z.string().email().optional(),
  title: z.string().optional(),
  gender: z.string().optional(),
  language: z.string().optional(),
  city: z.string().optional(),
  bank: z.string().optional(),
  account: z.union([z.string().optional(), z.string().max(19).regex(accountReg, "Invalid account"), z.undefined()]),
})

export const ProfileDescriptionValidator = z.object({
  description: z.string().max(4096),
  name: z.string().min(3).max(24),
})

