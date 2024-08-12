import { celebrate, Joi } from "celebrate";

export const addTag = celebrate({
  body: Joi.object({
    parent_id: Joi.number().required(),
    sub_category_id: Joi.number().required(),
    tag_name_en: Joi.string().required(),
    tag_name_ko: Joi.string().required(),
  }),
});
