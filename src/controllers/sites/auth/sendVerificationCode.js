import { emailService, userService } from "../../../services/index.js";
import { StatusError } from "../../../config/index.js";
import { generalHelper, customDateTimeHelper } from "../../../helpers/index.js";
import model from "../../../models/index.js";
import { MAIL_TEMPLATE } from "../../../utils/constants.js";

/* *
 * Sending verification code to user's email
 * @param req
 * @param res
 * @param next
 */
export const sendVerificationCodeToEmail = async (req, res, next) => {
  try {
    const email = req.body.email;
    const userDetails = await userService.getByEmail(email);
    if (!userDetails) throw StatusError.badRequest({ email: res.__("email does not exists") });
    else {
      const verificationCode = await generalHelper.generateRandomAlphanumeric(8);
      const userFirstName = userDetails.first_name;

      //inserting verification code
      const result = await model.user.update(
        {
          reset_password_code: verificationCode,
          reset_password_code_exp: await customDateTimeHelper.getDateFromCurrentDate(
            "add",
            180,
            "second",
            null,
            "YYYY-MM-DD HH:mm:ss",
          ),
          updated_by: userDetails.id,
          updated_at: await customDateTimeHelper.getCurrentDateTime(),
        },
        { where: { id: userDetails.id } },
      );
      //email send
      if (result && result.length > 0) {
        await emailService.sendEmail(email, "reset_password", "", "", {
          firstName: userFirstName,
          resetCode: verificationCode,
          supportMail: MAIL_TEMPLATE.SUPPORT_MAIL,
          thanksFrom: MAIL_TEMPLATE.TAHNKS_FROM,
          address: MAIL_TEMPLATE.ADDRESS,
          telNo: MAIL_TEMPLATE.TEL,
          faxNo: MAIL_TEMPLATE.FAX,
        });
        res.ok({
          message: res.__("success"),
        });
      } else {
        throw StatusError.badRequest({ userId: res.__("userIdNotExists") });
      }
    }
  } catch (error) {
    next(error);
  }
};
