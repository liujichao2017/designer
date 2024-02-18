import logo from "~/images/logo-md.png"

type Props = {
  code: string
  email: string
  endPoint: string
}
export default function ({ code, email, endPoint }: Props) {
  return (
    <div>

      <h3>Reset password</h3>
      <p>Hi {email}:</p>
      <p>Click the link below to reset your password</p>
      <h3>
        <a href={`${endPoint}/auth/reset/${code}`}>Reset password (Valid within 30 minutes)</a>
      </h3>
    </div>
  )
}