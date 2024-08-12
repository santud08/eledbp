import { celebrate, Joi } from "celebrate";

export const getWebtoonsPrimaryDetails = celebrate({
  query: Joi.object({
    request_id: Joi.number().allow(null, "").optional(),
    site_language: Joi.string().required(),
  }),
});
