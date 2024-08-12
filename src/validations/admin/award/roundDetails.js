import { celebrate, Joi } from "celebrate";

export const roundDetails = celebrate({
  query: Joi.object({
    award_id: Joi.number().required(),
    round_id: Joi.number().required(),
  }),
});
