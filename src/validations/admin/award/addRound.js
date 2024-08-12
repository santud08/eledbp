import { celebrate, Joi } from "celebrate";

export const addRound = celebrate({
  body: Joi.object({
    award_id: Joi.number().required(),
    year: Joi.number().integer().min(1960).max(2100).required(),
    round: Joi.number().integer().allow("").allow(null).min(1).max(1000).optional(),
    round_name: Joi.string().optional(),
    round_date: Joi.date().when("round_end_date", {
      is: Joi.date().required(),
      then: Joi.date().required().less(Joi.ref("round_end_date")).label("Start Date").messages({
        "date.base": "{{#label}} must be a valid date",
        "date.less": "{{#label}} must be less than End Date",
        "any.required": "{{#label}} is required when an End Date is provided",
      }),
    }),
    round_end_date: Joi.date().optional().label("End Date").messages({
      "date.base": "{{#label}} must be a valid date",
    }),
  }),
});
