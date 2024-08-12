import { celebrate, Joi } from "celebrate";

export const workList = celebrate({
  query: Joi.object({
    search_text: Joi.string().required().allow("", null),
    page: Joi.number().required().allow("", null),
    limit: Joi.number().required().allow("", null),
    sort_order: Joi.string().optional().allow("", null),
    sort_by: Joi.string().optional().allow("", null),
  }),
});
