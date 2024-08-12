import { celebrate, Joi } from "celebrate";
export const mediaRequestList = celebrate({
  body: Joi.object({
    draft_request_id: Joi.number().required(),
    title_type: Joi.string().required().valid("movie", "tv"),
    site_language: Joi.string().required(),
    media_type: Joi.string().required().valid("video", "image", "poster"),
    season_no: Joi.number().allow(null).allow("").optional(),
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
