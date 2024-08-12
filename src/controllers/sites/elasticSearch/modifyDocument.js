import { esService } from "../../../services/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * modifyDocument
 * @param req
 * @param res
 */

export const modifyDocument = async (req, res, next) => {
  try {
    const type = req.body.type ? req.body.type : "";
    const id = req.body.id ? req.body.id : "";
    const action = req.body.action ? req.body.action : "";

    let indexName = "";
    let responseMessage = "";

    if (action == "add") {
      const addedDoc = await esService.esSchedularAddUpdate(id, type, action);
      responseMessage = addedDoc;
    }

    if (action == "delete") {
      if (type == "movie") {
        indexName = "search-movie";
      } else if (type == "tv") {
        indexName = "search-tv";
      } else if (type == "webtoons") {
        indexName = "search-webtoons";
      } else if (type == "people") {
        indexName = "search-people";
      } else if (type == "tag") {
        indexName = "search-tag";
      } else if (type == "company") {
        indexName = "search-company";
      } else if (type == "award") {
        indexName = "search-award";
      } else if (type == "video") {
        indexName = "search-video";
      } else {
        throw StatusError.badRequest(res.__("Invalid Type"));
      }
      const deleteDoc = await esService.deleteDocument(id, indexName);

      responseMessage = deleteDoc;
    }

    res.ok({
      message: responseMessage,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
