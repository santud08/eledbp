import { celebrate, Joi } from "celebrate";

export const editGetWtPrimaryDetails = celebrate({
  query: Joi.object({
    title_id: Joi.number().required(),
    request_id: Joi.number().allow(null).allow("").optional(),
    site_language: Joi.string().required(),
  }),
});
