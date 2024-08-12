import { celebrate, Joi } from "celebrate";
export const searchTitle = celebrate({
  body: Joi.object({
    title_type: Joi.string().required().valid("movie", "tv", "webtoons"),
    search_type: Joi.string()
      .required()
      .when("title_type", {
        is: Joi.string().valid("movie"),
        then: Joi.valid("title", "tmdb_id", "kobis_id", "imdb_id", "tiving_id", "odk_id"),
      })
      .concat(
        Joi.string().when("title_type", {
          is: Joi.string().valid("tv"),
          then: Joi.valid("title", "tmdb_id", "tiving_id", "imdb_id", "odk_id"),
        }),
      )
      .concat(
        Joi.string().when("title_type", {
          is: Joi.string().valid("webtoons"),
          then: Joi.valid("title", "naver_id", "kakao_id", "tmdb_id"),
        }),
      ),
    search_text: Joi.string().required(),
    sort_by: Joi.string().required().valid("newest", "oldest"),
    page: Joi.number().required().optional(),
    limit: Joi.number().required().optional(),
  }),
});
