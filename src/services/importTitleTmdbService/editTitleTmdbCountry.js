import model from "../../models/index.js";
import { customDateTimeHelper } from "../../helpers/index.js";
import { countryService } from "../../services/index.js";
import { titleService } from "../../services/index.js";

export const editTitleTmdbCountry = async (data, titleId, createdBy, siteLanguage = "en") => {
  try {
    if (data && data != null && data.length > 0) {
      let actionDate = "";
      let recordId = "";
      for (const country of data) {
        const countryId = country.iso_3166_1
          ? await countryService.getCountryIdByCode(country.iso_3166_1)
          : "";
        if (countryId) {
          const getCountry = await model.titleCountries.findOne({
            attributes: ["id"],
            where: {
              title_id: titleId,
              country_id: countryId,
              site_language: siteLanguage,
            },
          });
          if (!getCountry) {
            const createCountryData = {
              title_id: titleId,
              country_id: countryId,
              site_language: siteLanguage,
              created_by: createdBy,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
            };
            await model.titleCountries.create(createCountryData);
            actionDate = createCountryData.created_at;
            recordId = titleId;
          }
        }
      }
      if (recordId)
        await titleService.titleDataAddEditInEditTbl(recordId, "title", createdBy, actionDate);
    }
  } catch (error) {
    console.log(error);
  }
};
