import { celebrate, Joi } from "celebrate";

export const awardEdit = celebrate({
  body: Joi.object({
    id: Joi.number().required(),
    type: Joi.string().required().valid("movie", "tv", "webtoons", "people"),
    award_name_ko: Joi.string().allow(null).allow("").optional(),
    award_name_en: Joi.string().required(),
    country: Joi.number().required(),
    city_name: Joi.string().allow(null).allow("").optional(),
    place: Joi.string().allow(null).allow("").optional(),
    event_month: Joi.number().required(),
    news_search_keyword: Joi.string().allow(null).allow("").optional(),
    website_url: Joi.string().allow(null).allow("").optional(),
    explanation_en: Joi.string().allow(null).allow("").optional(),
    explanation_ko: Joi.string().allow(null).allow("").optional(),
    poster_image: Joi.array()
      .items(
        Joi.object({
          originalname: Joi.string().optional().allow("", null),
          filename: Joi.string().required(),
          path: Joi.string().required(),
          size: Joi.number().optional().allow("", null),
          mime_type: Joi.string().optional().allow("", null),
        }),
      )
      .allow(null)
      .allow("")
      .optional(),
    is_poster_deleted: Joi.string().required().valid("y", "n"),
  }),
});
