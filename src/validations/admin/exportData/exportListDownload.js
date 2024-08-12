import { celebrate, Joi } from "celebrate";

export const exportListDownload = celebrate({
  query: Joi.object({
    id: Joi.number().required(),
  }),
});
