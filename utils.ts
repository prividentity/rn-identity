export const getQueryParams = (url: string) => {
  const regex = /[?&]([^=#]+)=([^&#]*)/g;
  let params: any = {};
  let match;
  while ((match = regex.exec(url))) {
    params[match[1]] = match[2];
  }

  return params;
};
