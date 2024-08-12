import { celebrate, Joi } from "celebrate";

export const addMainCategory = celebrate({
  body: Joi.object({
    category_name_en: Joi.string().required(),
    category_name_ko: Joi.string().required(),
  }),
});
