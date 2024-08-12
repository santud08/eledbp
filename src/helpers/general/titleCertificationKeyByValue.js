import { generalHelper } from "../../helpers/index.js";

export const titleCertificationKeyByValue = async (type, text) => {
  const certificationObj = await generalHelper.titleCertificationList(type);
  let retStr = "";
  if (text && certificationObj && certificationObj != "undefined" && certificationObj != null) {
    retStr = Object.keys(certificationObj).find((key) => certificationObj[key] == text);
  }
  return retStr;
};
