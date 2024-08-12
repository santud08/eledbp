import { esService } from "../../../services/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * esDeleteIndex
 * @param req
 * @param res
 */

export const esDeleteIndex = async (req, res, next) => {
  try {
    const searchIndex = req.body.index_name ? req.body.index_name : "";
    if (searchIndex) {
      const resData = await esService.deleteIndices(searchIndex);
      if (resData && resData.status == "success") {
        res.ok({ message: res.__("index name is deleted succesfully") });
      } else {
        if (resData.status == "sys_error") {
          throw StatusError.badRequest(res.__("System error"));
        } else {
          throw StatusError.badRequest(res.__(resData.error));
        }
      }
    } else {
      throw StatusError.badRequest(res.__("index name is required"));
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};
