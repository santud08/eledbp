import { generalHelper } from "../../../helpers/index.js";

/**
 * certificationList
 * @param req
 * @param res
 */
export const certificationList = async (req, res, next) => {
  try {
    const reqBody = req.query;
    const type = reqBody.type ? reqBody.type : null;
    const certificationList = await generalHelper.titleCertificationList(type);
    let retArr = {};
    if (certificationList) {
      if (type) {
        for (const certification in certificationList) {
          if (
            certification &&
            certificationList[certification] &&
            Number.isInteger(certificationList[certification]) == true
          ) {
            retArr[certification] = certificationList[certification];
          } else if (
            certification &&
            certificationList[certification] &&
            Number.isInteger(certificationList[certification]) == false
          ) {
            retArr[certification] = certificationList[certification]
              ? res.__(certificationList[certification])
              : "";
          }
        }
      } else {
        for (const eachcertification in certificationList) {
          retArr[eachcertification] = retArr[eachcertification] ? retArr[eachcertification] : {};
          if (eachcertification && certificationList[eachcertification]) {
            for (const certification in certificationList[eachcertification]) {
              if (
                certification &&
                certificationList[eachcertification][certification] &&
                Number.isInteger(certificationList[eachcertification]) == true
              ) {
                retArr[eachcertification][certification] =
                  certificationList[eachcertification][certification];
              }
              if (
                certification &&
                certificationList[eachcertification][certification] &&
                Number.isInteger(certificationList[eachcertification]) == false
              ) {
                retArr[eachcertification][certification] = certificationList[eachcertification][
                  certification
                ]
                  ? res.__(certificationList[eachcertification][certification])
                  : "";
              }
            }
          }
        }
      }
    }
    res.ok({
      certification_list: retArr,
    });
  } catch (error) {
    next(error);
  }
};
