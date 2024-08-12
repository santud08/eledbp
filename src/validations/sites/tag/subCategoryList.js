import { celebrate, Joi } from "celebrate";
export const subCategoryList = celebrate({
  query: Joi.object({
    language: Joi.string().required(),
  }),
});
