import React from 'react';

interface UIMockupViewerProps {
  htmlContent?: string;
}

const UIMockupViewer: React.FC<UIMockupViewerProps> = ({ htmlContent }) => {
  if (!htmlContent) {
    return null;
  }

  return (
    <iframe
      srcDoc={htmlContent}
      title="UI Mockup"
      className="w-full h-96 border-2 border-layer-3 rounded-lg bg-white"
      sandbox="allow-scripts"
    />
  );
};

export default UIMockupViewer;