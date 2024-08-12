import { celebrate, Joi } from "celebrate";
export const addCreditDetails = celebrate({
  body: Joi.object({
    draft_request_id: Joi.number().required(),
    title_type: Joi.string().required().valid("movie", "tv"),
    draft_credit_id: Joi.number().allow(null).allow("").optional(),
    site_language: Joi.string().required(),
    season_id: Joi.number()
      .required()
      .when("title_type", {
        is: Joi.string().valid("tv"),
        then: Joi.number().required(),
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
