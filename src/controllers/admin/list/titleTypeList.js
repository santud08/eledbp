import { generalHelper } from "../../../helpers/index.js";

/**
 * titleTypeList
 * @param req
 * @param res
 */
export const titleTypeList = async (req, res, next) => {
  try {
    const typeList = await generalHelper.titleType();
    let retArr = {};
    if (typeList) {
      for (const type in typeList) {
        if (type && typeList[type]) {
          retArr[type] = typeList[type] ? res.__(typeList[type]) : "";
        }
      }
    }
    //add people
    retArr["people"] = res.__("people");

    res.ok({
      type_list: retArr,
    });
  } catch (error) {
    next(error);
  }
};
