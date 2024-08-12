import { celebrate, Joi } from "celebrate";
export const editMediaDetails = celebrate({
  body: Joi.object({
    title_id: Joi.number().required(),
    draft_request_id: Joi.number().allow(null).allow("").optional(),
    title_type: Joi.string().required().valid("movie", "tv"),
    draft_media_id: Joi.number().allow(null).allow("").optional(),
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
    video_list: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().optional().allow("", null),
          action_type: Joi.string().optional().allow("", null),
          video_url: Joi.string().required(),
          video_title: Joi.string().required(),
          is_official_trailer: Joi.string().optional().valid("y", "n"),
          video_language: Joi.string().optional().allow("", null),
          thumbnail: Joi.string().allow(null).allow("").optional(),
          view_count: Joi.number().allow(null).allow("").optional(),
          video_duration: Joi.string().allow(null).allow("").optional(),
        }),
      )
      .allow(null)
      .allow("")
      .optional(),
    background_image: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().optional().allow("", null),
          action_type: Joi.string().optional().allow("", null),
          originalname: Joi.string().optional().allow("", null),
          filename: Joi.string().required(),
          path: Joi.string().required(),
          size: Joi.number().optional().allow("", null),
          mime_type: Joi.string().optional().allow("", null),
        }),
      )
      .allow(null)
      .allow("")
      .optional(),
    image_list: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().optional().allow("", null),
          action_type: Joi.string().optional().allow("", null),
          originalname: Joi.string().optional().allow("", null),
          filename: Joi.string().required(),
          path: Joi.string().required(),
          size: Joi.number().optional().allow("", null),
          mime_type: Joi.string().optional().allow("", null),
        }),
      )
      .allow(null)
      .allow("")
      .optional(),
    poster_image_list: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().optional().allow("", null),
          action_type: Joi.string().optional().allow("", null),
          originalname: Joi.string().optional().allow("", null),
          filename: Joi.string().required(),
          path: Joi.string().required(),
          size: Joi.number().optional().allow("", null),
          mime_type: Joi.string().optional().allow("", null),
          is_main_poster: Joi.string().optional().valid("y", "n"),
        }),
      )
      .allow(null)
      .allow("")
      .optional(),
  }),
});
