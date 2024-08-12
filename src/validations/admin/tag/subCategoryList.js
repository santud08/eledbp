import { celebrate, Joi } from "celebrate";

export const subCategoryList = celebrate({
  query: Joi.object({
    category_id: Joi.number().required(),
    sub_category_name: Joi.string().optional().allow("", null),
  }),
});
