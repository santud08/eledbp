import { userService } from "../../../services/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";

/* *
 * Checking verification code to user's email
 * @param req
 * @param res
 * @param next
 */

export const checkVerificationCode = async (req, res, next) => {
  try {
    const email = req.body.email;
    const verificationCode = req.body.verification_code;
    const curTime = await customDateTimeHelper.getCurrentDateTime();
    const userDetails = await userService.getByEmail(email);
    if (!userDetails) throw StatusError.badRequest({ email: res.__("email does not exists") });
    if (new Date(curTime) > new Date(userDetails.reset_password_code_exp)) {
      throw StatusError.badRequest({
        verification_code: res.__("please use the verification code within 180 seconds"),
      });
    }
    if (verificationCode == userDetails.reset_password_code) {
      res.ok({
        message: res.__("success"),
        user_id: userDetails.id,
      });
    } else {
      throw StatusError.badRequest({
        verification_code: res.__("incorrectVerificationCode"),
      });
    }
  } catch (error) {
    next(error);
  }
};
