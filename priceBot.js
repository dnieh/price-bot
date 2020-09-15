const CoinGecko = require("coingecko-api");
const CoinGeckoClient = new CoinGecko();
const axios = require("axios");

const POLL_INTERVAL = 60000;

const TOKENS = {
  SAKE: {
    id: "sake-token",
  },
  SUSHI: {
    id: "sushi",
  },
  OMG: {
    id: "omisego",
    url: "omg-network",
  },
  UMA: {
    id: "uma",
  },
};

const priceReveralBot = async (tokenData, tokenName) => {
  let res = await CoinGeckoClient.coins.fetch(tokenData.id);
  const marketData = res.data.market_data;
  const currentPrice = marketData.current_price.usd;
  const prevPrice = TOKENS[tokenName].price;
  const priceDif = currentPrice - prevPrice;

  console.log(
    `Fetching price data for ${tokenName}. Current price: $${currentPrice}. Previous price: $${prevPrice}.`
  );

  if (prevPrice && prevPrice < currentPrice) {
    axios
      .post(
        `https://hooks.slack.com/services/T01AC1Q7K2S/B01AV7ECTDJ/${process.env.SLACK_API_TOKEN}`,
        {
          text: `${tokenName} +${((priceDif / prevPrice) * 100).toFixed(
            2
          )}% See charts here: https://www.coingecko.com/en/coins/${
            tokenData.url || tokenData.id
          }`,
          color: "#36a64f",
        }
      )
      .catch((e) => {
        console.log("Something went wrong", e);
      });
  }

  TOKENS[tokenName].price = currentPrice;
};

const poll = async () => {
  return await new Promise((resolve) => {
    setTimeout(() => {
      Object.keys(TOKENS).forEach((key) => priceReveralBot(TOKENS[key], key));
      poll();
      resolve();
    }, POLL_INTERVAL);
  });
};

poll();
