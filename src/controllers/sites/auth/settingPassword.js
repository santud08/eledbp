import bcrypt from "bcrypt";
import { StatusError } from "../../../config/index.js";
import { envs } from "../../../config/index.js";
import model from "../../../models/index.js";
const { user } = model;

/* *
 * settingPassword
 * Checking verification code to user's email
 * @param req
 * @param res
 * @param next
 */

export const settingPassword = async (req, res, next) => {
  try {
    const userId = req.body.user_id;
    const verificationCode = req.body.verification_code;
    const userDetails = await user.findOne({
      where: { id: userId, status: "active", reset_password_code: verificationCode },
    });
    if (!userDetails) throw StatusError.badRequest("invalidId");
    const password = await bcrypt.hash(req.body.password, envs.passwordSalt);
    const result = await user.update(
      { password: password, reset_password_code: null, reset_password_code_exp: null },
      { where: { id: userId } },
    );
    if (result && result.length > 0) {
      res.ok({
        message: res.__("success"),
      });
    } else {
      throw StatusError.serverError("serverError");
    }
  } catch (error) {
    next(error);
  }
};
