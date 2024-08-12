import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * editCreateNewCharacter
 * @param req
 * @param res
 */
export const editCreateNewCharacter = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const titleId = req.body.title_id;
    const creditType = req.body.credit_type;
    const characterName = req.body.character_name;
    const characterDescription = req.body.description ? req.body.description : "";
    const isGuest = req.body.is_guest ? req.body.is_guest : 0;

    const imageDetails = req.file === undefined ? null : req.file;

    const castElement = {
      title_id: titleId,
      credit_type: creditType,
      character_name: characterName,
      is_guest: isGuest,
      description: characterDescription,
      image_originalname: imageDetails != null ? imageDetails.originalname : "",
      image_filename: imageDetails != null && imageDetails.key ? imageDetails.key : "", // for s3 bucket use
      image_path: imageDetails != null && imageDetails.path ? imageDetails.path : "",
      image_size: imageDetails != null && imageDetails.size ? imageDetails.size : "",
      image_mime_type: imageDetails != null && imageDetails.mimetype ? imageDetails.mimetype : "",
      image_location: imageDetails != null && imageDetails.location ? imageDetails.location : "",
    };
    res.ok({ character_details: castElement });
  } catch (error) {
    next(error);
  }
};
