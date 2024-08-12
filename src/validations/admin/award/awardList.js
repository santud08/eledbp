import { celebrate, Joi } from "celebrate";
export const awardList = celebrate({
  body: Joi.object({
    search_params: Joi.object({
      search_type: Joi.string().optional().valid("", "movie", "tv", "webtoons", "people"),
      search_award_name_ko: Joi.optional().allow("", null),
      search_award_name_en: Joi.optional().allow("", null),
      search_country_id: Joi.optional().allow("", null),
      event_month: Joi.optional().allow("", null),
    }).optional(),
    sort_order: Joi.string().optional().valid("", "desc", "asc"),
    sort_by: Joi.optional().allow("", null),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
});
