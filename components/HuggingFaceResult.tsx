import React from 'react';
import { HuggingFaceResult as HuggingFaceResultType } from '../types';
import { HuggingFaceIcon } from './icons/HuggingFaceIcon';
import { LoaderIcon } from './icons/LoaderIcon';

interface HuggingFaceResultProps {
  data: HuggingFaceResultType;
}

const ResultCard: React.FC<{ children: React.ReactNode, title: string }> = ({ children, title }) => (
    <div className="mt-3 border border-layer-3 rounded-lg bg-layer-2/50 overflow-hidden">
        <div className="p-2 bg-layer-2 border-b border-layer-3 flex items-center justify-between text-xs font-mono">
            <span className="text-secondary">{title}</span>
            <div className="flex items-center space-x-1 text-yellow-400">
                <span>Powered by</span>
                <HuggingFaceIcon className="w-4 h-4" />
            </div>
        </div>
        <div className="p-3 text-sm">
            {children}
        </div>
    </div>
);

const renderResult = (result: any) => {
    // Check if result is a data URL for an image
    if (typeof result === 'string' && result.startsWith('data:image/')) {
        return <img src={result} alt="Hugging Face Model Output" className="rounded-lg max-w-full sm:max-w-sm border-2 border-layer-3" />;
    }
    // Check for common text generation output formats
    if (result?.generated_text) {
        return <p className="whitespace-pre-wrap font-mono">{result.generated_text}</p>;
    }
    // Generic JSON output
    return <pre className="whitespace-pre-wrap text-xs bg-base p-2 rounded-md overflow-x-auto"><code>{JSON.stringify(result, null, 2)}</code></pre>;
};

const ModelQueryResult: React.FC<{ data: HuggingFaceResultType }> = ({ data }) => (
    <ResultCard title={`Query: ${data.query.model}`}>
        <p className="text-secondary mb-2 italic">&ldquo;{data.query.prompt}&rdquo;</p>
        {data.result === null ? (
            <div className="flex items-center space-x-2 text-secondary animate-pulse">
                <LoaderIcon />
                <span>Querying...</span>
            </div>
        ) : renderResult(data.result)}
    </ResultCard>
);

const ModelSearchResult: React.FC<{ data: HuggingFaceResultType }> = ({ data }) => (
    <ResultCard title={`Search: "${data.query.query}"`}>
        {data.result === null ? (
            <div className="flex items-center space-x-2 text-secondary animate-pulse">
                <LoaderIcon />
                <span>Searching the Hub...</span>
            </div>
        ) : (
            <div className="space-y-3">
                {data.result.models?.slice(0, 5).map((model: any) => (
                    <div key={model.id} className="border-b border-layer-3 pb-2 last:border-b-0">
                        <a href={`https://huggingface.co/${model.id}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold font-mono">{model.id}</a>
                        <p className="text-xs text-secondary mt-1">❤️ {model.likes} | pipeline: {model.pipeline_tag}</p>
                        {model.cardData?.description && <p className="text-xs text-gray-400 mt-1 truncate">{model.cardData.description}</p>}
                    </div>
                ))}
                {data.result.models?.length === 0 && <p className="text-secondary">No models found.</p>}
            </div>
        )}
    </ResultCard>
);

const DatasetSearchResult: React.FC<{ data: HuggingFaceResultType }> = ({ data }) => (
    <ResultCard title={`Dataset Search: "${data.query.query}"`}>
        {data.result === null ? (
            <div className="flex items-center space-x-2 text-secondary animate-pulse">
                <LoaderIcon />
                <span>Searching for datasets...</span>
            </div>
        ) : (
            <div className="space-y-3">
                {data.result?.slice(0, 5).map((dataset: any) => (
                    <div key={dataset.id} className="border-b border-layer-3 pb-2 last:border-b-0">
                        <a href={`https://huggingface.co/datasets/${dataset.id}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold font-mono">{dataset.id}</a>
                        <p className="text-xs text-secondary mt-1">❤️ {dataset.likes} | ⬇️ {dataset.downloads}</p>
                        {dataset.description && <p className="text-xs text-gray-400 mt-1 truncate">{dataset.description}</p>}
                    </div>
                ))}
                {data.result?.length === 0 && <p className="text-secondary">No datasets found.</p>}
            </div>
        )}
    </ResultCard>
);

const SpaceInfoResult: React.FC<{ data: HuggingFaceResultType }> = ({ data }) => (
    <ResultCard title={`Space: ${data.query.space}`}>
        {data.result === null ? (
            <div className="flex items-center space-x-2 text-secondary animate-pulse">
                <LoaderIcon />
                <span>Fetching intel...</span>
            </div>
        ) : (
            <div className="font-mono text-xs space-y-1">
                <p><span className="text-secondary w-20 inline-block">ID:</span> {data.result.id}</p>
                <p><span className="text-secondary w-20 inline-block">Author:</span> {data.result.author}</p>
                <p><span className="text-secondary w-20 inline-block">Likes:</span> ❤️ {data.result.likes}</p>
                <p><span className="text-secondary w-20 inline-block">SDK:</span> {data.result.sdk}</p>
                <p><span className="text-secondary w-20 inline-block">Hardware:</span> {data.result.hardware?.requested || 'N/A'}</p>
                <a href={`https://huggingface.co/spaces/${data.result.id}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline block mt-2">Visit Space →</a>
            </div>
        )}
    </ResultCard>
);

const HuggingFaceResult: React.FC<HuggingFaceResultProps> = ({ data }) => {
    if (data.error) {
        return (
            <ResultCard title="Operation Failed">
                <p className="text-danger font-mono text-xs">{data.error}</p>
                <p className="text-secondary text-xs mt-2">Ensure the model/space ID is correct and that your HF_TOKEN has the required permissions.</p>
            </ResultCard>
        );
    }
    
    switch (data.type) {
        case 'modelQuery':
            return <ModelQueryResult data={data} />;
        case 'modelSearch':
            return <ModelSearchResult data={data} />;
        case 'datasetSearch':
            return <DatasetSearchResult data={data} />;
        case 'spaceInfo':
            return <SpaceInfoResult data={data} />;
        default:
            return (
                 <ResultCard title="Unknown Result">
                    <pre className="whitespace-pre-wrap text-xs"><code>{JSON.stringify(data.result, null, 2)}</code></pre>
                 </ResultCard>
            );
    }
};

export default HuggingFaceResult;