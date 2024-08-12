export const generateOttLogoUrl = async (req, filename) => {
  return (
    (req.headers.referer && req.headers.referer.split(":").length > 0
      ? req.headers.referer.split(":")[0]
      : req.protocol) +
    "://" +
    req.get("host") +
    "/api/v1/public/images/ott/" +
    filename
  );
};
