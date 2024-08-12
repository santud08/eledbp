import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";

/**
 * saveUserDetails
 * @param req
 * @param res
 */
export const saveUserDetails = async (req, res, next) => {
  try {
    const userLogId = req.userDetails.userId ? req.userDetails.userId : null;
    if (!userLogId) throw StatusError.badRequest(res.__("Invalid user id"));

    const reqBody = req.body;
    const userId = reqBody.user_id;
    const fullName = reqBody.user_name;
    const userEmail = reqBody.user_email;
    const isDeleteImage = reqBody.is_delete_image;
    const defaultLanguage = reqBody.user_default_language;

    const firstName = fullName.substring(0, fullName.indexOf(" "))
      ? fullName.substring(0, fullName.indexOf(" "))
      : fullName.substring(fullName.indexOf(" ") + 1);
    const lastName = !fullName.substring(0, fullName.indexOf(" "))
      ? ""
      : fullName.substring(fullName.indexOf(" ") + 1);

    // check for user existance in user table
    const userDetails = await model.user.findOne({
      where: { id: userId, email: userEmail, status: "active" },
    });

    if (!userDetails) throw StatusError.badRequest(res.__("user is not registered"));

    let data = {
      first_name: firstName,
      last_name: lastName,
      language: defaultLanguage,
      updated_at: await customDateTimeHelper.getCurrentDateTime(),
      updated_by: userId,
    };

    // 1. to delete image isDeleteImage = y and profile image is blank
    // 2. to update image isDeleteImage = n and profile image is not blank
    // 3. to update only content isDeleteImage = n and profile image is blank
    if (isDeleteImage === "y" && !req.file) {
      // update user table
      data.avatar = null;
    } else if (isDeleteImage === "n" && req.file) {
      // update user table
      data.avatar = req.file.location;
    } else if (isDeleteImage === "n" && !req.file) {
      // update user table
    }
    if (data) {
      await model.user
        .update(data, { where: { id: userId, email: userEmail, status: "active" } })
        .then(() => {
          res.ok({
            message: res.__("user details updated successfully"),
          });
        })
        .catch(() => {
          throw StatusError.serverError(res.__("something went wrong"));
        });
    } else {
      throw StatusError.serverError(res.__("something went wrong"));
    }
  } catch (error) {
    next(error);
  }
};
