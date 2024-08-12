import { generalHelper } from "../../../helpers/index.js";

/**
 * genderList
 * @param req
 * @param res
 */
export const genderList = async (req, res, next) => {
  try {
    const genderDropdownList = await generalHelper.genderList();
    let retArr = {};
    if (genderDropdownList) {
      for (const subList in genderDropdownList) {
        if (subList && genderDropdownList[subList]) {
          retArr[subList] = genderDropdownList[subList] ? res.__(genderDropdownList[subList]) : "";
        }
      }
    }
    res.ok({
      gender_list: retArr,
    });
  } catch (error) {
    next(error);
  }
};
