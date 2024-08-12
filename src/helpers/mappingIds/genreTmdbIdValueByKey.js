import { mappingIdsHelper } from "../index.js";

export const genreTmdbIdValueByKey = async (tmdbGenreId) => {
  const idObj = await mappingIdsHelper.genreTmdbIdMappings();
  let retStr = "";
  if (tmdbGenreId && idObj && idObj[tmdbGenreId] != undefined) {
    retStr = idObj[tmdbGenreId];
  }
  return retStr;
};
