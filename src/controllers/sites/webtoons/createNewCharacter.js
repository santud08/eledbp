import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * createNewCharacter
 * @param req
 * @param res
 */
export const createNewCharacter = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const requestId = req.body.draft_request_id;
    const siteLanguage = req.body.site_language;
    const creditType = req.body.credit_type;
    const characterName = req.body.character_name;
    const characterDescription = req.body.description ? req.body.description : "";
    const isGuest = req.body.is_guest ? req.body.is_guest : 0;

    // check for request is present or not with respect to relationID
    const titleRequest = await model.titleRequestPrimaryDetails.findOne({
      where: {
        id: requestId,
        status: "active",
        request_status: "draft",
        site_language: siteLanguage,
      },
    });
    if (!titleRequest) throw StatusError.badRequest(res.__("Invalid Request ID"));
    if (titleRequest) {
      const imageDetails = req.file === undefined ? null : req.file;
      if (creditType == "character") {
        const castElement = {
          request_id: requestId,
          credit_type: creditType,
          character_name: characterName,
          is_guest: isGuest,
          description: characterDescription,
          image_originalname: imageDetails != null ? imageDetails.originalname : "",
          image_filename: imageDetails != null && imageDetails.key ? imageDetails.key : "", // for s3 bucket use
          image_path: imageDetails != null && imageDetails.path ? imageDetails.path : "",
          image_size: imageDetails != null && imageDetails.size ? imageDetails.size : "",
          image_mime_type:
            imageDetails != null && imageDetails.mimetype ? imageDetails.mimetype : "",
          image_location:
            imageDetails != null && imageDetails.location ? imageDetails.location : "",
        };
        res.ok({ character_details: castElement });
      }
    }
  } catch (error) {
    next(error);
  }
};
