import { generalHelper } from "../../../helpers/index.js";

/**
 * titleSearchByList
 * @param req
 * @param res
 */
export const titleSearchByList = async (req, res, next) => {
  try {
    const type = req.query.type ? req.query.type : "";
    const searchByList = await generalHelper.titleSearchByList(type);
    let retArr = {};
    if (searchByList) {
      for (const subList in searchByList) {
        if (subList && searchByList[subList]) {
          retArr[subList] = searchByList[subList] ? res.__(searchByList[subList]) : "";
        }
      }
    }
    res.ok({
      search_by_list: retArr,
    });
  } catch (error) {
    next(error);
  }
};
