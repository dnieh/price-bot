const CoinGecko = require("coingecko-api");
const CoinGeckoClient = new CoinGecko();
const axios = require("axios");

const POLL_INTERVAL = 60000;

const TOKENS = {
  SAKE: {
    id: "sake-token",
    trendCount: 0,
    tokenAddress: "0x066798d9ef0833ccc719076dab77199ecbd178b0",
  },
  SUSHI: {
    id: "sushi",
    trendCount: 0,
    tokenAddress: "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2",
  },
  OMG: {
    id: "omisego",
    url: "omg-network",
    trendCount: 0,
    tokenAddress: "0xd26114cd6ee289accf82350c8d8487fedb8a0c07",
  },
  UMA: {
    id: "uma",
    trendCount: 0,
    tokenAddress: "0x04fa0d235c4abf4bcf4787af4cf447de572ef828",
  },
  PICKLE: {
    id: "pickle-finance",
    trendCount: 0,
    tokenAddress: "0x429881672B9AE42b8EbA0E26cD9C73711b891Ca5",
  },
  MOONSWAP: {
    id: "moonswap",
    trendCount: 0,
    tokenAddress: "0x68a3637ba6e75c0f66b61a42639c4e9fcd3d4824",
  },
  CREAM: {
    id: "cream",
    trendCount: 0,
    tokenAddress: "0x2ba592f78db6436527729929aaf6c908497cb200",
  },
};

const priceTrendBot = async (tokenData, tokenName) => {
  let res = await CoinGeckoClient.coins.fetch(tokenData.id);
  const marketData = res.data.market_data;
  const currentPrice = marketData.current_price.usd;
  const prevPrice = TOKENS[tokenName].price;
  const priceDif = currentPrice - prevPrice;
  const trendCount = TOKENS[tokenName].trendCount + 1;

  console.log(
    `Fetching price data for ${tokenName}. Current price: $${currentPrice}. Previous price: $${prevPrice}.`
  );

  if (prevPrice && trendCount > 0 && prevPrice <= currentPrice) {
    const tokenAddress = TOKENS[tokenName].tokenAddress;
    if (prevPrice !== currentPrice) {
      axios
        .post(
          `https://hooks.slack.com/services/T01AC1Q7K2S/B01AV7ECTDJ/${process.env.SLACK_API_TOKEN}`,
          {
            text: `
*${tokenName}* <https://www.coingecko.com/en/coins/${
              tokenData.url || tokenData.id
            }|CoinGecko> | <https://uniswap.info/token/${tokenAddress}|Uniswap> | <https://etherscan.io/token/${tokenAddress}|Etherscan>\n
+${((priceDif / prevPrice) * 100).toFixed(
              2
            )}% (Now ${currentPrice}) Price has been flat or trending up for ${trendCount} minute${
              trendCount > 1 ? "s" : ""
            }.`,
          }
        )
        .catch((e) => {
          console.log("Something went wrong sending to slack", e.message);
        });
    }
    TOKENS[tokenName].trendCount += 1;
  } else {
    TOKENS[tokenName].trendCount = 0;
  }

  TOKENS[tokenName].price = currentPrice;
};

const poll = async () => {
  Object.keys(TOKENS).forEach((key) => priceTrendBot(TOKENS[key], key));
  return await new Promise((resolve) => {
    setTimeout(() => {
      poll();
      resolve();
    }, POLL_INTERVAL);
  });
};

poll();
