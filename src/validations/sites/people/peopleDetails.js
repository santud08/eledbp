import { celebrate, Joi } from "celebrate";

export const peopleDetails = celebrate({
  params: Joi.object({
    id: Joi.number().required(),
  }),
});
