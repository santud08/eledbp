import { celebrate, Joi } from "celebrate";
import { validationHelper } from "../../../helpers/index.js";
export const settingPassword = celebrate({
  body: Joi.object({
    user_id: Joi.number().required(),
    verification_code: Joi.string().required(),
    password: Joi.string()
      .required()
      .min(8)
      .max(15)
      .custom((value) => {
        const validateRes = validationHelper.adminPasswordRule(value);
        if (validateRes === true) {
          return value;
        } else {
          throw new Error(`${validateRes}`);
        }
      }),
  }),
});
