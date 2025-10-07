import React from 'react';

interface UIMockupViewerProps {
  htmlContent?: string;
}

const UIMockupViewer: React.FC<UIMockupViewerProps> = ({ htmlContent }) => {
  if (!htmlContent) {
    return null;
  }

  return (
    <div className="relative">
      <iframe
        srcDoc={htmlContent}
        title="UI Mockup"
        className="w-full h-96 border-2 border-layer-3 rounded-lg bg-white"
        sandbox="allow-scripts"
      />
      <div className="absolute bottom-2 right-2 bg-layer-1/50 text-secondary text-[10px] font-mono px-2 py-0.5 rounded pointer-events-none">
        Design Principles Assimilated
      </div>
    </div>
  );
};

export default UIMockupViewer;