import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * editUploadPosterImage
 * @param req
 * @param res
 */
export const editUploadPosterImage = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    const data = [];
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const requestId = req.body.draft_request_id ? req.body.draft_request_id : "";
    const isMainPoster = req.body.is_main_poster ? req.body.is_main_poster : "n";
    // check for request is present or not with respect to relationID

    if (req.file) {
      const imageDetails = req.file;
      const element = {
        request_id: requestId,
        originalname: imageDetails.originalname,
        filename: imageDetails.key ? imageDetails.key : "", // for s3 bucket use
        path: imageDetails.path ? imageDetails.path : "",
        size: imageDetails.size ? imageDetails.size : "",
        is_main_poster: isMainPoster,
        mime_type: imageDetails.mimetype ? imageDetails.mimetype : "",
        location: imageDetails.location ? imageDetails.location : "",
      };
      data.push(element);
      res.ok({ poster_image_list: data });
    } else {
      res.ok({ poster_image_list: [] });
    }
  } catch (error) {
    next(error);
  }
};
