import { generalHelper } from "../../../helpers/index.js";

/**
 * prioritySetList
 * @param req
 * @param res
 */
export const prioritySetList = async (req, res, next) => {
  try {
    let retArr = {};
    const setList = await generalHelper.prioritySetList();
    if (setList) {
      for (const subList in setList) {
        if (subList && setList[subList]) {
          retArr[subList] = setList[subList] ? res.__(setList[subList]) : "";
        }
      }
    }
    res.ok({
      results: retArr,
    });
  } catch (error) {
    next(error);
  }
};
