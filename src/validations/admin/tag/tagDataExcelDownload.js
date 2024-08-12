import { celebrate, Joi } from "celebrate";

export const tagDataExcelDownload = celebrate({
  query: Joi.object({
    category_id: Joi.number().optional().allow("", null),
    sub_category_id: Joi.number().optional().allow("", null),
    tag_name: Joi.string().optional().allow("", null),
  }),
});
