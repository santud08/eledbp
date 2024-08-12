import { celebrate, Joi } from "celebrate";

export const nomineeDetails = celebrate({
  query: Joi.object({
    award_id: Joi.number().required(),
    nominee_id: Joi.number().required(),
    round_id: Joi.number().required(),
  }),
});
