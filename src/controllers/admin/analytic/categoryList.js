import { generalHelper } from "../../../helpers/index.js";

/**
 * categoryList
 * for filter
 * @param req
 * @param res
 */
export const categoryList = async (req, res, next) => {
  try {
    const reqBody = req.query;
    const section = reqBody.section ? reqBody.section : "community_report";
    const typeDropdownList = await generalHelper.analytiFilterCategoryList(section);
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
