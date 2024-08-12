import { celebrate, Joi } from "celebrate";
export const searchResults = celebrate({
  body: Joi.object({
    search_text: Joi.string().required(),
    search_type: Joi.string()
      .required()
      .valid("movies", "tv_shows", "webtoons", "videos", "people", "award", "tags", "companies"),
    sort_by: Joi.string()
      .required()
      .when("search_type", {
        is: Joi.string().valid("movies"),
        then: Joi.valid("latest", "oldest", "popularity", "default"),
      })
      .concat(
        Joi.string().when("search_type", {
          is: Joi.string().valid("tv_shows"),
          then: Joi.valid("latest", "oldest", "popularity", "default"),
        }),
      )
      .concat(
        Joi.string().when("search_type", {
          is: Joi.string().valid("people"),
          then: Joi.valid("alphabetic", "birth_year", "popularity", "default"),
        }),
      )
      .concat(
        Joi.string().when("search_type", {
          is: Joi.string().valid("tags"),
          then: Joi.valid("alphabetic"),
        }),
      )
      .concat(
        Joi.string().when("search_type", {
          is: Joi.string().valid("companies"),
          then: Joi.valid("alphabetic"),
        }),
      )
      .concat(
        Joi.string().when("search_type", {
          is: Joi.string().valid("videos"),
          then: Joi.valid("latest", "oldest", "popularity", "default"),
        }),
      )
      .concat(
        Joi.string().when("search_type", {
          is: Joi.string().valid("webtoons"),
          then: Joi.valid("latest", "oldest", "popularity", "default"),
        }),
      ),
    sort_order: Joi.string().required().valid("asc", "desc"),
    is_first: Joi.string().optional().valid("yes", "no"),
    page: Joi.number().required(),
    limit: Joi.number().required(),
  }),
});
