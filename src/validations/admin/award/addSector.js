import { celebrate, Joi } from "celebrate";
import { validationHelper } from "../../../helpers/index.js";

export const addSector = celebrate({
  body: Joi.object({
    award_id: Joi.number().required(),
    division_name_ko: Joi.string().allow("").allow(null).optional(),
    division_name_en: Joi.string().allow("").allow(null).optional(),
  }).custom((value) => {
    const validateRes = validationHelper.validateDivisionNameCheck(value);
    if (validateRes === true) {
      return value;
    } else {
      throw new Error(`${validateRes}`);
    }
  }),
});
