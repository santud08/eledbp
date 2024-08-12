import model from "../../models/index.js";
import { customDateTimeHelper } from "../../helpers/index.js";
import { peopleService, titleService } from "../../services/index.js";

export const addPeopleCountry = async (placeOfBirth, peopleId, createdBy, siteLanguage = "en") => {
  try {
    if (placeOfBirth) {
      let actionDate = "";
      let recordId = "";
      const chkPeopleCountry = await model.peopleCountries.findOne({
        attributes: ["id"],
        where: { people_id: peopleId, status: "active" },
      });
      if (chkPeopleCountry) {
        await model.peopleCountries.update(
          {
            birth_place: placeOfBirth,
            site_language: siteLanguage,
            updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
            updated_by: createdBy,
          },
          {
            where: {
              people_id: peopleId,
              status: "active",
            },
          },
        );
        recordId = peopleId;
      } else {
        await model.peopleCountries.create({
          people_id: peopleId,
          birth_place: placeOfBirth,
          site_language: siteLanguage,
          created_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
          created_by: createdBy,
        });
        recordId = peopleId;
      }
      await peopleService.updatePeopleKoreanBirthPlace(peopleId);
      if (recordId)
        await titleService.titleDataAddEditInEditTbl(recordId, "people", createdBy, actionDate);
    }
  } catch (error) {
    console.log(error);
  }
};
