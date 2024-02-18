export default function ({ name, consumer, platform = "Definer tech" }:
  { name: string, consumer: string, platform?: string }) {
  return (
    <div>
      <p>
        親愛的設計師， {name}
      </p>

      <p>
        您好！有一位客戶選擇咗您來提供報價。
      </p>

      <p>
        客戶名稱：{consumer}。
      </p>
      <p>
        如有確認我們會盡快通知你。請勿直接與客戶私下聯繫。
      </p>
      <p>
        謝謝您嘅專業服務！
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