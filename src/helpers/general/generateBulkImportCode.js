import { bulkImportService } from "../../services/index.js";

export const generateBulkImportCode = async (type, stringLen = 5, padString = "0") => {
  let agencyCode = "";
  let lastId = 0;
  const getLastId = await bulkImportService.getLastBulkImportId();
  if (getLastId !== null && getLastId !== "" && typeof getLastId != "undefined") {
    lastId = getLastId.id;
  }
  const newId = Math.floor(lastId + 1 + 10000 + Math.random() * 99999);
  agencyCode = newId.toString().padStart(stringLen, padString);
  let codeType = "";
  if (type == "movie") codeType = "M";
  if (type == "tv") codeType = "T";
  if (type == "people") codeType = "P";
  return `E${codeType}${agencyCode}`;
};
