export default function () {
  return (
    <ul className="steps">
      <li className="step step-info">完善资料</li>
      <li className="step step-info">等待审核</li>
      <li className="step step-error" data-content={<>Sit on toilet</>}>入驻成功</li>
    </ul>
  )
}