import { celebrate, Joi } from "celebrate";

export const exportList = celebrate({
  body: Joi.object({
    search_file_name: Joi.string().optional().allow("", null),
    search_date: Joi.date().optional().allow("", null),
    sort_by: Joi.string()
      .optional()
      .valid("", null, "id", "file_name", "creation_date", "message", "status"),
    sort_order: Joi.string().optional().valid("", null, "asc", "desc"),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
});
