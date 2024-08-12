import model from "../../models/index.js";

/**
 * countryFormat
 * @param titleId
 * @param titleType
 * @param countryData // Country details that are from TMDB response
 * @param language
 * @param seasonId
 */

export const countryFormat = async (
  titleId,
  titleType,
  countryData,
  language = "en",
  seasonId = null,
) => {
  try {
    let countryResponse = [];
    const titleValid = await model.title.findOne({
      where: {
        id: titleId,
        type: titleType,
        record_status: "active",
      },
    });
    if (titleValid) {
      if (countryData != "" && countryData.length > 0) {
        for (const code of countryData) {
          if (code) {
            const countryDetails = await model.country.findOne({
              attributes: ["id"],
              where: {
                country_code: code.iso_3166_1,
              },
              include: [
                {
                  model: model.countryTranslation,
                  attributes: ["country_id", "country_name"],
                  left: true,
                  where: {
                    status: "active",
                    site_language: language,
                  },
                },
              ],
            });
            if (countryDetails) {
              const element = {
                country_id: countryDetails.id,
                country_name:
                  countryDetails.countryTranslations &&
                  countryDetails.countryTranslations[0] &&
                  countryDetails.countryTranslations[0].country_name
                    ? countryDetails.countryTranslations[0].country_name
                    : "",
              };
              // check for alteady existing country id
              const countryId = await model.titleCountries.findOne({
                attributes: ["id", "title_id", "country_id"],
                where: { title_id: titleId, country_id: countryDetails.id, status: "active" },
              });
              element.id = countryId && countryId.id ? countryId.id : "";

              countryResponse.push(element);
            }
          }
        }
      }

      return { countryList: countryResponse };
    } else {
      return { countryList: [] };
    }
  } catch (e) {
    console.log("error", e);
    return { countryList: [] };
  }
};
