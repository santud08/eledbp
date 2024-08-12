import { customDateTimeHelper } from "../../../helpers/index.js";

import models from "../../../models/index.js";
import { tmdbService } from "../../../services/index.js";
import { consoleColors } from "../../../utils/constants.js";

/**
 * migrateCountries
 * @param req
 * @param res
 */
export const migrateCountries = async (req, res, next) => {
  try {
    const language = ["en", "ko"];
    const requestedLanguage = req.body.language ? req.body.language : "en";
    const countryData = await tmdbService.fetchTmdbCountries(requestedLanguage);
    if (countryData && countryData.length > 0) {
      for (const eachCountry of countryData) {
        if (eachCountry) {
          const country = eachCountry.english_name;
          const countryCode = eachCountry.iso_3166_1;
          const countryNativeName = eachCountry.native_name;
          console.log(
            `${consoleColors.fg.green} Start with Country: ${country} \n ${consoleColors.reset}`,
          );
          const getCountry = await models.country.findOne({
            where: { country_name: country, country_code: countryCode, status: "active" },
            raw: true,
          });
          let countryId = "";
          if (getCountry) {
            countryId = getCountry.id;
            console.log(
              `${consoleColors.fg.magenta} Country Already Present: ${country} \n ${consoleColors.reset}`,
            );
          } else {
            console.log(
              `${consoleColors.fg.yellow} New Country Found To Insert : ${country} \n ${consoleColors.reset}`,
            );
            const conData = {
              country_name: country,
              country_code: countryCode,
              status: "active",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
            };
            const insCountry = await models.country.create(conData);
            if (insCountry && insCountry.id) {
              countryId = insCountry.id;
              console.log(
                `${consoleColors.fg.green} Country Inserted : ${country} \n ${consoleColors.reset}`,
              );
            } else {
              console.log(
                `${consoleColors.fg.red} Country Insertion Error : ${country} \n ${consoleColors.reset}`,
              );
            }
          }
          if (countryId) {
            if (language) {
              for (const eachLan of language) {
                if (eachLan) {
                  const countryName = eachLan == requestedLanguage ? countryNativeName : country;
                  const getCountryTraslation = await models.countryTranslation.findOne({
                    where: {
                      country_name: countryName,
                      country_id: countryId,
                      site_language: eachLan,
                      status: "active",
                    },
                    raw: true,
                  });
                  if (getCountryTraslation) {
                    console.log(
                      `${consoleColors.fg.magenta} Country Translation (${eachLan}) Already Present: ${countryName} \n ${consoleColors.reset}`,
                    );
                  } else {
                    console.log(
                      `${consoleColors.fg.yellow} Country Translation (${eachLan}) Found To Insert : ${countryName} \n ${consoleColors.reset}`,
                    );
                    const countryTData = {
                      country_id: countryId,
                      country_name: countryName,
                      site_language: eachLan,
                      status: "active",
                      created_at: await customDateTimeHelper.getCurrentDateTime(),
                    };
                    const insCountryTrans = await models.countryTranslation.create(countryTData);
                    if (insCountryTrans) {
                      console.log(
                        `${consoleColors.fg.green} Country Translation (${eachLan}) Inserted : ${countryName} \n ${consoleColors.reset}`,
                      );
                    } else {
                      console.log(
                        `${consoleColors.fg.red} Country Translation (${eachLan}) Insertion Error : ${countryName} \n ${consoleColors.reset}`,
                      );
                    }
                  }
                }
              }
            }
          }
          console.log(
            `${consoleColors.fg.green} End of Country: ${country} --- \n ${consoleColors.reset}`,
          );
        }
      }
    }
    res.ok({
      message: res.__("success"),
      list: countryData,
    });
  } catch (error) {
    next(error);
  }
};
