import { generalHelper } from "../../../helpers/index.js";

/**
 * searchTypeList
 * @param req
 * @param res
 */
export const searchTypeList = async (req, res, next) => {
  try {
    const typeDropdownList = await generalHelper.worklistSearchTypeList();
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
