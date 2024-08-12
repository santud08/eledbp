import { celebrate, Joi } from "celebrate";

export const categoryList = celebrate({
  query: Joi.object({
    category_name: Joi.string().optional().allow("", null),
  }),
});
