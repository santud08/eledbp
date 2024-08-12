import { celebrate, Joi } from "celebrate";

export const workList = celebrate({
  body: Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
    search_type: Joi.string().optional().allow("", null),
    search_title_name: Joi.string().optional().allow("", null),
    search_id_type: Joi.string().optional().allow("", null),
    search_id: Joi.string().optional().allow("", null),
    search_date: Joi.string().optional().allow("", null),
    tiving_id: Joi.string().optional().allow("", null),
    sort_by: Joi.string()
      .optional()
      .allow("", null, "type", "title", "unique_id", "modified_date", "tiving_id", "worker"),
    sort_order: Joi.string().optional().allow("", null, "asc", "desc"),
  }),
});
