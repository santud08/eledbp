import { generalHelper } from "../../helpers/index.js";

export const titleStatusKeyByValue = async (type, text) => {
  const statusObj = await generalHelper.titleStatus(type);
  let retStr = "";
  if (text && statusObj && statusObj != "undefined" && statusObj != null) {
    retStr = Object.keys(statusObj).find((key) => statusObj[key] === text);
  }
  return retStr;
};
