import React from 'react';
import { FinancialData, StockQuote, NewsArticle, CryptoPrice, QuantitativeMetrics } from '../types';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { TrendingDownIcon } from './icons/TrendingDownIcon';

const DataCard: React.FC<{ children: React.ReactNode, title: string }> = ({ children, title }) => (
    <div className="mt-3 border border-layer-3 rounded-lg bg-layer-2/50 overflow-hidden font-sans">
        <div className="p-2 bg-layer-2 border-b border-layer-3 text-xs font-mono">
            <span className="text-secondary">{title}</span>
        </div>
        <div className="p-3">
            {children}
        </div>
    </div>
);

const formatTimeAgo = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
};

const StockQuoteView: React.FC<{ data: StockQuote }> = ({ data }) => {
    const textColor = data.isPositive ? 'text-success' : 'text-danger';
    return (
        <DataCard title={`Market Pulse: ${data.ticker}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-lg text-secondary">{data.ticker}</h4>
                    <p className="text-xs text-gray-400">{data.name}</p>
                </div>
                <div className="text-right">
                    <p className="font-mono text-xl font-semibold text-secondary">{data.price}</p>
                    <div className={`flex items-center justify-end space-x-1 font-mono text-sm ${textColor}`}>
                        {data.isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
                        <span>{data.change} ({data.changePercent})</span>
                    </div>
                </div>
            </div>
            <div className="mt-3 pt-3 border-t border-layer-3 text-xs text-gray-400 font-mono">
                <span>Volume: {data.volume}</span>
            </div>
        </DataCard>
    );
};

const NewsView: React.FC<{ data: NewsArticle[] }> = ({ data }) => {
    const ticker = data.length > 0 ? data[0].headline.split(' ')[0] : 'N/A';
    return (
        <DataCard title={`Sector Intel: ${ticker}`}>
            <div className="space-y-3">
                {data.map((article, index) => (
                    <div key={index} className="border-b border-layer-3 pb-2 last:border-b-0">
                        <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-primary transition-colors">
                            {article.headline}
                        </a>
                        <div className="text-xs text-gray-500 mt-1 font-mono flex justify-between">
                            <span>{article.source}</span>
                            <span>{formatTimeAgo(article.timestamp)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </DataCard>
    );
};

const CryptoView: React.FC<{ data: CryptoPrice }> = ({ data }) => {
    const textColor = data.isPositive ? 'text-success' : 'text-danger';
    return (
        <DataCard title={`Crypto Scan: ${data.symbol}`}>
             <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-lg text-secondary">{data.name} ({data.symbol})</h4>
                </div>
                <div className="text-right">
                    <p className="font-mono text-xl font-semibold text-secondary">${data.price}</p>
                    <div className={`flex items-center justify-end space-x-1 font-mono text-sm ${textColor}`}>
                        {data.isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
                        <span>{data.change24h} (24h)</span>
                    </div>
                </div>
            </div>
        </DataCard>
    );
};

const QuantView: React.FC<{ data: QuantitativeMetrics }> = ({ data }) => {
    const sentimentColor = {
        Bullish: 'text-success',
        Neutral: 'text-secondary',
        Bearish: 'text-danger',
    }[data.sentiment];

    return (
        <DataCard title={`Alpha Signal: ${data.ticker}`}>
            <div className="space-y-2 font-mono text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-400">Alpha:</span>
                    <span className="text-secondary font-semibold">{data.alpha}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">Beta:</span>
                    <span className="text-secondary font-semibold">{data.beta}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">Sharpe Ratio:</span>
                    <span className="text-secondary font-semibold">{data.sharpeRatio}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">Market Sentiment:</span>
                    <span className={`font-semibold ${sentimentColor}`}>{data.sentiment}</span>
                </div>
            </div>
            <div className="mt-3 pt-3 border-t border-layer-3">
                <p className="text-xs text-gray-400 font-mono mb-1">Recommendation:</p>
                <p className="text-sm text-secondary">{data.recommendation}</p>
            </div>
        </DataCard>
    );
};


const FinancialDataView: React.FC<{ data: FinancialData }> = ({ data }) => {
    switch (data.type) {
        case 'stock':
            return <StockQuoteView data={data.data as StockQuote} />;
        case 'news':
            return <NewsView data={data.data as NewsArticle[]} />;
        case 'crypto':
            return <CryptoView data={data.data as CryptoPrice} />;
        case 'quant':
            return <QuantView data={data.data as QuantitativeMetrics} />;
        default:
            return <div className="text-danger">Unknown financial data format.</div>;
    }
};

export default FinancialDataView;