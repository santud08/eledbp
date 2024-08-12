import { agencyService } from "../../services/index.js";

export const generateAgencyCode = async (stringLen = 5, padString = "0") => {
  let agencyCode = "";
  let lastId = 0;
  const getLastId = await agencyService.getLastAgencyId();
  if (typeof getLastId != "undefined" && getLastId != null) {
    lastId = getLastId.id;
  }
  const newId = Math.floor(lastId + 1 + 10000 + Math.random() * 99999);
  agencyCode = newId.toString().padStart(stringLen, padString);
  return "A" + agencyCode;
};
