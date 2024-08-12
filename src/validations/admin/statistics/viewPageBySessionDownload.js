import { celebrate, Joi } from "celebrate";

export const viewPageBySessionDownload = celebrate({
  body: Joi.object({
    search_params: Joi.object({
      page_type: Joi.string()
        .optional()
        .valid("movie", "tv", "webtoons", "people", "video", "award", "tag", "company")
        .allow("", null),
      start_date: Joi.date().iso().optional().allow("", null),
      end_date: Joi.date().iso().optional().allow("", null),
    }).required(),
  }),
});
