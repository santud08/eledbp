import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * editCreateNewCredit
 * @param req
 * @param res
 */
export const editCreateNewCredit = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const requestId = req.body.draft_request_id ? req.body.draft_request_id : "";
    const siteLanguage = req.body.site_language;
    const creditType = req.body.credit_type;
    const castName = req.body.cast_name;
    const jobTitle = req.body.job_title;
    const characterName = req.body.character_name;
    const isGuest = req.body.is_guest ? req.body.is_guest : 0;

    const imageDetails = req.file === undefined ? null : req.file;
    if (creditType == "cast") {
      const castElement = {
        site_language: siteLanguage,
        request_id: requestId,
        credit_type: creditType,
        cast_name: castName,
        job_title: jobTitle,
        character_name: characterName,
        is_guest: isGuest,
        image_originalname: imageDetails != null ? imageDetails.originalname : "",
        image_filename: imageDetails != null && imageDetails.key ? imageDetails.key : "", // for s3 bucket use
        image_path: imageDetails != null && imageDetails.path ? imageDetails.path : "",
        image_size: imageDetails != null && imageDetails.size ? imageDetails.size : "",
        image_mime_type: imageDetails != null && imageDetails.mimetype ? imageDetails.mimetype : "",
        image_location: imageDetails != null && imageDetails.location ? imageDetails.location : "",
      };
      res.ok({ credit_details: castElement });
    } else if (creditType == "crew") {
      const crewElement = {
        site_language: siteLanguage,
        request_id: requestId,
        credit_type: creditType,
        cast_name: castName,
        job_title: jobTitle,
        image_originalname: imageDetails != null ? imageDetails.originalname : "",
        image_filename: imageDetails != null && imageDetails.key ? imageDetails.key : "", // for s3 bucket use
        image_path: imageDetails != null && imageDetails.path ? imageDetails.path : "",
        image_size: imageDetails != null && imageDetails.size ? imageDetails.size : "",
        image_mime_type: imageDetails != null && imageDetails.mimetype ? imageDetails.mimetype : "",
        image_location: imageDetails != null && imageDetails.location ? imageDetails.location : "",
      };
      res.ok({ credit_details: crewElement });
    }
  } catch (error) {
    next(error);
  }
};
