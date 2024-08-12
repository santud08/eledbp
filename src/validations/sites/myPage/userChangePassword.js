import { celebrate, Joi } from "celebrate";
import { validationHelper } from "../../../helpers/index.js";
export const userChangePassword = celebrate({
  body: Joi.object({
    user_id: Joi.number().required(),
    old_password: Joi.string().required().allow(null, ""),
    new_password: Joi.string()
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
    confirm_password: Joi.string()
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
