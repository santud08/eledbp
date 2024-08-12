import { celebrate, Joi } from "celebrate";

export const detailsConnectionList = celebrate({
  params: Joi.object({
    id: Joi.number().required(),
  }),
});
