import { generalHelper } from "../../../helpers/index.js";
/**
 * User can type with details
 * @param req
 * @param res
 * @param next
 */
export const type = async (req, res, next) => {
  try {
    const typeList = await generalHelper.contactUsTypeList();
    let retArr = {};
    if (typeList) {
      for (const subList in typeList) {
        if (subList && typeList[subList]) {
          retArr[subList] = typeList[subList] ? res.__(typeList[subList]) : "";
        }
      }
    }
    res.ok({
      type_list: retArr,
    });
  } catch (error) {
    next(error);
  }
};
