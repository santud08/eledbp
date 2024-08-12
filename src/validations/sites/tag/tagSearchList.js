import { celebrate, Joi } from "celebrate";
export const tagSearchList = celebrate({
  query: Joi.object({
    search_text: Joi.string().allow("").optional(),
    language: Joi.string().required(),
  }),
});
