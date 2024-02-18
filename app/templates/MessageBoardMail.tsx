import dayjs from 'dayjs';

interface mailMessage {
  message_content: string | null
  user_name: string
  created_at: Date | null

}

// eslint-disable-next-line react/display-name
export default (
  {orderNo, linkUrl, userName, messageList}:
  {
      orderNo: string,
      linkUrl: string,
      userName: string,
      messageList: Array<mailMessage>
  }
) => {
  const transferDateTime = (time: Date | null) => {
    return dayjs(time).format('YYYY-MM-DD HH:mm:ss');
  }
  return (
    <div>
      <p>New Message Notification!</p>
      <p>Dear [{userName}]</p>
      <p>I am pleased to inform you that there is an important message on your order[{orderNo}]. </p>
      <p>Please log in to our platform or visit the order management page to view the complete message content and detailed information.<a href={linkUrl} target='_blank' title='New Message Notification！' rel="noreferrer">[Link]</a></p>
      <br />
      <p><strong>Need help?</strong></p>
      <p>Our customer service team is always ready to assist you. If you have any questions or need assistance, please feel free to contact us at any time.</p>
      <p><strong>Contact information:</strong></p>
      <p>Any page: Click on the customer service representative;</p>
      <p>Email: info@definertech.com</p>
      <p>Phone: 6754 8453</p>
      <p>Thank you again for using Defender. We look forward to creating wonderful design works with you!</p>
      <br />
      <p>Definer</p>
      <p>Comprehensive coverage of design scenarios</p>
      <p>Meet all your design needs</p>
      <br />
      <p>Here are the latest three messages(or less):</p>
      <br />
      {
        messageList && messageList.length > 0 && messageList.map((item, index)=> {
         return (
            <div key={index} className="flex flex-col mt-5">
              <div className="flex">
                <strong>Message From:</strong>
                <span className="ml-4">{item.user_name}</span>
              </div>
              <div className="flex">
                <strong className="font-bold">Message Time:</strong>
                <span className="ml-4">{transferDateTime(item.created_at)}</span>
              </div>
              <div className="flex">
                <strong className="font-bold">Message Content:</strong>
                <p className="ml-4 whitespace-pre">{item.message_content}</p>
              </div>
            </div>
          )
        })
      }
    </div>
  )
}