import model from "../../models/index.js";
import { customDateTimeHelper } from "../../helpers/index.js";
import { titleService } from "../../services/index.js";

/**
 * addCountryDetails
 * @param details
 */
export const addCountryDetails = async (titleId, dataArr, userId) => {
  try {
    if (dataArr.length > 0) {
      let actionDate = "";
      let recordId = "";
      for (const value of dataArr) {
        if (value) {
          const findCountryId = await model.country.findOne({
            attributes: ["id"],
            where: { status: "active" },
            include: [
              {
                model: model.countryTranslation,
                attributes: ["id", "country_id"],
                where: { country_name: value, status: "active" },
                required: true,
              },
            ],
          });
          if (findCountryId) {
            const countryId = findCountryId.id;
            const titleCountries = {
              title_id: titleId,
              country_id: countryId,
              site_language: "en",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };
            await model.titleCountries.create(titleCountries);
            actionDate = titleCountries.created_at;
            recordId = titleId;
          }
        }
      }
      if (recordId)
        await titleService.titleDataAddEditInEditTbl(recordId, "title", userId, actionDate);
    }
  } catch (error) {
    return { results: {} };
  }
};
