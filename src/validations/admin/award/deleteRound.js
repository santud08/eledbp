import { celebrate, Joi } from "celebrate";

export const deleteRound = celebrate({
  body: Joi.object({
    round_id: Joi.number().required(),
    award_id: Joi.number().required(),
  }),
});
