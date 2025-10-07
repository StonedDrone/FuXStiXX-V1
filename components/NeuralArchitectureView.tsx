import React from 'react';
import { NeuralArchitectureData } from '../types';

const layerColors: Record<string, string> = {
  input: 'var(--color-success)',
  output: 'var(--color-danger)',
  conv: '#00BFFF', // blue from analyzing theme
  dense: '#9400D3', // purple from stealth theme
  attention: '#FFFF00', // yellow from overdrive theme
  other: 'var(--color-secondary)',
};

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


const NeuralArchitectureView: React.FC<{ data: NeuralArchitectureData }> = ({ data }) => {
    const width = 500;
    const height = 150;
    const layerWidth = 80;
    const layerHeight = 30;
    const totalLayers = data.layers.length;
    const gap = (width - totalLayers * layerWidth) / (totalLayers + 1);

    return (
        <DataCard title={`Neural Cartography: ${data.modelName}`}>
            <div className="bg-base p-2 rounded-md">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                    <defs>
                        <linearGradient id="grad-arrow" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style={{ stopColor: 'var(--color-layer-3)', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: 'var(--color-primary)', stopOpacity: 1 }} />
                        </linearGradient>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="var(--color-primary)" />
                        </marker>
                    </defs>

                    {/* Connections */}
                    {data.connections.map((conn, index) => {
                        const startX = gap + (index * (layerWidth + gap)) + layerWidth;
                        const endX = gap + ((index + 1) * (layerWidth + gap));
                        const y = height / 2;
                        return (
                            <line
                                key={`conn-${index}`}
                                x1={startX}
                                y1={y}
                                x2={endX}
                                y2={y}
                                stroke="url(#grad-arrow)"
                                strokeWidth="2"
                                markerEnd="url(#arrowhead)"
                            />
                        );
                    })}
                    
                    {/* Layers */}
                    {data.layers.map((layer, index) => {
                        const x = gap + (index * (layerWidth + gap));
                        const y = (height - layerHeight) / 2;
                        const mainNode = layer.nodes[0];
                        const color = layerColors[mainNode?.type] || layerColors.other;

                        return (
                            <g key={layer.id} transform={`translate(${x}, ${y})`}>
                                <rect
                                    width={layerWidth}
                                    height={layerHeight}
                                    rx="4"
                                    fill="var(--color-layer-1)"
                                    stroke={color}
                                    strokeWidth="2"
                                />
                                <text
                                    x={layerWidth / 2}
                                    y={layerHeight / 2 + 5}
                                    textAnchor="middle"
                                    fill="var(--color-secondary)"
                                    fontSize="10"
                                    fontFamily="Inter, sans-serif"
                                    fontWeight="600"
                                >
                                    {layer.name}
                                </text>
                            </g>
                        );
                    })}

                </svg>
            </div>
            <p className="text-xs text-gray-400 mt-2 p-1">{data.summary}</p>
        </DataCard>
    );
};

export default NeuralArchitectureView;