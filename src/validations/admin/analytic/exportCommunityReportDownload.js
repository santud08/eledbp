import { celebrate, Joi } from "celebrate";

export const exportCommunityReportDownload = celebrate({
  body: Joi.object({
    search_params: Joi.object({
      category: Joi.string().required().valid("movie", "tv", "webtoons", "people"),
      start_date: Joi.date().iso().optional().allow("", null),
      end_date: Joi.date().iso().optional().allow("", null),
    }).required(),
    list_type: Joi.string().required().valid("comment", "trivia", "famous_line", "goofs"),
  }),
});
