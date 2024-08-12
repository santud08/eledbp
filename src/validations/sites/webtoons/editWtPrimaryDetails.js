import { celebrate, Joi } from "celebrate";

export const editWtPrimaryDetails = celebrate({
  body: Joi.object({
    title_id: Joi.number().required(),
    name: Joi.string().required(),
    title_status: Joi.string().required(),
    relation_id: Joi.number().allow(null).allow("").optional(),
    tmdb_id: Joi.number().allow(null).allow("").optional(),
    naver_id: Joi.number().allow(null).allow("").optional(),
    kakao_id: Joi.number().allow(null).allow("").optional(),
    site_language: Joi.string().required(),
    summary: Joi.string().allow(null).allow("").optional(),
    official_site: Joi.string().allow(null).allow("").optional(),
    search_keyword: Joi.string().allow(null).allow("").optional(),
    release_date: Joi.date().allow(null).allow("").optional(),
    release_date_to: Joi.date().allow(null).allow("").optional(),
    rating: Joi.number().allow(null).allow("").optional(),
    certification: Joi.string().allow(null).allow("").optional(),
    language: Joi.string().allow(null).allow("").optional(),
    country: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().optional().allow("", null),
          country_id: Joi.number().optional().allow("", null),
        }),
      )
      .allow("", null)
      .optional(),
    connections: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().optional().allow("", null),
          related_title_id: Joi.number().optional().allow("", null),
        }),
      )
      .allow("", null)
      .optional(),
    original_work: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().optional().allow("", null),
          type: Joi.string().required(),
          title: Joi.string().required(),
          original_artist: Joi.string().required(),
        }),
      )
      .allow(null)
      .allow("")
      .optional(),
    weekly_telecast_days: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().optional().allow("", null),
          day: Joi.string().optional().allow("", null),
        }),
      )
      .allow("", null)
      .optional(),
  }),
});
