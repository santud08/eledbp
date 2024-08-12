import { generalHelper } from "../../../helpers/index.js";

/**
 * operationTypeList
 * @param req
 * @param res
 */
export const operationTypeList = async (req, res, next) => {
  try {
    const statusList = await generalHelper.operationType();
    let retArr = {};
    if (statusList) {
      for (const subStatus in statusList) {
        if (subStatus && statusList[subStatus]) {
          retArr[subStatus] = statusList[subStatus] ? res.__(statusList[subStatus]) : "";
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
