import { celebrate, Joi } from "celebrate";
import { validationHelper } from "../../../helpers/index.js";

export const agencyAdd = celebrate({
  body: Joi.object({
    name_en: Joi.string().required(),
    address_en: Joi.string().optional().allow("", null),
    aka_en: Joi.string().optional().allow("", null),
    name_ko: Joi.string().required(),
    address_ko: Joi.string().optional().allow("", null),
    aka_ko: Joi.string().optional().allow("", null),
    agency_code: Joi.string().required(),
    email: Joi.string().optional().allow("", null).email(),
    phone_number: Joi.string()
      .optional()
      .max(20)
      .allow("", null)
      .custom((value) => {
        const validateRes = validationHelper.numericDigitCheck(value);
        if (validateRes === true) {
          return value;
        } else {
          throw new Error(`${validateRes}`);
        }
      }),
    fax: Joi.string()
      .optional()
      .max(20)
      .allow("", null)
      .custom((value) => {
        const validateRes = validationHelper.numericDigitCheck(value);
        if (validateRes === true) {
          return value;
        } else {
          throw new Error(`${validateRes}`);
        }
      }),
    site_link: Joi.string().optional().allow("", null),
    instagram_link: Joi.string().optional().allow("", null),
    facebook_link: Joi.string().optional().allow("", null),
    twitter_link: Joi.string().optional().allow("", null),
    youtube_link: Joi.string().optional().allow("", null),
    manager_details: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().optional().allow("", null),
          name_en: Joi.string().required(),
          name_ko: Joi.string().required(),
          email: Joi.string().optional().allow("", null).email(),
          phone: Joi.string()
            .optional()
            .max(20)
            .allow("", null)
            .custom((value) => {
              const validateRes = validationHelper.numericDigitCheck(value);
              if (validateRes === true) {
                return value;
              } else {
                throw new Error(`${validateRes}`);
              }
            }),
          artists: Joi.array().items(Joi.number().required().min(1).required()),
        }),
      )
      .optional(),
  }),
});
