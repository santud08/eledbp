import { celebrate, Joi } from "celebrate";

export const pageViewByTypeDownload = celebrate({
  body: Joi.object({
    search_params: Joi.object({
      page_title: Joi.string().optional().allow("", null),
      start_date: Joi.date().iso().optional().allow("", null),
      end_date: Joi.date().iso().optional().allow("", null),
    }).required(),
    list_type: Joi.string()
      .required()
      .valid("movie", "tv", "webtoons", "people", "video", "award", "tag", "company"),
  }),
});
