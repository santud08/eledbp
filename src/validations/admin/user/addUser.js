import { celebrate, Joi } from "celebrate";
import { validationHelper } from "../../../helpers/index.js";

export const addUser = celebrate({
  body: Joi.object({
    email: Joi.string().email().required(),
    role_id: Joi.number().required(),
    name: Joi.string().required(),
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
    profile_image: Joi.string().allow(null).allow("").optional(),
  }),
});
