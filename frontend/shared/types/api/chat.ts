export type ChatTokenResponse = {
  apiKey: string;
  appId: string | null;
  token: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
  defaultChannel: {
    type: string;
    id: string;
  };
};

export type VideoTokenResponse = {
  apiKey: string;
  appId: string | null;
  token: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
  call: {
    type: string;
    id: string;
  };
};
