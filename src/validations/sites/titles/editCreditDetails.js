import { celebrate, Joi } from "celebrate";
export const editCreditDetails = celebrate({
  body: Joi.object({
    title_id: Joi.number().required(),
    draft_request_id: Joi.number().allow(null).allow("").optional(),
    title_type: Joi.string().required().valid("movie", "tv"),
    draft_credit_id: Joi.number().allow(null).allow("").optional(),
    site_language: Joi.string().required(),
    season_id: Joi.number()
      .required()
      .when("title_type", {
        is: Joi.string().valid("tv"),
        then: Joi.number().allow(null).allow("").optional(),
      })
      .concat(
        Joi.number()
          .optional()
          .when("title_type", {
            is: Joi.string().valid("movie"),
            then: Joi.number().allow(null).allow("").optional(),
          }),
      ),
    draft_season_id: Joi.number()
      .required()
      .when("title_type", {
        is: Joi.string().valid("tv"),
        then: Joi.number().allow(null).allow("").optional(),
      })
      .concat(
        Joi.number()
          .optional()
          .when("title_type", {
            is: Joi.string().valid("movie"),
            then: Joi.number().allow(null).allow("").optional(),
          }),
      ),
    cast_details: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().optional().allow("", null),
          temp_id: Joi.number().optional().allow("", null),
          action_type: Joi.string().optional().valid("a", "e", "d").allow("", null),
          people_id: Joi.number().optional().allow("", null),
          cast_name: Joi.string().optional().allow("", null),
          character_name: Joi.string().optional().allow("", null),
          job: Joi.string().optional().allow("", null),
          is_guest: Joi.number().optional().valid(0, 1),
          poster: Joi.string().optional().allow("", null),
          tmdb_id: Joi.number().optional().allow("", null),
          order: Joi.number().required(),
        }),
      )
      .allow(null)
      .allow("")
      .optional(),
    crew_details: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().optional().allow("", null),
          temp_id: Joi.number().optional().allow("", null),
          action_type: Joi.string().optional().valid("a", "e", "d").allow("", null),
          people_id: Joi.number().optional().allow("", null),
          cast_name: Joi.string().optional().allow("", null),
          job: Joi.string().optional().allow("", null),
          poster: Joi.string().optional().allow("", null),
          tmdb_id: Joi.number().optional().allow("", null),
          order: Joi.number().required(),
        }),
      )
      .allow(null)
      .allow("")
      .optional(),
  }),
});
