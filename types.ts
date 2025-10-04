
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
}
