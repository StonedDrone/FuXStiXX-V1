import React from 'react';

interface CreativeCodeViewerProps {
  sketchJs?: string;
}

const CreativeCodeViewer: React.FC<CreativeCodeViewerProps> = ({ sketchJs }) => {
  if (!sketchJs) {
    return null;
  }

  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
        <style>
          html, body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: #111;
          }
        </style>
      </head>
      <body>
        <script>
          ${sketchJs}
        </script>
      </body>
    </html>
  `;

  return (
    <iframe
      srcDoc={srcDoc}
      title="Creative Code Sketch"
      className="w-full aspect-square max-w-sm border-2 border-layer-3 rounded-lg bg-layer-1"
      sandbox="allow-scripts"
    />
  );
};

export default CreativeCodeViewer;