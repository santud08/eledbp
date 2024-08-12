import { generalHelper } from "../../../helpers/index.js";

/**
 * titleStatusList
 * @param req
 * @param res
 */
export const titleStatusList = async (req, res, next) => {
  try {
    const reqBody = req.query;
    const type = reqBody.type ? reqBody.type : null;
    const statusList = await generalHelper.titleStatus(type);
    let retArr = {};
    if (statusList) {
      if (type) {
        for (const subStatus in statusList) {
          if (subStatus && statusList[subStatus]) {
            retArr[subStatus] = statusList[subStatus] ? res.__(statusList[subStatus]) : "";
          }
        }
      } else {
        for (const eachStatus in statusList) {
          retArr[eachStatus] = retArr[eachStatus] ? retArr[eachStatus] : {};
          if (eachStatus && statusList[eachStatus]) {
            for (const subStatus in statusList[eachStatus]) {
              if (subStatus && statusList[eachStatus][subStatus]) {
                retArr[eachStatus][subStatus] = statusList[eachStatus][subStatus]
                  ? res.__(statusList[eachStatus][subStatus])
                  : "";
              }
            }
          }
        }
      }
    }
    res.ok({
      status_list: retArr,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
