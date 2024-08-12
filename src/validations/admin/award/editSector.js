import { celebrate, Joi } from "celebrate";
import { validationHelper } from "../../../helpers/index.js";

export const editSector = celebrate({
  body: Joi.object({
    id: Joi.number().required(),
    award_id: Joi.number().required(),
    division_name_ko: Joi.string().allow("").allow(null).optional(),
    division_name_en: Joi.string().allow("").allow(null).optional(),
    status: Joi.string().optional().valid("active", "inactive"),
  }).custom((value) => {
    const validateRes = validationHelper.validateDivisionNameCheck(value);
    if (validateRes === true) {
      return value;
    } else {
      throw new Error(`${validateRes}`);
    }
  }),
});
