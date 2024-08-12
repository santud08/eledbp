import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * editUploadPeopleBackgroundImage
 * @param req
 * @param res
 */
export const editUploadPeopleBackgroundImage = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    const data = [];
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const requestId = req.body.draft_request_id ? req.body.draft_request_id : "";
    const peopleId = req.body.people_id;

    const peopleDetails = await model.people.findOne({
      where: { id: peopleId, status: "active" },
    });

    if (!peopleDetails) throw StatusError.badRequest(res.__("Invalid People Id"));

    if (req.file) {
      const imageDetails = req.file;
      const element = {
        people_id: peopleId,
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
    res.ok({ bg_image_details: data });
  } catch (error) {
    next(error);
  }
};
