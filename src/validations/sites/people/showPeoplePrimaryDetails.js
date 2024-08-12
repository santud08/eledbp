import { celebrate, Joi } from "celebrate";
export const showPeoplePrimaryDetails = celebrate({
  query: Joi.object({
    relation_id: Joi.number().allow(null).allow("").optional(),
    site_language: Joi.string().required(),
    tmdb_id: Joi.number().allow(null).allow("").optional(),
    kobis_id: Joi.number().allow(null).allow("").optional(),
  }),
});
