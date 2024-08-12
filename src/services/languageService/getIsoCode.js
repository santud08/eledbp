import model from "../../models/index.js";

export const getIsoCode = async (language = "en") => {
  const result = await model.localization.findOne({
    where: { code: language },
  });
  return result && result != "undefined" && result != null ? result.iso : "";
};
