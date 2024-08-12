import { celebrate, Joi } from "celebrate";
export const creditPeopleSearchList = celebrate({
  body: Joi.object({
    search_text: Joi.string().required(),
    site_language: Joi.string().required(),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
});
