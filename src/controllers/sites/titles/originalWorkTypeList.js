import { generalHelper } from "../../../helpers/index.js";

/**
 * originalWorkTypeList
 * @param req
 * @param res
 */
export const originalWorkTypeList = async (req, res, next) => {
  try {
    const originalWorkTypeList = await generalHelper.titleOriginalWorkTypeList();
    let retArr = {};
    if (originalWorkTypeList) {
      for (const subList in originalWorkTypeList) {
        if (subList && originalWorkTypeList[subList]) {
          retArr[subList] = originalWorkTypeList[subList]
            ? res.__(originalWorkTypeList[subList])
            : "";
        }
      }
    }
    res.ok({
      original_work_type_list: retArr,
    });
  } catch (error) {
    next(error);
  }
};
