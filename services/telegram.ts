interface TelegramCredentials {
  API_KEY: string;
}

function shoutToOne(
  message: string,
  whom: string,
  credentials: TelegramCredentials,
) {
  // fetch(
  //   `https://api.telegram.org/bot${credentials.API_KEY}/sendMessage?chat_id=${}&text=${encodeURIComponent(message)}`
  // );
}
