import { importTmdbDataService } from "../../../services/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";

/**
 * used for developer purpose to update the data
 * only run when its required with proper information
 */

export const updatePeopleCountry = async (req, res, next) => {
  try {
    const offset = req.body.offset ? parseInt(req.body.offset) : 0;
    const limit = req.body.limit ? parseInt(req.body.limit) : 10;
    const langEn = "en";
    const langKo = "ko";
    await importTmdbDataService.importPeopleCountryData(offset, limit, langEn, langKo);
    const finshAt = await customDateTimeHelper.getCurrentDateTime();
    console.log("updatePeopleCountry at: ", finshAt);
    res.ok({
      message: "success",
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
