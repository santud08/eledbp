import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";
import bcrypt from "bcrypt";
import { envs } from "../../../config/index.js";

/**
 * userChangePassword
 * @param req
 * @param res
 */
export const userChangePassword = async (req, res, next) => {
  try {
    const userLogId = req.userDetails.userId ? req.userDetails.userId : null;
    if (!userLogId) throw StatusError.badRequest(res.__("Invalid user id"));

    const reqBody = req.body;
    const userId = reqBody.user_id;
    const oldPassword = reqBody.old_password ? reqBody.old_password : "";
    const newPassword = reqBody.new_password;
    const confirmPassword = reqBody.confirm_password;

    // checking for user existance
    const userDetails = await model.user.findOne({ where: { id: userId, status: "active" } });
    if (!userDetails) throw StatusError.badRequest(res.__("user is not registered"));

    // if old password is given
    if (userDetails && oldPassword) {
      // comparing the password:
      const isSame = await bcrypt.compare(oldPassword, userDetails.password);
      if (!isSame) throw StatusError.badRequest(res.__("Password does not match"));
    }

    if (newPassword == confirmPassword) {
      const password = await bcrypt.hash(newPassword, envs.passwordSalt);
      const result = await model.user.update(
        {
          password: password,
          updated_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_by: userId,
        },
        { where: { id: userId, status: "active" } },
      );

      if (result && result.length > 0) {
        res.ok({
          message: res.__("password updated successfully"),
        });
      } else {
        throw StatusError.serverError(res.__("something went wrong"));
      }
    } else {
      throw StatusError.badRequest(res.__("invalid inputs"));
    }
  } catch (error) {
    next(error);
  }
};
