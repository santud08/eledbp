/*
 *to genarate the webtoons channel logo url
 */

export const generateWtLogoUrl = async (req, filename) => {
  return (
    (req.headers.referer && req.headers.referer.split(":").length > 0
      ? req.headers.referer.split(":")[0]
      : req.protocol) +
    "://" +
    req.get("host") +
    "/api/v1/public/images/wt-channel/" +
    filename
  );
};
