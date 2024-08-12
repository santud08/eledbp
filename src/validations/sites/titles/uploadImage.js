import { celebrate, Joi } from "celebrate";
export const uploadImage = celebrate({
  body: Joi.object({
    draft_request_id: Joi.number().required(),
  }),
});
