import { celebrate, Joi } from "celebrate";
export const editGetTvPrimaryDetails = celebrate({
  query: Joi.object({
    title_id: Joi.number().required(),
    request_id: Joi.number().allow(null).allow("").optional(),
    site_language: Joi.string().required(),
    tmdb_id: Joi.number().allow(null).allow("").optional(),
  }),
});
