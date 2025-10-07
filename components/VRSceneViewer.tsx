import React from 'react';

interface VRSceneViewerProps {
  sceneHtml?: string;
}

const VRSceneViewer: React.FC<VRSceneViewerProps> = ({ sceneHtml }) => {
  if (!sceneHtml) {
    return null;
  }

  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://aframe.io/releases/1.5.0/aframe.min.js"></script>
      </head>
      <body style="margin: 0; overflow: hidden;">
        ${sceneHtml}
      </body>
    </html>
  `;

  return (
    <iframe
      srcDoc={srcDoc}
      title="VR Scene"
      className="w-full aspect-video border-2 border-layer-3 rounded-lg bg-black"
      allow="fullscreen; vr"
      sandbox="allow-scripts"
    />
  );
};

export default VRSceneViewer;