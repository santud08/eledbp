import { celebrate, Joi } from "celebrate";

export const addSearchStatistics = celebrate({
  body: Joi.object({
    search_text: Joi.string().optional().allow("", null),
    goto_text: Joi.string().optional().allow("", null),
    search_sort: Joi.string().optional().allow("", null),
    goto_url: Joi.string().optional().allow("", null),
    view_id: Joi.number().optional().allow("", null),
    type: Joi.string()
      .optional()
      //.valid("movie", "tv", "webtoons", "people", "video", "tag", "company", "award")
      .valid("movies", "tv_shows", "webtoons", "videos", "people", "award", "tags", "companies")
      .allow("", null),
    release_at: Joi.date().iso().optional().allow("", null),
    statistic_id: Joi.number().required().allow("", null),
  }),
});
