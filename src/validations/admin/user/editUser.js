import { celebrate, Joi } from "celebrate";
import { validationHelper } from "../../../helpers/index.js";

export const editUser = celebrate({
  body: Joi.object({
    id: Joi.number().required(),
    role_id: Joi.number().required(),
    name: Joi.string().required(),
    password: Joi.string()
      .optional()
      .allow("", null)
      .min(8)
      .max(15)
      .custom((value) => {
        if (value) {
          const validateRes = validationHelper.adminPasswordRule(value);
          if (validateRes === true) {
            return value;
          } else {
            throw new Error(`${validateRes}`);
          }
        } else {
          return value;
        }
      }),
  }),
});
