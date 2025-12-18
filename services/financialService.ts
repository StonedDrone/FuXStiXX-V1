
import { StockQuote, NewsArticle, CryptoPrice, QuantitativeMetrics } from '../types';

export const getMockQuote = async (ticker: string): Promise<StockQuote> => {
    const isCrypto = ticker.length > 5 || /BTC|ETH|SOL|DOGE/i.test(ticker);
    return {
        ticker: ticker.toUpperCase(),
        name: isCrypto ? `${ticker} Protocol` : `${ticker} Corp`,
        price: (Math.random() * 500 + 50).toFixed(2),
        change: (Math.random() * 10 - 5).toFixed(2),
        changePercent: `${(Math.random() * 5).toFixed(2)}%`,
        volume: `${(Math.random() * 10).toFixed(1)}M`,
        isPositive: Math.random() > 0.4
    };
};

export const getStockQuote = async (ticker: string): Promise<StockQuote> => getMockQuote(ticker);

export const getStockNews = async (ticker: string): Promise<NewsArticle[]> => {
    return [{
        headline: `${ticker} Core Integration Successful`,
        source: "Chaos Feed",
        url: "#",
        timestamp: new Date().toISOString()
    }];
};

export const getCryptoPrice = async (symbol: string): Promise<CryptoPrice> => {
    const quote = await getMockQuote(symbol);
    return {
        symbol: symbol.toUpperCase(),
        name: `${symbol} Network`,
        price: quote.price,
        change24h: quote.changePercent,
        isPositive: quote.isPositive
    };
};

export const getQuantMetrics = async (ticker: string): Promise<QuantitativeMetrics> => {
    return {
        ticker: ticker.toUpperCase(),
        alpha: "0.42",
        beta: "1.12",
        sharpeRatio: "2.5",
        sentiment: 'Bullish',
        recommendation: "Increase chaos exposure."
    };
};
