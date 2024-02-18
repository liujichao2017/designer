import { useTranslation } from "react-i18next"
import { PhotoProvider, PhotoView } from "react-photo-view"

type Props = {
  images: { id: number, image: string, thumbnail: string, litpic_url: string, img_url: string }[],
  addition?: string,
  designerAddition?: string
}

export default function Preference ({ images, addition, designerAddition }: Props) {
  const { t } = useTranslation()
  return (
    <div className="py-4 border-b border-base-content/10 flex flex-col gap-2">
      <div>{t("demand.designPicture")}</div>
      <div className="text-sm text-base-content/50">{t("selected")}：{images.length}</div>
      <div className="flex flex-wrap gap-2">
        <PhotoProvider>
          {images.map((value) =>
            <PhotoView key={value.id} src={value.image ?? value.img_url}>
              <div className="border-2 border-[#E5E6EB] cursor-pointer">
                <img
                  src={value.thumbnail ?? value.litpic_url} className="w-20 h-20 object-cover" />
              </div>
            </PhotoView>
          )}
        </PhotoProvider>
      </div>
      <div className="flex flex-col gap-3 mt-4">
        <h3>{t("demand.stepList.4")}</h3>
        {
          !!addition &&

          <div className="text-sm text-base-content/50" dangerouslySetInnerHTML={{
            __html: [t("consumer"), ...addition.split("\n")].join("<br />")
          }}>
          </div>
        }
        {
          !!designerAddition &&
          <div className="text-sm text-base-content/50" dangerouslySetInnerHTML={{
            __html: [t("designer"), designerAddition.split("\n")].join("<br />")
          }}>
          </div>
        }
      </div>
    </div>

  )
}
