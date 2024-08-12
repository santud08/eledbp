import { celebrate, Joi } from "celebrate";

export const userList = celebrate({
  query: Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
    type: Joi.number().optional().allow("", null),
    name: Joi.string().optional().allow("", null),
    search_date_type: Joi.string().optional().allow("", null, "created_date", "last_login_date"),
    start_date: Joi.date().iso().optional().allow("", null),
    end_date: Joi.date().iso().optional().allow("", null),
    sort_by: Joi.string().optional().allow("", null).valid("type", "email", "created_at"),
    sort_order: Joi.string().optional().allow("", null).valid("asc", "desc"),
  }),
});
