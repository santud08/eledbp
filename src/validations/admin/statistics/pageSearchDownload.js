import { celebrate, Joi } from "celebrate";

export const pageSearchDownload = celebrate({
  body: Joi.object({
    search_params: Joi.object({
      search_keyword: Joi.string().optional().allow("", null),
      landing_keyword: Joi.string().optional().allow("", null),
      start_date: Joi.date().iso().optional().allow("", null),
      end_date: Joi.date().iso().optional().allow("", null),
    }).required(),
  }),
});
