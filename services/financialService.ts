import { StockQuote, NewsArticle, CryptoPrice, QuantitativeMetrics } from '../types';

// --- Mock Data ---

const MOCK_COMPANY_NAMES: Record<string, string> = {
    'AAPL': 'Apple Inc.',
    'GOOGL': 'Alphabet Inc.',
    'MSFT': 'Microsoft Corporation',
    'TSLA': 'Tesla, Inc.',
    'AMZN': 'Amazon.com, Inc.',
    'GME': 'GameStop Corp.',
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'DOGE': 'Dogecoin',
};

const MOCK_NEWS_HEADLINES: string[] = [
    'reports record quarterly earnings, shares surge.',
    'announces new product line, analysts optimistic.',
    'faces regulatory scrutiny over market dominance.',
    'CEO sells portion of their stake, stock dips slightly.',
    'upgraded to "Buy" by major investment bank.',
    'expands into new international markets.',
    'reveals breakthrough in AI research.',
];

// --- Helper Functions ---

const getRandomFloat = (min: number, max: number, decimals: number): number => {
    const str = (Math.random() * (max - min) + min).toFixed(decimals);
    return parseFloat(str);
};

const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatVolume = (num: number): string => {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
    return num.toString();
};

// --- Service Functions (Simulated) ---

export const getStockQuote = async (ticker: string): Promise<StockQuote> => {
    await new Promise(resolve => setTimeout(resolve, getRandomFloat(300, 1000, 0)));
    ticker = ticker.toUpperCase();

    if (Math.random() < 0.1) {
        throw new Error(`Market data feed for ${ticker} is currently unavailable.`);
    }

    const price = getRandomFloat(100, 500, 2);
    const change = getRandomFloat(-10, 10, 2);
    const isPositive = change >= 0;
    const changePercent = (change / price) * 100;
    const volume = getRandomFloat(5_000_000, 150_000_000, 0);

    return {
        ticker,
        name: MOCK_COMPANY_NAMES[ticker] || `${ticker} Company`,
        price: formatNumber(price),
        change: `${isPositive ? '+' : ''}${formatNumber(change)}`,
        changePercent: `${isPositive ? '+' : ''}${changePercent.toFixed(2)}%`,
        volume: formatVolume(volume),
        isPositive,
    };
};

export const getStockNews = async (ticker: string): Promise<NewsArticle[]> => {
    await new Promise(resolve => setTimeout(resolve, getRandomFloat(500, 1200, 0)));
    ticker = ticker.toUpperCase();

    const newsCount = Math.floor(Math.random() * 5) + 3; // 3 to 7 articles
    const articles: NewsArticle[] = [];

    for (let i = 0; i < newsCount; i++) {
        const headline = `${ticker} ${MOCK_NEWS_HEADLINES[Math.floor(Math.random() * MOCK_NEWS_HEADLINES.length)]}`;
        const source = ['Reuters', 'Bloomberg', 'Associated Press', 'MarketWatch'][Math.floor(Math.random() * 4)];
        const timestamp = new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24).toISOString();
        articles.push({ headline, source, url: '#', timestamp });
    }
    
    return articles;
};

export const getCryptoPrice = async (symbol: string): Promise<CryptoPrice> => {
    await new Promise(resolve => setTimeout(resolve, getRandomFloat(300, 800, 0)));
    symbol = symbol.toUpperCase();

    let price: number;
    if (symbol === 'BTC') price = getRandomFloat(60000, 70000, 2);
    else if (symbol === 'ETH') price = getRandomFloat(3000, 4000, 2);
    else if (symbol === 'DOGE') price = getRandomFloat(0.1, 0.3, 4);
    else price = getRandomFloat(1, 1000, 2);
    
    const change24h = getRandomFloat(-8, 8, 2);
    const isPositive = change24h >= 0;

    return {
        symbol,
        name: MOCK_COMPANY_NAMES[symbol] || `${symbol}`,
        price: formatNumber(price),
        change24h: `${isPositive ? '+' : ''}${change24h.toFixed(2)}%`,
        isPositive,
    };
};

export const getQuantMetrics = async (ticker: string): Promise<QuantitativeMetrics> => {
    await new Promise(resolve => setTimeout(resolve, getRandomFloat(800, 1500, 0)));
    ticker = ticker.toUpperCase();

    const sentiments: Array<'Bullish' | 'Neutral' | 'Bearish'> = ['Bullish', 'Neutral', 'Bearish'];
    const recommendations = [
        'Strong Buy: Asset shows significant upward potential.',
        'Hold: Market conditions are uncertain; maintain current position.',
        'Sell: Asset is overvalued with high downside risk.',
        'Accumulate: Asset is undervalued; consider adding to position.'
    ];

    return {
        ticker,
        alpha: getRandomFloat(0.01, 0.2, 3).toString(),
        beta: getRandomFloat(0.8, 1.5, 3).toString(),
        sharpeRatio: getRandomFloat(1.1, 2.5, 3).toString(),
        sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
        recommendation: recommendations[Math.floor(Math.random() * recommendations.length)],
    };
};