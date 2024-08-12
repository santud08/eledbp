import { celebrate, Joi } from "celebrate";

export const tagList = celebrate({
  body: Joi.object({
    category_id: Joi.number().optional().allow("", null),
    sub_category_id: Joi.number().optional().allow("", null),
    tag_name: Joi.string().optional().allow("", null),
    sort_by: Joi.string()
      .optional()
      .valid("", null, "id", "category_name", "sub_category_name", "tag_name_en", "tag_name_ko"),
    sort_order: Joi.string().optional().valid("", null, "asc", "desc"),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
});
