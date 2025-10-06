// FIX: Removed self-import of 'Sender' which was causing a name conflict.
export type Sender = 'user' | 'ai';

export interface Attachment {
    name: string;
    type: string;
}

export type HuggingFaceDataType = 'modelQuery' | 'modelSearch' | 'spaceInfo';

export interface HuggingFaceResult {
    type: HuggingFaceDataType;
    query: Record<string, any>;
    result: any | null;
    error?: string;
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  attachments?: Attachment[];
  status?: 'generating' | 'complete' | 'error';
  media?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    prompt: string;
    status?: 'generating' | 'complete' | 'error';
  };
  huggingFaceData?: HuggingFaceResult;
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