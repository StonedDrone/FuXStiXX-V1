export type Sender = 'user' | 'ai';

export interface Attachment {
    name: string;
    type: string;
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  attachments?: Attachment[];
  media?: {
    type: 'image' | 'video';
    url: string;
    prompt: string;
    status?: 'generating' | 'complete' | 'error';
  };
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  albumArtUrl: string;
  audioSrc: string;
  playCount: number;
  lastPlayed: string | null;
}