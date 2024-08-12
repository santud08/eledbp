import models from "../../models/index.js";

export const getCountryIdByCode = async (countryCode) => {
  const result = await models.country.findOne({
    attributes: ["id"],
    where: { country_code: countryCode },
  });
  return result && result.id ? result.id : null;
};
