import { esService } from "../../../services/index.js";

/**
 * esGetIndexData
 * @param req
 * @param res
 */

export const esGetIndexData = async (req, res, next) => {
  try {
    const searchIndex = req.query.search_index ? req.query.search_index : "";
    const raw = !req.query.raw ? "false" : req.query.raw;
    const from = req.query.from ? req.query.from : 0;
    const size = req.query.size ? req.query.size : 100;
    let indexData = {};
    if (searchIndex) {
      indexData = await esService.getIndicesData({ search_index: searchIndex, from, size });
      if (raw == "false") {
        indexData = indexData && indexData.hits ? indexData.hits.hits : [];
      }
    } else {
      const indexNames = await esService.getIndices();
      if (indexNames && indexNames.length > 0) {
        for (const iname of indexNames) {
          if (iname) {
            indexData[iname] = await esService.getIndicesData({ search_index: iname, from, size });
            if (raw == "false") {
              indexData[iname] =
                indexData && indexData[iname] && indexData[iname].hits
                  ? indexData[iname].hits.hits
                  : [];
            }
          }
        }
      }
    }
    res.ok({ results: indexData });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
