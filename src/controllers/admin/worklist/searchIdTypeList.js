import { generalHelper } from "../../../helpers/index.js";

/**
 * searchIdTypeList
 * @param req
 * @param res
 */
export const searchIdTypeList = async (req, res, next) => {
  try {
    const typeDropdownList = await generalHelper.worklistSearchIdTypeList();
    let retArr = {};
    if (typeDropdownList) {
      for (const subList in typeDropdownList) {
        if (subList && typeDropdownList[subList]) {
          retArr[subList] = typeDropdownList[subList] ? res.__(typeDropdownList[subList]) : "";
        }
      }
    }
    res.ok({
      result: retArr,
    });
  } catch (error) {
    next(error);
  }
};
