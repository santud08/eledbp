import { celebrate, Joi } from "celebrate";
export const addMoviePrimaryDetails = celebrate({
  body: Joi.object({
    name: Joi.string().required(),
    title_status: Joi.string().required().valid(),
    relation_id: Joi.number().allow(null).allow("").optional(),
    tmdb_id: Joi.number().allow(null).allow("").optional(),
    kobis_id: Joi.string().allow(null).allow("").optional(),
    tiving_id: Joi.string().allow(null).allow("").optional(),
    odk_id: Joi.string().allow(null).allow("").optional(),
    imdb_id: Joi.string().allow(null).allow("").optional(),
    site_language: Joi.string().required(),
    aka: Joi.string().allow(null).allow("").optional(),
    summary: Joi.string().allow(null).allow("").optional(),
    plot: Joi.string().allow(null).allow("").optional(),
    official_site: Joi.string().allow(null).allow("").optional(),
    search_keyword: Joi.string().allow(null).allow("").optional(),
    news_search_keyword: Joi.string().allow(null).allow("").optional(),
    release_date: Joi.date().allow(null).allow("").optional(),
    is_rerelease: Joi.number().allow(null).allow("").optional().valid(0, 1),
    re_release: Joi.array().items(Joi.string().optional()).allow("", null).optional(),
    runtime: Joi.number().allow(null).allow("").optional(),
    footfalls: Joi.number().allow(null).allow("").optional(),
    certification: Joi.string().allow(null).allow("").optional(),
    language: Joi.string().allow(null).allow("").optional(),
    country: Joi.array().items(Joi.number().optional()).allow("", null).optional(),
    connections: Joi.array().items(Joi.number().optional()).allow("", null).optional(),
    series: Joi.array()
      .items(
        Joi.object({
          title_id: Joi.number().allow(null).allow("").optional(),
          tmdb_id: Joi.number().allow(null).allow("").optional(),
        }),
      )
      .allow(null)
      .allow("")
      .optional(),
    original_work: Joi.array()
      .items(
        Joi.object({
          type: Joi.string().required(),
          title: Joi.string().required(),
          original_artist: Joi.string().required(),
        }),
      )
      .allow(null)
      .allow("")
      .optional(),
    watch_on_stream: Joi.array()
      .items(
        Joi.object({
          ott_provider_id: Joi.number().optional().allow("", null),
          ott_provider_provided_id: Joi.string().optional().allow("", null),
        }),
      )
      .allow(null)
      .allow("")
      .optional(),
    watch_on_rent: Joi.array()
      .items(
        Joi.object({
          ott_provider_id: Joi.number().optional().allow("", null),
          ott_provider_provided_id: Joi.string().optional().allow("", null),
        }),
      )
      .allow(null)
      .allow("")
      .optional(),
    watch_on_buy: Joi.array()
      .items(
        Joi.object({
          ott_provider_id: Joi.number().optional().allow("", null),
          ott_provider_provided_id: Joi.string().optional().allow("", null),
        }),
      )
      .allow(null)
      .allow("")
      .optional(),
  }),
});
