import { celebrate, Joi } from "celebrate";
export const relatedArticle = celebrate({
  query: Joi.object({
    person_id: Joi.number().required(),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
});
