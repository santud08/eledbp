import { celebrate, Joi } from "celebrate";
export const tagFilterSearchList = celebrate({
  query: Joi.object({
    category_id: Joi.string().allow("").optional(),
    subcategory_id: Joi.string().allow("").optional(),
    search_text: Joi.string().allow("").optional(),
  }),
});
