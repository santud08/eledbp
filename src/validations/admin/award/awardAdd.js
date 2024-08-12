import { celebrate, Joi } from "celebrate";

export const awardAdd = celebrate({
  body: Joi.object({
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
    poster_image: Joi.string().allow(null).allow("").optional(),
  }),
});
