import { UserProps } from "~/utils/store"
import logo from "~/images/logo-md.png"

export default (
  { user, endPoint, code }:
    { user: UserProps, endPoint: string, code: string }
) => {
  return (
    <div>

      <h3>Avtive your account</h3>
      <p>Hi {user.name}:</p>
      <p>Click the link below to active your account</p>
      <h5>
        <a href={`${endPoint}/auth/active/${code}`}>Active</a>
      </h5>
    </div>
  )
}