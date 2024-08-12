import { celebrate, Joi } from "celebrate";

export const awardDetails = celebrate({
  params: Joi.object({
    id: Joi.number().required(),
  }),
});
