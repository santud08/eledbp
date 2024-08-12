import { generalHelper } from "../../../helpers/index.js";

/**
 * weekdaysList
 * @param req
 * @param res
 */
export const weekdaysList = async (req, res, next) => {
  try {
    const weekdaysList = await generalHelper.weekdaysList();
    let retArr = {};
    if (weekdaysList) {
      for (const subList in weekdaysList) {
        if (subList && weekdaysList[subList]) {
          retArr[subList] = weekdaysList[subList] ? res.__(weekdaysList[subList]) : "";
        }
      }
    }
    res.ok({
      weekdays_list: retArr,
    });
  } catch (error) {
    next(error);
  }
};
