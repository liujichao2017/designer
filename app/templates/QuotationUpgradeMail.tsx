export default function ({ name, platform }: { name?: string, platform?: string }) {
  return (
    <div>
      <p>
        親愛的客戶， {name ?? ""}
      </p>

      <p>
        您好！您嘅報價已經上載到系統中。請登錄我哋嘅設計平台查看並確認。
      </p>

      <p>
        如有任何疑問或需要更多資訊，請隨時聯絡我哋。希望我哋嘅報價能滿足您嘅需求！
      </p>

      <p>
        祝好， {platform}
      </p>

    </div>
  )
}