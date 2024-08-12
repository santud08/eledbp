import { celebrate, Joi } from "celebrate";

export const fileDownload = celebrate({
  query: Joi.object({
    url: Joi.string().required(),
    ul: Joi.boolean().optional().allow(true, false),
  }),
});
