
import React from 'react';

const GenericFileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" className="m-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const ImageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" className="m-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>
);

const VideoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" className="m-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"></polygon>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
  </svg>
);

const ZipIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" className="m-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2.1-2.4-3.5-4.4-3.5h-1.2v-1.1c0-2.3-1.4-4.2-3.3-4.2-1.1 0-2.2.5-2.8 1.4-1.1-.8-2.5-1.4-4-1.4A4.5 4.5 0 0 0 2 6.5c0 1.4.6 2.6 1.5 3.4-1 .9-1.5 2.2-1.5 3.6 0 2.8 2.2 5 5 5h12c1.7 0 3-1.3 3-3 0-1.2-.8-2.3-1.8-2.7z"></path>
    <path d="M8 17.3l-2.3-2.3"></path><path d="M8 12.7v4.6"></path><path d="M8 15h4"></path><path d="M12 15l2.3 2.3"></path><path d="M12 12.7v4.6"></path><path d="M16 15l-2.3-2.3"></path><path d="M16 12.7v4.6"></path>
  </svg>
);

export const AttachmentIcon: React.FC<{ fileType: string }> = ({ fileType }) => {
  if (fileType.startsWith('image/')) {
    return <ImageIcon />;
  }
  if (fileType.startsWith('video/')) {
    return <VideoIcon />;
  }
  if (fileType.includes('zip') || fileType.includes('compressed') || fileType.includes('archive')) {
    return <ZipIcon />;
  }
  return <GenericFileIcon />;
};