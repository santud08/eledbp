import { celebrate, Joi } from "celebrate";
export const getTvPrimaryDetails = celebrate({
  query: Joi.object({
    request_id: Joi.number().allow(null).allow("").optional(),
    site_language: Joi.string().required(),
    tmdb_id: Joi.number().allow(null).allow("").optional(),
  }),
});
