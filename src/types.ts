export type UserType = {
  id: string;
  name: string;
  handle: string;
};

export type EventType = {
  id: string;
  users: UserType[];
  title: string;
  description: string;
};

export interface VideoType {
  id: string;
  event?: EventType;
  url: string;
  title: string;
  description: string;
  comments?: string[];
}
