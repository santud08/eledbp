import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * uploadBackgroundImage
 * @param req
 * @param res
 */
export const uploadBackgroundImage = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const requestId = req.body.draft_request_id;
    const siteLanguage = req.body.site_language;

    // check for request is present or not with respect to relationID
    const titleRequest = await model.titleRequestPrimaryDetails.findAll({
      where: {
        id: requestId,
        status: "active",
        request_status: "draft",
        site_language: siteLanguage,
      },
    });
    if (!titleRequest) throw StatusError.badRequest(res.__("Invalid Request ID"));

    if (titleRequest.length > 0) {
      if (req.file) {
        const imageDetails = req.file;
        const element = {
          request_id: requestId,
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
    }
  } catch (error) {
    next(error);
  }
};
