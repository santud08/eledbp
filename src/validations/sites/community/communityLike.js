import { celebrate, Joi } from "celebrate";
export const communityLike = celebrate({
  body: Joi.object({
    community_id: Joi.number().required(),
  }),
});
