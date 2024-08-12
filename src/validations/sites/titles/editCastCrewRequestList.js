import { celebrate, Joi } from "celebrate";
export const editCastCrewRequestList = celebrate({
  body: Joi.object({
    title_id: Joi.number().required(),
    draft_request_id: Joi.number().optional().allow("", null),
    title_type: Joi.string().required().valid("movie", "tv"),
    site_language: Joi.string().required(),
    credit_type: Joi.string().required().valid("cast", "crew"),
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
  }),
});
