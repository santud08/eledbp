import { celebrate, Joi } from "celebrate";

export const agencyList = celebrate({
  body: Joi.object({
    agency_id: Joi.string().optional().allow("", null),
    agency_name: Joi.string().optional().allow("", null),
    sort_by: Joi.string().optional().valid("", null, "id", "agency_id", "agency_name"),
    sort_order: Joi.string().optional().valid("", null, "asc", "desc"),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
});
