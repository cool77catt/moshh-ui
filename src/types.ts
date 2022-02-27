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

export type VideoType = {
  id: string;
  event: EventType | undefined;
  url: string;
  title: string;
  description: string;
};
