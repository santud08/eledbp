import { celebrate, Joi } from "celebrate";
export const mainCategoryList = celebrate({
  query: Joi.object({
    type: Joi.string().allow("").optional(),
    language: Joi.string().required(),
  }),
});
