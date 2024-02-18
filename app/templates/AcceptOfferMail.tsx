export default function ({ name, platform = "Definer tech" }: { name: string, platform?: string }) {
  return (
    <div>
      <p>
        親愛的設計師， {name}
      </p>

      <p>
        您好！有一位客戶已經選擇咗您並支付咗訂金。請您在3小時內確認是否接受此項目。如您接受，請提供您能夠提供嘅最佳時間表給客戶。
      </p>

      <p>
        記住，您嘅確認係非常重要嘅，請務必及時回覆。
      </p>

      <p>
        祝好，
      </p>

      <p>
        {platform}
      </p>

    </div>
  )
}