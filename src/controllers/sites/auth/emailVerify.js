import bcrypt from "bcrypt";
import { emailService, userService } from "../../../services/index.js";
import { StatusError, envs } from "../../../config/index.js";
import { generalHelper } from "../../../helpers/index.js";
import { MAIL_TEMPLATE } from "../../../utils/constants.js";

/**
 * emailVerify
 * @param req
 * @param res
 * @param next
 */
export const emailVerify = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const email = reqBody.email;
    const type = !reqBody.type ? "" : reqBody.type; //resend
    const userDetails = await userService.getByEmail(email);
    if (userDetails) throw StatusError.badRequest(res.__("This email is already registered"));
    const verificationCode = await generalHelper.generateRandomAlphanumeric(8);
    //email send
    const templateKey =
      type == "resend" ? "registration_verification_code_resend" : "registration_verification_code";
    await emailService.sendEmail(email, templateKey, "", "", {
      pageTitle: "",
      firstName: email,
      verifyCode: verificationCode,
      thanksFrom: MAIL_TEMPLATE.TAHNKS_FROM,
      address: MAIL_TEMPLATE.ADDRESS,
      telNo: MAIL_TEMPLATE.TEL,
      faxNo: MAIL_TEMPLATE.FAX,
    });

    res.ok({
      message: res.__("Verification code successfully sent to your mail"),
      email: email,
      code: await bcrypt.hash(verificationCode, envs.passwordSalt),
    });
  } catch (error) {
    next(error);
  }
};
