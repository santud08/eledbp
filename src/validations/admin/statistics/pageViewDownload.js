import { celebrate, Joi } from "celebrate";

export const pageViewDownload = celebrate({
  body: Joi.object({
    search_params: Joi.object({
      access_platform: Joi.string().optional().allow("", null),
      page_type: Joi.string()
        .optional()
        .valid("movie", "tv", "webtoons", "people", "video", "award", "tag", "company")
        .allow("", null),
      page_title: Joi.string().optional().allow("", null),
      utm_source: Joi.string().optional().allow("", null),
      start_date: Joi.date().iso().optional().allow("", null),
      end_date: Joi.date().iso().optional().allow("", null),
    }).required(),
  }),
});
