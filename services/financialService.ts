import { StockQuote, NewsArticle, CryptoPrice, QuantitativeMetrics } from '../types';

const NOT_CONFIGURED_ERROR = "Financial data endpoint not configured. Direct execution requires a valid API key and connection.";

export const getStockQuote = async (ticker: string): Promise<StockQuote> => {
    throw new Error(NOT_CONFIGURED_ERROR);
};

export const getStockNews = async (ticker: string): Promise<NewsArticle[]> => {
    throw new Error(NOT_CONFIGURED_ERROR);
};

export const getCryptoPrice = async (symbol: string): Promise<CryptoPrice> => {
    throw new Error(NOT_CONFIGURED_ERROR);
};

export const getQuantMetrics = async (ticker: string): Promise<QuantitativeMetrics> => {
    throw new Error(NOT_CONFIGURED_ERROR);
};