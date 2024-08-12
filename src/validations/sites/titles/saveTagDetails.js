import { celebrate, Joi } from "celebrate";
export const saveTagDetails = celebrate({
  body: Joi.object({
    draft_request_id: Joi.number().required(),
    draft_tag_id: Joi.number().allow(null).allow("").optional(),
    site_language: Joi.string().required(),
    genre_details: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().optional().allow("", null),
          title: Joi.string().optional().allow("", null),
          score: Joi.number().optional().allow("", null),
        }),
      )
      .allow(null)
      .allow("")
      .optional(),
    tag_details: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().optional().allow("", null),
          title: Joi.string().optional().allow("", null),
          score: Joi.number().optional().allow("", null),
        }),
      )
      .allow(null)
      .allow("")
      .optional(),
  }),
});
