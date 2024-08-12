import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * editUploadBackgroundImage
 * @param req
 * @param res
 */
export const editUploadBackgroundImage = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const requestId = req.body.draft_request_id ? req.body.draft_request_id : "";
    const siteLanguage = req.body.site_language;

    if (req.file) {
      const imageDetails = req.file;
      const element = {
        request_id: requestId,
        site_language: siteLanguage,
        originalname: imageDetails.originalname,
        filename: imageDetails.key ? imageDetails.key : "", // for s3 bucket use
        path: imageDetails.path ? imageDetails.path : "",
        size: imageDetails.size ? imageDetails.size : "",
        mime_type: imageDetails.mimetype ? imageDetails.mimetype : "",
        location: imageDetails.location ? imageDetails.location : "",
      };
      res.ok({ bg_image_details: element });
    } else {
      res.ok({ bg_image_details: {} });
    }
  } catch (error) {
    next(error);
  }
};
