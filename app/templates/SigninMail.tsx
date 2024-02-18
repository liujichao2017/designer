export default function ({ name, platform = "Definer tech" }: { name: string, platform?: string }) {
  return (
    <div>
      <p>
        親愛的設計師，{name}
      </p>

      <p>
        感謝您加入我們的設計平台。為了讓客戶更深入了解您的作品風格，請您上傳您的作品集和設計參考至「作品集」部分並申請成為平台認證設計師。我們的團隊將審查您的申請，一旦核准，您便可以開始接受客戶的項目邀請。
      </p>

      <p>
        期待與您的合作。
      </p>

      <p>
        {platform}
      </p>


    </div>
  )
}