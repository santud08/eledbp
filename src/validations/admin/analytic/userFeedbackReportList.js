import { celebrate, Joi } from "celebrate";

export const userFeedbackReportList = celebrate({
  body: Joi.object({
    search_params: Joi.object({
      category: Joi.string().required().valid("movie", "tv", "webtoons", "people", "awards"),
      start_date: Joi.date().iso().optional().allow("", null),
      end_date: Joi.date().iso().optional().allow("", null),
    }).required(),
    list_type: Joi.string().required().valid("like", "rating", "share"),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
});
