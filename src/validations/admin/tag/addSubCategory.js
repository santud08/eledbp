import { celebrate, Joi } from "celebrate";

export const addSubCategory = celebrate({
  body: Joi.object({
    parent_id: Joi.number().required(),
    sub_category_name_en: Joi.string().required(),
    sub_category_name_ko: Joi.string().required(),
  }),
});
