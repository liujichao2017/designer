import Lottie from "lottie-react"
import placeholder from "../../animations/placeholder-2.json"

export const LoadingPlaceholder = () => {
  return (
    <div className="w-full h-full flex justify-center items-center">
      <Lottie animationData={placeholder} />
    </div>
  )
}