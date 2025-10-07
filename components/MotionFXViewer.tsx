import React from 'react';

interface MotionFXViewerProps {
  htmlContent?: string;
}

const MotionFXViewer: React.FC<MotionFXViewerProps> = ({ htmlContent }) => {
  if (!htmlContent) {
    return null;
  }

  return (
    <iframe
      srcDoc={htmlContent}
      title="Motion FX"
      className="w-full aspect-square max-w-sm border-2 border-layer-3 rounded-lg bg-layer-1"
      sandbox="allow-scripts"
    />
  );
};

export default MotionFXViewer;