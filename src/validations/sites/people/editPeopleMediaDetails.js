import { celebrate, Joi } from "celebrate";
export const editPeopleMediaDetails = celebrate({
  body: Joi.object({
    draft_request_id: Joi.number().allow("").optional(),
    people_id: Joi.number().required(),
    draft_media_id: Joi.number().allow(null).allow("").optional(),
    site_language: Joi.string().required(),
    video_list: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().optional().allow("", null),
          video_url: Joi.string().required(),
          video_title: Joi.string().required(),
          is_official_trailer: Joi.string().optional().valid("y", "n"),
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
  }),
});
