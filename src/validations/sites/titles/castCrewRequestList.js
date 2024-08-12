import { celebrate, Joi } from "celebrate";
export const castCrewRequestList = celebrate({
  body: Joi.object({
    draft_request_id: Joi.number().required(),
    title_type: Joi.string().required().valid("movie", "tv"),
    site_language: Joi.string().required(),
    credit_type: Joi.string().required().valid("cast", "crew"),
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
  }),
});
