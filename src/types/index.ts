export type APIConfiguration = {
  apiKey?: string;
  url?: string;
  authorizationToken?: string;
};

export type Configuration = {
  domainName?: string;
  ctaList?: Array<string>;
  blackList?: Array<string>;
  bulkData?: boolean;
  apiConfig?: APIConfiguration;
  disable?: boolean;
};
