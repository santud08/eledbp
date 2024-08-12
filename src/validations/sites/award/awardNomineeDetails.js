import { celebrate, Joi } from "celebrate";

export const awardNomineeDetails = celebrate({
  query: Joi.object({
    id: Joi.number().required(),
    round_id: Joi.number().required(),
  }),
});
