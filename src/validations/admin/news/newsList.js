import { celebrate, Joi } from "celebrate";

export const newsList = celebrate({
  body: Joi.object({
    search_text: Joi.string().optional().allow("", null),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
});
