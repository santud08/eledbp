import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * uploadImage
 * @param req
 * @param res
 */
export const uploadImage = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    const data = [];
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const requestId = req.body.draft_request_id;

    // check for request is present or not with respect to relationID
    const titleRequest = await model.titleRequestPrimaryDetails.findAll({
      where: {
        id: requestId,
        status: "active",
        request_status: "draft",
      },
    });
    if (titleRequest.length > 0) {
      if (req.files.length > 0) {
        for (const imageDetails of req.files) {
          const element = {
            request_id: requestId,
            originalname: imageDetails.originalname ? imageDetails.originalname : "",
            filename: imageDetails.key ? imageDetails.key : "", // for s3 bucket use
            path: imageDetails.path ? imageDetails.path : "",
            size: imageDetails.size ? imageDetails.size : "",
            mime_type: imageDetails.mimetype ? imageDetails.mimetype : "",
            location: imageDetails.location ? imageDetails.location : "",
          };
          data.push(element);
        }
        res.ok({ image_list: data });
      } else {
        res.ok({ image_list: [] });
      }
    }
  } catch (error) {
    next(error);
  }
};
