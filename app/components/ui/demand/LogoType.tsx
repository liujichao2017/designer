import { range } from "~/utils/helpers";
import { t } from "i18next";
import { Dispatch, SetStateAction, useEffect } from "react";
import { useDemandState } from "~/utils/store";
import logo0 from "~/images/0.png"
import logo1 from "~/images/1.png"
import logo2 from "~/images/2.png"
import logo3 from "~/images/3.png"
import logo4 from "~/images/4.png"
import logo5 from "~/images/5.png"
import logo6 from "~/images/6.png"
import { useTranslation } from "react-i18next";

const logos = [
  logo0, logo1, logo2, logo3, logo4, logo5, logo6
]

type Params = {
  errors: Record<string, string> | undefined,
  setErrors: Dispatch<SetStateAction<Record<string, string> | undefined>>
}

export default ({ errors, setErrors }: Params) => {
  const [designOption, setDesignOption] = useDemandState(state => [state.design, state.setDesignOption, state.resetDesignOption])
  const { t, i18n } = useTranslation()
  useEffect(() => {
    setDesignOption({
      // logoSummary: t("logoDescription")
      logoSummary: `1. logo 名稱是：
2.產品或服務類型：
3. 營運理念：
4 品牌名稱解釋：
5.設計必須的融入特徵/元素： 
6.字體/顏色偏好：
7.設計風格：例如:企業、專業、樸素、復古、高級、科技......
8. 心儀的 logo 相片 (如 有，請提供於備注)
      `
    })
  }, [i18n.language])
  return (
    <div className="mt-2.5">

      <div className="grid grid-cols-3 gap-x-2">
        <div className={`rounded-md border-2 p-2 cursor-pointer ${designOption?.suite === 0 ? "border-primary shadow-lg bg-base-100" : "border-base-content/10"}`}
          onClick={() => {
            setDesignOption({ ...designOption, suite: 0 })
          }}
        >
          Standard <br />
          Original price HK$4580 <br />
          HK$3980 <br />
          Designer with ten years of experience <br />
          Dedicated follow-up <br />
          Brand design copywriting <br />
          Includes 1 design <br />
          Original file (Ai) <br />
          Version with background color removed (Png) + JPG <br />
          Design preview 3 pages (Pdf) <br />
          5 revisions <br />
          Cloud Access <br />
          First draft delivered within ten days <br />
        </div>
        <div className={`rounded-md border-2 p-2 cursor-pointer ${designOption?.suite === 1 ? "border-primary shadow-lg bg-base-100" : "border-base-content/10"}`}
          onClick={() =>
            setDesignOption({ ...designOption, suite: 1 })
          }
        >
          Advanced<br />
          Original price HK$6580 <br />
          HK$5980 <br />
          Designer with ten years of experience <br />
          Dedicated follow-up<br />
          Brand design copywriting<br />
          Includes 2 design directions<br />
          Original file (Ai)<br />
          Version with background color removed (Png)＋JPG<br />
          Design preview 4 pages (Pdf)<br />
          Includes 4-page brand description file<br />
          Unlimited modifications for 1 month<br />
          First draft delivered within ten days<br />
        </div>

        <div className={`rounded-md border-2 p-2 cursor-pointer ${designOption?.suite === 2 ? "border-primary shadow-lg bg-base-100" : "border-base-content/10"}`}
          onClick={() =>
            setDesignOption({ ...designOption, suite: 2 })
          }
        >
          Special<br />
          Original price HK$8880<br />
          HK$7880<br />
          Designer with ten years of experience<br />
          Dedicated follow-up<br />
          Brand design copywriting<br />
          Includes 3 design directions<br />
          Original file (Ai)<br />
          Version with background color removed (Png)＋JPG<br />
          8 pages of design preview (Pdf)<br />
          Includes 8-page brand description file (Pdf)<br />
          Unlimited modifications for 2 months<br />
          First draft delivered within ten days<br />
        </div>
      </div>
      <div>
        <span className="text-sm text-[#FF3D00]">*</span>
        <span className="text-sm ml-2.5">{t('demand.logoItemTitle')}</span>
      </div>


      <div className="grid grid-cols-2 gap-x-2.5 gap-y-2.5 mt-2.5">
        {range(7).map((value, index) => {
          return (<label className="flex items-center gap-2" htmlFor={"radio" + index}>
            <span>
              <input id={`radio` + index} type="radio" value={value}
                className={`radio radio-primary radio-xs ${errors?.logo ? 'border-red-500' : ''}`}
                checked={value == designOption?.logo}
                onChange={(e) => {
                  setDesignOption({
                    logo: parseInt(e.target.value)
                  })
                  delete errors?.logo
                  setErrors(errors)
                }} />
            </span>
            <img src={logos[index]} className="w-[58px] h-[58px] p-1 rounded-md border border-base-300" />
            <span className="ml-2.5">{t(`demand.logoItem.${value}`)}</span>
          </label>)
        })}
      </div>
      <div className="mt-2.5">
        {/* <span className="text-sm text-[#FF3D00]">*</span> */}
        <span className="text-sm ml-2.5">{t('demand.logoDescriptionTitle')}</span>
      </div>
      <div className="mt-2.5">
        <textarea
          className={`border ${errors?.logoSummary ? 'border-red-500' : 'border-[#CFD0D8]'} rounded-lg p-2.5 w-full outline-none resize-none`}
          rows={10} value={designOption?.logoSummary} onBlur={(e) => {
            setDesignOption({
              logoSummary: e.target.value
            })
            delete errors?.logoSummary
            setErrors(errors)
          }}></textarea>
      </div>
    </div>)
}