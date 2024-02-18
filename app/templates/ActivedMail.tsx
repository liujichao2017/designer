export default function ({ name, platform = "Definer tech" }: { name: string, platform?: string }) {
  return (
    <div>
      <p>
        親愛的設計師， {name}
      </p>

      <p>
        恭喜您成功成為我們設計平台的認證設計師。為了提供客戶更完整的服務體驗，請您儘快將您的設計參考加入至「設計庫」，這將有助於客戶了解您的設計風格。
      </p>

      <p>
        謝謝您的參與，期待未來的合作。
      </p>

      <p>
        順祝商祺，
      </p>

      <p>
        {platform}
      </p>

    </div>
  )
}