import { celebrate, Joi } from "celebrate";

export const importFileList = celebrate({
  body: Joi.object({
    search_file_name: Joi.string().optional().allow("", null),
    upload_date: Joi.string().optional().allow("", null),
    sort_by: Joi.string().optional().valid("", null, "created_at", "file_name", "upload_date"),
    sort_order: Joi.string().optional().valid("", null, "asc", "desc"),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
});
