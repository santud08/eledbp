import { celebrate, Joi } from "celebrate";
export const editShowPeoplePrimaryDetails = celebrate({
  query: Joi.object({
    relation_id: Joi.number().allow(null).allow("").optional(),
    site_language: Joi.string().required(),
    people_id: Joi.number().required(),
  }),
});
