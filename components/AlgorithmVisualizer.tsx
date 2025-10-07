import React from 'react';

interface AlgorithmVisualizerProps {
  htmlContent?: string;
}

const AlgorithmVisualizer: React.FC<AlgorithmVisualizerProps> = ({ htmlContent }) => {
  if (!htmlContent) {
    return null;
  }

  return (
    <iframe
      srcDoc={htmlContent}
      title="Algorithm Visualization"
      className="w-full h-96 border-2 border-layer-3 rounded-lg bg-layer-1"
      sandbox="allow-scripts"
    />
  );
};

export default AlgorithmVisualizer;